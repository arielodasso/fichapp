// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  findEmpleadoById: vi.fn(),
  findInvitacionPendientePorEmpleado: vi.fn(),
  createInvitacion: vi.fn(),
  listInvitaciones: vi.fn(),
  generarCodigoInvitacion: vi.fn(),
  expiracionInvitacion: vi.fn(),
}));

vi.mock("@/lib/services/current-user", () => ({
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/db/empleados", () => ({
  findEmpleadoById: mocks.findEmpleadoById,
}));
vi.mock("@/lib/db/invitaciones", () => ({
  findInvitacionPendientePorEmpleado: mocks.findInvitacionPendientePorEmpleado,
  createInvitacion: mocks.createInvitacion,
  listInvitaciones: mocks.listInvitaciones,
}));
vi.mock("@/lib/domain/invitaciones", () => ({
  generarCodigoInvitacion: mocks.generarCodigoInvitacion,
  expiracionInvitacion: mocks.expiracionInvitacion,
}));

import { GET, POST } from "./route";

const empleado = {
  id: "11111111-1111-4111-8111-111111111111",
  nombre: "Juan",
  apellido: "Pérez",
  documento: "30111222",
  rol: "OBRERO",
  activo: true,
  userId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({
    id: "u-1",
    email: "jefe@example.com",
    name: "Jefe",
    role: "ADMIN",
  });
  mocks.findEmpleadoById.mockResolvedValue(empleado);
  mocks.findInvitacionPendientePorEmpleado.mockResolvedValue(null);
  mocks.generarCodigoInvitacion.mockReturnValue("ABC123");
  mocks.expiracionInvitacion.mockReturnValue(new Date("2026-09-01T00:00:00Z"));
  mocks.createInvitacion.mockImplementation(
    (input: Record<string, unknown>) => Promise.resolve({ ...input, id: "i-1" })
  );
});

describe("POST /api/invitaciones (REQ-013)", () => {
  it("crea un enlace único por empleado", async () => {
    const res = await POST(
      new Request("http://localhost/api/invitaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empleadoId: empleado.id }),
      })
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.invitacion).toMatchObject({
      codigo: "ABC123",
      empleadoId: empleado.id,
      link: `http://localhost/registro?invitacion=ABC123`,
    });
    expect(mocks.createInvitacion).toHaveBeenCalledWith({
      empleadoId: empleado.id,
      creadoPor: "u-1",
      codigo: "ABC123",
      expiraEn: new Date("2026-09-01T00:00:00Z"),
    });
  });

  it("reutiliza la invitación pendiente del empleado", async () => {
    mocks.findInvitacionPendientePorEmpleado.mockResolvedValue({
      id: "i-1",
      codigo: "PEND01",
      empleadoId: empleado.id,
    });
    const res = await POST(
      new Request("http://localhost/api/invitaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empleadoId: empleado.id }),
      })
    );
    expect(res.status).toBe(200);
    expect(mocks.createInvitacion).not.toHaveBeenCalled();
    const json = await res.json();
    expect(json.invitacion.codigo).toBe("PEND01");
  });

  it("rechaza empleados que ya tienen usuario vinculado", async () => {
    mocks.findEmpleadoById.mockResolvedValue({ ...empleado, userId: "u-9" });
    const res = await POST(
      new Request("http://localhost/api/invitaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empleadoId: empleado.id }),
      })
    );
    expect(res.status).toBe(400);
    expect(mocks.createInvitacion).not.toHaveBeenCalled();
  });

  it("rechaza un id de empleado inválido (REQ-NF-002)", async () => {
    const res = await POST(
      new Request("http://localhost/api/invitaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empleadoId: "no-es-uuid" }),
      })
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/invitaciones (REQ-013)", () => {
  it("devuelve la lista con su estado y enlace", async () => {
    mocks.listInvitaciones.mockResolvedValue([
      {
        id: "i-1",
        codigo: "ABC123",
        empleadoId: empleado.id,
        empleadoNombre: "Juan",
        empleadoApellido: "Pérez",
        usadoEn: null,
        expiraEn: new Date("2026-09-01T00:00:00Z"),
      },
    ]);
    const res = await GET(new Request("http://localhost/api/invitaciones"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.invitaciones[0]).toMatchObject({
      codigo: "ABC123",
      empleadoNombre: "Juan Pérez",
      estado: "pendiente",
      link: "http://localhost/registro?invitacion=ABC123",
    });
  });
});
