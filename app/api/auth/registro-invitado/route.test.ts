// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUserByEmail: vi.fn(),
  findInvitacionVigentePorCodigo: vi.fn(),
  registrarEmpleadoInvitado: vi.fn(),
  cookies: vi.fn(),
  InvitacionNoValidaError: class extends Error {},
  EmpleadoYaVinculadoError: class extends Error {},
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));
vi.mock("@/lib/db/users", () => ({
  findUserByEmail: mocks.findUserByEmail,
}));
vi.mock("@/lib/db/invitaciones", () => ({
  findInvitacionVigentePorCodigo: mocks.findInvitacionVigentePorCodigo,
  registrarEmpleadoInvitado: mocks.registrarEmpleadoInvitado,
  InvitacionNoValidaError: mocks.InvitacionNoValidaError,
  EmpleadoYaVinculadoError: mocks.EmpleadoYaVinculadoError,
}));

import { POST } from "./route";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/auth/registro-invitado", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = "secreto-de-prueba-con-suficiente-entropia";
  mocks.cookies.mockResolvedValue({ set: vi.fn(), get: vi.fn() });
  mocks.findUserByEmail.mockResolvedValue(null);
  mocks.findInvitacionVigentePorCodigo.mockResolvedValue({
    id: "i-1",
    codigo: "ABC123",
    empleadoId: "e-1",
  });
  mocks.registrarEmpleadoInvitado.mockImplementation(
    (_codigo: string, input: { email: string; name: string }) =>
      Promise.resolve({
        id: "u-1",
        email: input.email,
        name: input.name,
        role: "EMPLOYEE",
      })
  );
});

describe("POST /api/auth/registro-invitado (REQ-013)", () => {
  it("registra al empleado y crea la sesión", async () => {
    const res = await POST(
      jsonRequest({
        codigo: " abc123 ",
        name: "Juan",
        email: "juan@example.com",
        password: "secreto123",
      })
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.user).toMatchObject({
      email: "juan@example.com",
      role: "EMPLOYEE",
    });
    expect(mocks.registrarEmpleadoInvitado).toHaveBeenCalledWith(
      "ABC123",
      expect.objectContaining({ email: "juan@example.com", name: "Juan" })
    );
    expect(mocks.cookies).toHaveBeenCalled();
  });

  it("rechaza un enlace inválido, usado o expirado", async () => {
    mocks.findInvitacionVigentePorCodigo.mockResolvedValue(null);
    const res = await POST(
      jsonRequest({
        codigo: "XYZ999",
        name: "Juan",
        email: "juan@example.com",
        password: "secreto123",
      })
    );
    expect(res.status).toBe(400);
    expect(mocks.registrarEmpleadoInvitado).not.toHaveBeenCalled();
  });

  it("rechaza datos inválidos (REQ-NF-002)", async () => {
    const res = await POST(
      jsonRequest({ codigo: "ABC123", name: "Juan", email: "x", password: "123" })
    );
    expect(res.status).toBe(400);
  });

  it("rechaza un email ya registrado", async () => {
    mocks.findUserByEmail.mockResolvedValue({ id: "u-9" });
    const res = await POST(
      jsonRequest({
        codigo: "ABC123",
        name: "Juan",
        email: "juan@example.com",
        password: "secreto123",
      })
    );
    expect(res.status).toBe(409);
  });

  it("rechaza si el perfil ya tiene usuario vinculado", async () => {
    mocks.registrarEmpleadoInvitado.mockRejectedValue(
      new mocks.EmpleadoYaVinculadoError()
    );
    const res = await POST(
      jsonRequest({
        codigo: "ABC123",
        name: "Juan",
        email: "juan@example.com",
        password: "secreto123",
      })
    );
    expect(res.status).toBe(409);
  });

  it("rechaza si la invitación dejó de ser válida al momento de registrar", async () => {
    mocks.registrarEmpleadoInvitado.mockRejectedValue(
      new mocks.InvitacionNoValidaError()
    );
    const res = await POST(
      jsonRequest({
        codigo: "ABC123",
        name: "Juan",
        email: "juan@example.com",
        password: "secreto123",
      })
    );
    expect(res.status).toBe(400);
  });
});
