// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  findNovedadById: vi.fn(),
  deleteNovedad: vi.fn(),
}));

vi.mock("@/lib/services/current-user", () => ({
  requireUser: mocks.requireUser,
}));
vi.mock("@/lib/db/novedades", () => ({
  findNovedadById: mocks.findNovedadById,
  deleteNovedad: mocks.deleteNovedad,
}));

import { DELETE } from "./route";

const OBRA_ID = "11111111-1111-4111-8111-111111111111";
const NOVEDAD_ID = "22222222-2222-4222-8222-222222222222";

const PARAMS = {
  params: Promise.resolve({ id: OBRA_ID, novedadId: NOVEDAD_ID }),
};

const novedad = {
  id: NOVEDAD_ID,
  obraId: OBRA_ID,
  autorId: "u-2",
  autorNombre: "Juan",
  contenido: "Faltan ladrillos",
  createdAt: new Date("2026-08-03T10:00:00Z"),
};

const empleado = { id: "u-1", email: "a@b.c", name: "A", role: "EMPLOYEE" };
const admin = { id: "u-9", email: "j@b.c", name: "J", role: "ADMIN" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue(empleado);
  mocks.findNovedadById.mockResolvedValue(novedad);
  mocks.deleteNovedad.mockResolvedValue(true);
});

describe("DELETE /api/obras/[id]/novedades/[novedadId] (REQ-014)", () => {
  it("permite al autor eliminar su novedad", async () => {
    mocks.requireUser.mockResolvedValue({ ...empleado, id: "u-2" });
    const res = await DELETE(new Request("http://localhost/api/x"), PARAMS);
    expect(res.status).toBe(200);
    expect(mocks.deleteNovedad).toHaveBeenCalledWith(NOVEDAD_ID);
  });

  it("permite al jefe eliminar cualquier novedad", async () => {
    mocks.requireUser.mockResolvedValue(admin);
    const res = await DELETE(new Request("http://localhost/api/x"), PARAMS);
    expect(res.status).toBe(200);
  });

  it("niega a un empleado que no es el autor", async () => {
    const res = await DELETE(new Request("http://localhost/api/x"), PARAMS);
    expect(res.status).toBe(403);
    expect(mocks.deleteNovedad).not.toHaveBeenCalled();
  });

  it("devuelve 404 si la novedad no existe o es de otra obra", async () => {
    mocks.findNovedadById.mockResolvedValue(null);
    const res = await DELETE(new Request("http://localhost/api/x"), PARAMS);
    expect(res.status).toBe(404);
  });

  it("rechaza un id inválido (REQ-NF-002)", async () => {
    const res = await DELETE(new Request("http://localhost/api/x"), {
      params: Promise.resolve({ id: "no-es-uuid", novedadId: NOVEDAD_ID }),
    });
    expect(res.status).toBe(400);
  });
});
