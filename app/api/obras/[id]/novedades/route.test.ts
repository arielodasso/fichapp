// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  findObraById: vi.fn(),
  listNovedadesDeObra: vi.fn(),
  createNovedad: vi.fn(),
}));

vi.mock("@/lib/services/current-user", () => ({
  requireUser: mocks.requireUser,
}));
vi.mock("@/lib/db/obras", () => ({
  findObraById: mocks.findObraById,
}));
vi.mock("@/lib/db/novedades", () => ({
  listNovedadesDeObra: mocks.listNovedadesDeObra,
  createNovedad: mocks.createNovedad,
}));

import { GET, POST } from "./route";

const OBRA_ID = "11111111-1111-4111-8111-111111111111";
const PARAMS = { params: Promise.resolve({ id: OBRA_ID }) };

const obra = {
  id: OBRA_ID,
  nombre: "Edificio Norte",
  descripcion: null,
  estado: "ACTIVA",
  activo: true,
};

const empleado = {
  id: "u-1",
  email: "juan@example.com",
  name: "Juan",
  role: "EMPLOYEE",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue(empleado);
  mocks.findObraById.mockResolvedValue(obra);
  mocks.createNovedad.mockImplementation((input: Record<string, unknown>) =>
    Promise.resolve({ ...input, id: "n-1", autorNombre: "Juan" })
  );
});

describe("GET /api/obras/[id]/novedades (REQ-014)", () => {
  it("devuelve las novedades de la obra", async () => {
    mocks.listNovedadesDeObra.mockResolvedValue([
      {
        id: "n-1",
        obraId: OBRA_ID,
        autorId: "u-1",
        autorNombre: "Juan",
        contenido: "Faltan ladrillos",
        createdAt: new Date("2026-08-03T10:00:00Z"),
      },
    ]);
    const res = await GET(new Request("http://localhost/api/obras/x"), PARAMS);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.novedades[0]).toMatchObject({
      autorNombre: "Juan",
      contenido: "Faltan ladrillos",
    });
  });

  it("rechaza un id de obra inválido (REQ-NF-002)", async () => {
    const res = await GET(new Request("http://localhost/api/obras/x"), {
      params: Promise.resolve({ id: "no-es-uuid" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/obras/[id]/novedades (REQ-014)", () => {
  it("crea una novedad con el contenido recortado", async () => {
    const res = await POST(
      new Request("http://localhost/api/obras/x", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: "  Material en camino  " }),
      }),
      PARAMS
    );
    expect(res.status).toBe(201);
    expect(mocks.createNovedad).toHaveBeenCalledWith({
      obraId: OBRA_ID,
      autorId: "u-1",
      contenido: "Material en camino",
    });
  });

  it("rechaza una novedad vacía (REQ-NF-002)", async () => {
    const res = await POST(
      new Request("http://localhost/api/obras/x", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: "   " }),
      }),
      PARAMS
    );
    expect(res.status).toBe(400);
    expect(mocks.createNovedad).not.toHaveBeenCalled();
  });

  it("rechaza una novedad que supera los 500 caracteres", async () => {
    const res = await POST(
      new Request("http://localhost/api/obras/x", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: "a".repeat(501) }),
      }),
      PARAMS
    );
    expect(res.status).toBe(400);
  });

  it("rechaza si la obra no existe", async () => {
    mocks.findObraById.mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/api/obras/x", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: "Novedad" }),
      }),
      PARAMS
    );
    expect(res.status).toBe(404);
  });
});
