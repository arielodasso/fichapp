// @vitest-environment node

import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getReporteSemanal: vi.fn(),
}));

vi.mock("@/lib/services/current-user", () => ({
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/services/reportes", () => ({
  getReporteSemanal: mocks.getReporteSemanal,
}));

import { GET } from "./route";

const reporte = {
  inicioSemana: "2026-08-03T03:00:00.000Z",
  finSemana: "2026-08-10T03:00:00.000Z",
  porObra: [
    {
      obraId: "o-1",
      obraNombre: "Edificio Norte",
      empleados: [
        { empleadoId: "e-1", nombre: "Juan", apellido: "Pérez", horas: 9.5 },
      ],
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({
    id: "u-1",
    email: "jefa@example.com",
    name: "Jefa",
    role: "ADMIN",
  });
});

describe("GET /api/reportes/semana: autorización (REQ-009)", () => {
  it("invoca el guard requireAdmin antes de armar el reporte", async () => {
    mocks.getReporteSemanal.mockResolvedValue(reporte);
    const res = await GET(new Request("http://localhost/api/reportes/semana"));
    expect(res.status).toBe(200);
    expect(mocks.requireAdmin).toHaveBeenCalled();
  });

  it("solo construye el reporte para el jefe", async () => {
    mocks.getReporteSemanal.mockResolvedValue(reporte);
    const res = await GET(new Request("http://localhost/api/reportes/semana"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(reporte);
  });
});

describe("GET /api/reportes/semana: parámetro fecha (REQ-NF-002)", () => {
  it("rechaza una fecha con formato inválido", async () => {
    const res = await GET(
      new Request("http://localhost/api/reportes/semana?fecha=no-es-fecha")
    );
    expect(res.status).toBe(400);
  });

  it("acepta una fecha válida y la envía al servicio", async () => {
    mocks.getReporteSemanal.mockResolvedValue(reporte);
    const res = await GET(
      new Request("http://localhost/api/reportes/semana?fecha=2026-08-05")
    );
    expect(res.status).toBe(200);
    expect(mocks.getReporteSemanal).toHaveBeenCalledWith(expect.any(Date));
  });
});
