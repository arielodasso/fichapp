// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  actualizarPeriodo: vi.fn(),
  marcarCorregido: vi.fn(),
  eliminarPeriodo: vi.fn(),
  PeriodoAbiertoError: class extends Error {
    constructor() {
      super("período abierto");
    }
  },
}));

vi.mock("@/lib/services/current-user", () => ({
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/db/fichadas", () => ({
  actualizarPeriodo: mocks.actualizarPeriodo,
  marcarCorregido: mocks.marcarCorregido,
  eliminarPeriodo: mocks.eliminarPeriodo,
  PeriodoAbiertoError: mocks.PeriodoAbiertoError,
}));

import { DELETE, PATCH } from "./route";

const admin = {
  id: "u-1",
  email: "jefa@example.com",
  name: "Jefa",
  role: "ADMIN",
};

const params = { params: Promise.resolve({ id: "p-1" }) };

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/periodos/p-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue(admin);
});

describe("PATCH /api/periodos/[id] (REQ-012)", () => {
  it("corrige las fechas y registra quién la corrigió", async () => {
    mocks.actualizarPeriodo.mockResolvedValue({ id: "p-1" });
    mocks.marcarCorregido.mockResolvedValue({ id: "p-1", corregido: true });

    const res = await PATCH(
      jsonRequest({
        ingresoAt: "2026-08-03T08:00:00.000Z",
        egresoAt: "2026-08-03T17:00:00.000Z",
      }),
      params
    );
    expect(res.status).toBe(200);
    expect(mocks.actualizarPeriodo).toHaveBeenCalledWith("p-1", {
      ingresoAt: expect.any(Date),
      egresoAt: expect.any(Date),
    });
    expect(mocks.marcarCorregido).toHaveBeenCalledWith("p-1", "u-1");
  });

  it("rechaza un egreso anterior al ingreso (REQ-NF-002)", async () => {
    const res = await PATCH(
      jsonRequest({
        ingresoAt: "2026-08-03T17:00:00.000Z",
        egresoAt: "2026-08-03T08:00:00.000Z",
      }),
      params
    );
    expect(res.status).toBe(400);
    expect(mocks.actualizarPeriodo).not.toHaveBeenCalled();
  });

  it("rechaza fechas inválidas", async () => {
    const res = await PATCH(jsonRequest({ ingresoAt: "no-es-fecha" }), params);
    expect(res.status).toBe(400);
  });

  it("devuelve 404 si el período no existe", async () => {
    mocks.actualizarPeriodo.mockResolvedValue(null);
    const res = await PATCH(
      jsonRequest({ ingresoAt: "2026-08-03T08:00:00.000Z", egresoAt: null }),
      params
    );
    expect(res.status).toBe(404);
  });

  it("devuelve 409 si el período queda abierto con otro ya abierto", async () => {
    mocks.actualizarPeriodo.mockRejectedValue(new mocks.PeriodoAbiertoError());
    const res = await PATCH(
      jsonRequest({ ingresoAt: "2026-08-03T08:00:00.000Z", egresoAt: null }),
      params
    );
    expect(res.status).toBe(409);
  });
});

describe("DELETE /api/periodos/[id] (REQ-012)", () => {
  it("elimina el período dejando registro de la corrección", async () => {
    mocks.eliminarPeriodo.mockResolvedValue({ id: "p-1" });
    const res = await DELETE(
      new Request("http://localhost/api/periodos/p-1", { method: "DELETE" }),
      params
    );
    expect(res.status).toBe(200);
    expect(mocks.eliminarPeriodo).toHaveBeenCalledWith("p-1", "u-1");
  });

  it("devuelve 404 si el período no existe", async () => {
    mocks.eliminarPeriodo.mockResolvedValue(null);
    const res = await DELETE(
      new Request("http://localhost/api/periodos/p-1", { method: "DELETE" }),
      params
    );
    expect(res.status).toBe(404);
  });
});
