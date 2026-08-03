// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  countUsers: vi.fn(),
  getCurrentUser: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));
vi.mock("@/lib/db/users", () => ({
  createUser: mocks.createUser,
  findUserByEmail: mocks.findUserByEmail,
  countUsers: mocks.countUsers,
}));
vi.mock("@/lib/services/current-user", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

import { POST } from "./route";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/auth/register", {
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
  mocks.countUsers.mockResolvedValue(1);
  mocks.getCurrentUser.mockResolvedValue(null);
  mocks.createUser.mockImplementation(
    (input: {
      email: string;
      passwordHash: string;
      name: string;
      role: string;
    }) =>
      Promise.resolve({
        id: "u-1",
        email: input.email,
        name: input.name,
        role: input.role,
        passwordHash: input.passwordHash,
      })
  );
});

describe("POST /api/auth/register (REQ-009, REQ-010)", () => {
  it("registra un empleado y crea la sesión (REQ-010)", async () => {
    const res = await POST(
      jsonRequest({
        name: "Ana",
        email: "Ana@Example.com",
        password: "secreto123",
      })
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.user).toMatchObject({
      email: "ana@example.com",
      role: "EMPLOYEE",
    });
    expect(mocks.cookies).toHaveBeenCalled();
  });

  it("crea el primer usuario del sistema como jefe (bootstrap, REQ-009)", async () => {
    mocks.countUsers.mockResolvedValue(0);
    const res = await POST(
      jsonRequest({
        name: "Jefa",
        email: "jefa@example.com",
        password: "secreto123",
      })
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.user.role).toBe("ADMIN");
  });

  it("rechaza crear un jefe sin sesión de jefe", async () => {
    mocks.countUsers.mockResolvedValue(1);
    mocks.getCurrentUser.mockResolvedValue(null);
    const res = await POST(
      jsonRequest({
        name: "Ana",
        email: "ana@example.com",
        password: "secreto123",
        role: "ADMIN",
      })
    );
    expect(res.status).toBe(403);
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("permite a un jefe crear otro jefe", async () => {
    mocks.countUsers.mockResolvedValue(1);
    mocks.getCurrentUser.mockResolvedValue({
      id: "u-0",
      email: "jefe@example.com",
      name: "Jefe",
      role: "ADMIN",
    });
    const res = await POST(
      jsonRequest({
        name: "Ana",
        email: "ana@example.com",
        password: "secreto123",
        role: "ADMIN",
      })
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.user.role).toBe("ADMIN");
  });

  it("rechaza datos inválidos (REQ-NF-002)", async () => {
    const res = await POST(
      jsonRequest({ name: "Ana", email: "no-es-email", password: "123" })
    );
    expect(res.status).toBe(400);
  });

  it("rechaza un email ya registrado", async () => {
    mocks.findUserByEmail.mockResolvedValue({ id: "u-1" });
    const res = await POST(
      jsonRequest({
        name: "Ana",
        email: "ana@example.com",
        password: "secreto123",
      })
    );
    expect(res.status).toBe(409);
  });

  it("hasha la contraseña antes de guardar (REQ-NF-004)", async () => {
    await POST(
      jsonRequest({
        name: "Ana",
        email: "ana@example.com",
        password: "secreto123",
      })
    );
    const { passwordHash } = mocks.createUser.mock.calls[0][0];
    expect(passwordHash).not.toBe("secreto123");
  });
});
