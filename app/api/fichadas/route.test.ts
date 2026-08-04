// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findEmpleadoByUserId: vi.fn(),
  findObraById: vi.fn(),
  listObras: vi.fn(),
  listObrasDeEmpleado: vi.fn(),
  findPeriodoAbierto: vi.fn(),
  createIngreso: vi.fn(),
  cerrarPeriodo: vi.fn(),
  listPeriodosDeEmpleado: vi.fn(),
  PeriodoAbiertoError: class extends Error {
    constructor() {
      super("período abierto");
    }
  },
}));

vi.mock("@/lib/services/current-user", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));
vi.mock("@/lib/db/empleados", () => ({
  findEmpleadoByUserId: mocks.findEmpleadoByUserId,
}));
vi.mock("@/lib/db/obras", () => ({
  findObraById: mocks.findObraById,
  listObras: mocks.listObras,
  listObrasDeEmpleado: mocks.listObrasDeEmpleado,
}));
vi.mock("@/lib/db/fichadas", () => ({
  PeriodoAbiertoError: mocks.PeriodoAbiertoError,
  createIngreso: mocks.createIngreso,
  cerrarPeriodo: mocks.cerrarPeriodo,
  findPeriodoAbierto: mocks.findPeriodoAbierto,
  listPeriodosDeEmpleado: mocks.listPeriodosDeEmpleado,
}));

import { GET, POST } from "./route";

const user = {
  id: "u-1",
  email: "juan@example.com",
  name: "Juan",
  role: "EMPLOYEE",
};

const empleado = { id: "e-1", nombre: "Juan", apellido: "Pérez", obraIds: [] };

const obra = {
  id: "11111111-1111-4111-8111-111111111111",
  nombre: "Edificio Norte",
  descripcion: null,
  estado: "ACTIVA",
  activo: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ingreso = new Date("2026-08-03T08:00:00Z");

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/fichadas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue(user);
  mocks.findEmpleadoByUserId.mockResolvedValue({
    ...empleado,
    obraIds: [obra.id],
  });
  mocks.listObras.mockResolvedValue([obra]);
  mocks.listObrasDeEmpleado.mockResolvedValue([obra]);
});

describe("POST /api/fichadas: autorización", () => {
  it("rechaza sin sesión", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const res = await POST(jsonRequest({ tipo: "ingreso", obraId: obra.id }));
    expect(res.status).toBe(401);
  });

  it("rechaza si el usuario no tiene perfil de empleado", async () => {
    mocks.findEmpleadoByUserId.mockResolvedValue(null);
    const res = await POST(jsonRequest({ tipo: "ingreso", obraId: obra.id }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining("empleado") });
  });
});

describe("POST /api/fichadas: validación de entrada (REQ-NF-002)", () => {
  it("rechaza un tipo inválido", async () => {
    const res = await POST(jsonRequest({ tipo: "pausa" }));
    expect(res.status).toBe(400);
  });

  it("rechaza JSON inválido", async () => {
    const res = await POST(
      new Request("http://localhost/api/fichadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "no-es-json",
      })
    );
    expect(res.status).toBe(400);
  });

  it("rechaza un ingreso sin obra", async () => {
    const res = await POST(jsonRequest({ tipo: "ingreso" }));
    expect(res.status).toBe(400);
  });

  it("rechaza un ingreso con id de obra malformado (REQ-NF-002)", async () => {
    const res = await POST(jsonRequest({ tipo: "ingreso", obraId: "no-es-uuid" }));
    expect(res.status).toBe(400);
  });

  it("rechaza un ingreso a una obra inactiva (REQ-002)", async () => {
    mocks.findObraById.mockResolvedValue({ ...obra, activo: false });
    const res = await POST(jsonRequest({ tipo: "ingreso", obraId: obra.id }));
    expect(res.status).toBe(400);
  });

  it("rechaza un ingreso a una obra no asignada al empleado (REQ-015)", async () => {
    mocks.findObraById.mockResolvedValue(obra);
    mocks.findEmpleadoByUserId.mockResolvedValue({
      ...empleado,
      obraIds: [],
    });
    const res = await POST(jsonRequest({ tipo: "ingreso", obraId: obra.id }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining("asignada") });
    expect(mocks.createIngreso).not.toHaveBeenCalled();
  });
});

describe("POST /api/fichadas: ingreso (REQ-003, REQ-006)", () => {
  it("registra el ingreso y devuelve el período abierto", async () => {
    mocks.findObraById.mockResolvedValue(obra);
    mocks.findPeriodoAbierto.mockResolvedValue(null);
    mocks.createIngreso.mockResolvedValue({
      id: "p-2",
      empleadoId: "e-1",
      obraId: obra.id,
      ingresoAt: ingreso,
      egresoAt: null,
    });

    const res = await POST(jsonRequest({ tipo: "ingreso", obraId: obra.id }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.periodo.egresoAt).toBeNull();
    expect(mocks.createIngreso).toHaveBeenCalledWith(
      "e-1",
      obra.id,
      expect.any(Date)
    );
  });

  it("rechaza doble fichada si ya hay período abierto (REQ-006)", async () => {
    mocks.findObraById.mockResolvedValue(obra);
    mocks.findPeriodoAbierto.mockResolvedValue({
      id: "p-1",
      empleadoId: "e-1",
      obraId: obra.id,
      ingresoAt: ingreso,
    });

    const res = await POST(jsonRequest({ tipo: "ingreso", obraId: obra.id }));
    expect(res.status).toBe(409);
  });

  it("rechaza con 409 si la base detecta conflicto de concurrencia", async () => {
    mocks.findObraById.mockResolvedValue(obra);
    mocks.findPeriodoAbierto.mockResolvedValue(null);
    mocks.createIngreso.mockRejectedValue(new mocks.PeriodoAbiertoError());

    const res = await POST(jsonRequest({ tipo: "ingreso", obraId: obra.id }));
    expect(res.status).toBe(409);
  });
});

describe("POST /api/fichadas: egreso (REQ-004, REQ-005)", () => {
  it("rechaza egreso sin período abierto", async () => {
    mocks.findPeriodoAbierto.mockResolvedValue(null);
    const res = await POST(jsonRequest({ tipo: "egreso" }));
    expect(res.status).toBe(400);
  });

  it("cierra el período y calcula horas (REQ-007)", async () => {
    mocks.findPeriodoAbierto.mockResolvedValue({
      id: "p-1",
      empleadoId: "e-1",
      obraId: obra.id,
      ingresoAt: ingreso,
    });
    mocks.cerrarPeriodo.mockResolvedValue({
      id: "p-1",
      empleadoId: "e-1",
      obraId: obra.id,
      ingresoAt: ingreso,
      egresoAt: new Date("2026-08-03T17:30:00Z"),
    });

    const res = await POST(jsonRequest({ tipo: "egreso" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.periodo.horas).toBe(9.5);
  });
});

describe("GET /api/fichadas", () => {
  it("devuelve el historial del empleado con horas", async () => {
    mocks.listPeriodosDeEmpleado.mockResolvedValue([
      {
        id: "p-1",
        empleadoId: "e-1",
        obraId: obra.id,
        ingresoAt: ingreso,
        egresoAt: new Date("2026-08-03T17:30:00Z"),
        corregido: false,
        corregidoPor: null,
        corregidoEn: null,
        createdAt: ingreso,
      },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.periodos).toHaveLength(1);
    expect(json.periodos[0]).toMatchObject({
      obraNombre: "Edificio Norte",
      horas: 9.5,
    });
  });
});
