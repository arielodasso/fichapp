// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  listEmpleados: vi.fn(),
  createEmpleado: vi.fn(),
}));

vi.mock("@/lib/services/current-user", () => ({
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/db/empleados", () => ({
  listEmpleados: mocks.listEmpleados,
  createEmpleado: mocks.createEmpleado,
}));

import { GET, POST } from "./route";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/empleados", {
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

describe("GET /api/empleados (REQ-001)", () => {
  it("devuelve la lista de empleados", async () => {
    mocks.listEmpleados.mockResolvedValue([{ id: "e-1", nombre: "Juan" }]);
    const res = await GET(new Request("http://localhost/api/empleados"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ empleados: [{ id: "e-1", nombre: "Juan" }] });
  });

  it("transmite el filtro de activos", async () => {
    mocks.listEmpleados.mockResolvedValue([]);
    await GET(new Request("http://localhost/api/empleados?activos=true"));
    expect(mocks.listEmpleados).toHaveBeenCalledWith({ soloActivos: true });
  });
});

describe("POST /api/empleados (REQ-001)", () => {
  it("crea un empleado con los datos mínimos", async () => {
    mocks.createEmpleado.mockResolvedValue({ id: "e-1" });
    const res = await POST(
      jsonRequest({
        nombre: "Juan",
        apellido: "Pérez",
        documento: "30111222",
      })
    );
    expect(res.status).toBe(201);
    expect(mocks.createEmpleado).toHaveBeenCalledWith({
      nombre: "Juan",
      apellido: "Pérez",
      documento: "30111222",
      rol: "OBRERO",
      userId: null,
    });
  });

  it("rechaza un empleado sin documento (REQ-NF-002)", async () => {
    const res = await POST(jsonRequest({ nombre: "Juan", apellido: "Pérez" }));
    expect(res.status).toBe(400);
  });
});
