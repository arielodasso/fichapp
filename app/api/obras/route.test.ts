// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  listObras: vi.fn(),
  createObra: vi.fn(),
}));

vi.mock("@/lib/services/current-user", () => ({
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/db/obras", () => ({
  listObras: mocks.listObras,
  createObra: mocks.createObra,
}));

import { GET, POST } from "./route";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/obras", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({
    id: "u-1",
    email: "jefa@example.com",
    name: "Jefa",
    role: "ADMIN",
  });
});

describe("GET /api/obras (REQ-002)", () => {
  it("devuelve la lista de obras", async () => {
    mocks.listObras.mockResolvedValue([{ id: "o-1", nombre: "Edificio Norte" }]);
    const res = await GET(new Request("http://localhost/api/obras"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ obras: [{ id: "o-1", nombre: "Edificio Norte" }] });
  });

  it("transmite el filtro de activas", async () => {
    mocks.listObras.mockResolvedValue([]);
    await GET(new Request("http://localhost/api/obras?activas=true"));
    expect(mocks.listObras).toHaveBeenCalledWith({ soloActivas: true });
  });
});

describe("POST /api/obras (REQ-002)", () => {
  it("crea una obra con estado por defecto ACTIVA", async () => {
    mocks.createObra.mockResolvedValue({ id: "o-1" });
    const res = await POST(jsonRequest({ nombre: "Edificio Norte" }));
    expect(res.status).toBe(201);
    expect(mocks.createObra).toHaveBeenCalledWith({
      nombre: "Edificio Norte",
      descripcion: null,
      estado: "ACTIVA",
    });
  });

  it("acepta un estado válido", async () => {
    mocks.createObra.mockResolvedValue({ id: "o-1" });
    await POST(
      jsonRequest({ nombre: "Obra", estado: "PAUSADA" })
    );
    expect(mocks.createObra).toHaveBeenCalledWith(
      expect.objectContaining({ estado: "PAUSADA" })
    );
  });

  it("rechaza una obra sin nombre (REQ-NF-002)", async () => {
    const res = await POST(jsonRequest({}));
    expect(res.status).toBe(400);
  });
});
