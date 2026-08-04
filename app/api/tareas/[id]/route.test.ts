// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
  findEmpleadoByUserId: vi.fn(),
  findTareaById: vi.fn(),
  updateTarea: vi.fn(),
  updateTareaEstado: vi.fn(),
  deleteTarea: vi.fn(),
}));

vi.mock("@/lib/services/current-user", () => ({
  requireUser: mocks.requireUser,
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/db/empleados", () => ({
  findEmpleadoByUserId: mocks.findEmpleadoByUserId,
}));
vi.mock("@/lib/db/tareas", () => ({
  findTareaById: mocks.findTareaById,
  updateTarea: mocks.updateTarea,
  updateTareaEstado: mocks.updateTareaEstado,
  deleteTarea: mocks.deleteTarea,
}));

import { DELETE, PATCH } from "./route";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/tareas/t-1", {
    method: "PATCH",
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

const TAREA_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue(ADMIN);
  mocks.requireAdmin.mockResolvedValue(ADMIN);
});

describe("PATCH /api/tareas/[id] (REQ-020)", () => {
  it("el jefe actualiza el estado de una tarea", async () => {
    mocks.updateTarea.mockResolvedValue({ id: TAREA_ID, estado: "COMPLETADA" });
    const res = await PATCH(jsonRequest({ estado: "COMPLETADA" }), {
      params: Promise.resolve({ id: TAREA_ID }),
    });
    expect(res.status).toBe(200);
    expect(mocks.updateTarea).toHaveBeenCalledWith(
      TAREA_ID,
      { estado: "COMPLETADA" },
      "u-1"
    );
  });

  it("el jefe reasigna la tarea a otra obra del espacio", async () => {
    mocks.updateTarea.mockResolvedValue({ id: TAREA_ID });
    const res = await PATCH(
      jsonRequest({ obraId: "11111111-1111-4111-8111-111111111111" }),
      { params: Promise.resolve({ id: TAREA_ID }) }
    );
    expect(res.status).toBe(200);
    expect(mocks.updateTarea).toHaveBeenCalledWith(
      TAREA_ID,
      { obraId: "11111111-1111-4111-8111-111111111111" },
      "u-1"
    );
  });

  it("devuelve 400 si el nuevo empleado/obra no pertenece al espacio", async () => {
    mocks.updateTarea.mockResolvedValue(null);
    mocks.findTareaById.mockResolvedValue({ id: TAREA_ID });
    const res = await PATCH(
      jsonRequest({ empleadoId: "11111111-1111-4111-8111-111111111111" }),
      { params: Promise.resolve({ id: TAREA_ID }) }
    );
    expect(res.status).toBe(400);
  });

  it("devuelve 404 si la tarea no existe", async () => {
    mocks.updateTarea.mockResolvedValue(null);
    mocks.findTareaById.mockResolvedValue(null);
    const res = await PATCH(jsonRequest({ estado: "COMPLETADA" }), {
      params: Promise.resolve({ id: TAREA_ID }),
    });
    expect(res.status).toBe(404);
  });

  it("el empleado solo puede cambiar el estado de sus tareas", async () => {
    mocks.requireUser.mockResolvedValue(EMPLEADO);
    mocks.findEmpleadoByUserId.mockResolvedValue({ id: "e-1", jefeId: "u-1" });
    mocks.updateTareaEstado.mockResolvedValue({ id: TAREA_ID, estado: "EN_PROGRESO" });
    const res = await PATCH(jsonRequest({ estado: "EN_PROGRESO" }), {
      params: Promise.resolve({ id: TAREA_ID }),
    });
    expect(res.status).toBe(200);
    expect(mocks.updateTareaEstado).toHaveBeenCalledWith(TAREA_ID, "EN_PROGRESO", "e-1");
  });

  it("el empleado no puede editar otros campos", async () => {
    mocks.requireUser.mockResolvedValue(EMPLEADO);
    const res = await PATCH(jsonRequest({ titulo: "Hack" }), {
      params: Promise.resolve({ id: TAREA_ID }),
    });
    expect(res.status).toBe(400);
    expect(mocks.updateTareaEstado).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/tareas/[id] (REQ-020)", () => {
  it("el jefe elimina una tarea", async () => {
    mocks.deleteTarea.mockResolvedValue(true);
    const res = await DELETE(new Request("http://localhost/api/tareas/t-1"), {
      params: Promise.resolve({ id: TAREA_ID }),
    });
    expect(res.status).toBe(200);
    expect(mocks.deleteTarea).toHaveBeenCalledWith(TAREA_ID, "u-1");
  });

  it("devuelve 404 si la tarea no pertenece al espacio", async () => {
    mocks.deleteTarea.mockResolvedValue(false);
    const res = await DELETE(new Request("http://localhost/api/tareas/t-1"), {
      params: Promise.resolve({ id: TAREA_ID }),
    });
    expect(res.status).toBe(404);
  });
});
