// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  listEmpleados: vi.fn(),
  createEmpleado: vi.fn(),
  generarInvitacionEmpleado: vi.fn(),
}));

vi.mock("@/lib/services/current-user", () => ({
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/db/empleados", () => ({
  listEmpleados: mocks.listEmpleados,
  createEmpleado: mocks.createEmpleado,
}));
vi.mock("@/lib/services/invitaciones", () => ({
  generarInvitacionEmpleado: mocks.generarInvitacionEmpleado,
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
    expect(mocks.listEmpleados).toHaveBeenCalledWith("u-1", {
      soloActivos: true,
    });
  });

  it("filtra los empleados por el jefe de la sesión (multi-tenancy)", async () => {
    mocks.listEmpleados.mockResolvedValue([]);
    mocks.requireAdmin.mockResolvedValue({
      id: "j-2",
      email: "otro@example.com",
      name: "Otro Jefe",
      role: "ADMIN",
    });
    await GET(new Request("http://localhost/api/empleados"));
    expect(mocks.listEmpleados).toHaveBeenCalledWith("j-2", {
      soloActivos: undefined,
    });
  });
});

describe("POST /api/empleados (REQ-001, REQ-015)", () => {
  it("crea un empleado, asigna obras y genera su enlace de invitación", async () => {
    mocks.createEmpleado.mockResolvedValue({ id: "e-1", userId: null });
    mocks.generarInvitacionEmpleado.mockResolvedValue({
      id: "inv-1",
      codigo: "ABC123",
      expiraEn: "2026-09-01T00:00:00.000Z",
      link: "http://localhost/registro?invitacion=ABC123",
    });
    const res = await POST(
      jsonRequest({
        nombre: "Juan",
        apellido: "Pérez",
        documento: "30111222",
        obraIds: [
          "11111111-1111-4111-8111-111111111111",
          "22222222-2222-4222-8222-222222222222",
        ],
      })
    );
    expect(res.status).toBe(201);
    expect(mocks.createEmpleado).toHaveBeenCalledWith("u-1", {
      nombre: "Juan",
      apellido: "Pérez",
      documento: "30111222",
      rol: "OBRERO",
      userId: null,
      obraIds: [
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222",
      ],
    });
    expect(mocks.generarInvitacionEmpleado).toHaveBeenCalledWith(
      "e-1",
      "u-1",
      "http://localhost"
    );
    const json = await res.json();
    expect(json.invitacion.link).toBe("http://localhost/registro?invitacion=ABC123");
  });

  it("no genera invitación cuando el empleado ya tiene usuario", async () => {
    mocks.createEmpleado.mockResolvedValue({ id: "e-1", userId: "u-9" });
    const res = await POST(
      jsonRequest({
        nombre: "Juan",
        apellido: "Pérez",
        documento: "30111222",
        userId: "u-9",
      })
    );
    expect(res.status).toBe(201);
    expect(mocks.generarInvitacionEmpleado).not.toHaveBeenCalled();
    expect(await res.json()).toMatchObject({ invitacion: null });
  });

  it("rechaza obras asignadas inválidas (REQ-NF-002)", async () => {
    const res = await POST(
      jsonRequest({
        nombre: "Juan",
        apellido: "Pérez",
        documento: "30111222",
        obraIds: ["no-es-uuid"],
      })
    );
    expect(res.status).toBe(400);
    expect(mocks.createEmpleado).not.toHaveBeenCalled();
  });

  it("rechaza un empleado sin documento (REQ-NF-002)", async () => {
    const res = await POST(jsonRequest({ nombre: "Juan", apellido: "Pérez" }));
    expect(res.status).toBe(400);
  });
});
