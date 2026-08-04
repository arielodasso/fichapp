// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
  findEmpleadoByUserId: vi.fn(),
  listTareas: vi.fn(),
  listTareasDeEmpleado: vi.fn(),
  createTarea: vi.fn(),
}));

vi.mock("@/lib/services/current-user", () => ({
  requireUser: mocks.requireUser,
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/db/empleados", () => ({
  findEmpleadoByUserId: mocks.findEmpleadoByUserId,
}));
vi.mock("@/lib/db/tareas", () => ({
  createTarea: mocks.createTarea,
  listTareas: mocks.listTareas,
  listTareasDeEmpleado: mocks.listTareasDeEmpleado,
}));

import { GET, POST } from "./route";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/tareas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const ADMIN = {
  id: "u-1",
  email: "jefa@example.com",
  name: "Jefa",
  role: "ADMIN",
} as const;

const EMPLEADO = {
  id: "u-2",
  email: "juan@example.com",
  name: "Juan",
  role: "EMPLOYEE",
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue(ADMIN);
  mocks.requireAdmin.mockResolvedValue(ADMIN);
});

describe("GET /api/tareas (REQ-020)", () => {
  it("lista las tareas del espacio del jefe", async () => {
    mocks.listTareas.mockResolvedValue([{ id: "t-1", titulo: "Revisar obra" }]);
    const res = await GET(
      new Request("http://localhost/api/tareas?estado=PENDIENTE")
    );
    expect(res.status).toBe(200);
    expect(mocks.listTareas).toHaveBeenCalledWith("u-1", {
      obraId: null,
      empleadoId: null,
      estado: "PENDIENTE",
    });
    expect(await res.json()).toEqual({
      tareas: [{ id: "t-1", titulo: "Revisar obra" }],
    });
  });

  it("el empleado solo ve sus tareas asignadas", async () => {
    mocks.requireUser.mockResolvedValue(EMPLEADO);
    mocks.findEmpleadoByUserId.mockResolvedValue({
      id: "e-1",
      jefeId: "u-1",
    });
    await GET(new Request("http://localhost/api/tareas"));
    expect(mocks.listTareasDeEmpleado).toHaveBeenCalledWith("e-1", "u-1");
  });

  it("el empleado sin perfil no ve tareas", async () => {
    mocks.requireUser.mockResolvedValue(EMPLEADO);
    mocks.findEmpleadoByUserId.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/tareas"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ tareas: [] });
  });

  it("deniega al superadmin", async () => {
    mocks.requireUser.mockResolvedValue({
      id: "s-1",
      email: "superadmin@fichapp.com",
      name: "Superadmin",
      role: "SUPERADMIN",
    });
    const res = await GET(new Request("http://localhost/api/tareas"));
    expect(res.status).toBe(403);
  });
});

describe("POST /api/tareas (REQ-020)", () => {
  it("crea una tarea asignada a un empleado", async () => {
    mocks.createTarea.mockResolvedValue({ id: "t-1", titulo: "Pintar muro" });
    const res = await POST(
      jsonRequest({
        titulo: "Pintar muro",
        descripcion: "En la planta baja",
        obraId: "11111111-1111-4111-8111-111111111111",
        empleadoId: "22222222-2222-4222-8222-222222222222",
      })
    );
    expect(res.status).toBe(201);
    expect(mocks.createTarea).toHaveBeenCalledWith("u-1", {
      titulo: "Pintar muro",
      descripcion: "En la planta baja",
      obraId: "11111111-1111-4111-8111-111111111111",
      empleadoId: "22222222-2222-4222-8222-222222222222",
      creadoPor: "u-1",
    });
  });

  it("rechaza una tarea sin título", async () => {
    const res = await POST(
      jsonRequest({
        empleadoId: "22222222-2222-4222-8222-222222222222",
      })
    );
    expect(res.status).toBe(400);
  });

  it("rechaza un empleado inválido", async () => {
    const res = await POST(jsonRequest({ titulo: "X", empleadoId: "no-uuid" }));
    expect(res.status).toBe(400);
    expect(mocks.createTarea).not.toHaveBeenCalled();
  });
});
