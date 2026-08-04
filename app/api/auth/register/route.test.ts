// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));
vi.mock("@/lib/db/users", () => ({
  createUser: mocks.createUser,
  findUserByEmail: mocks.findUserByEmail,
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
  it("registra el primer usuario como jefe (bootstrap, REQ-009)", async () => {
    const res = await POST(
      jsonRequest({
        name: "Jefa",
        email: "Jefa@Example.com",
        password: "secreto123",
      })
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.user).toMatchObject({
      email: "jefa@example.com",
      role: "ADMIN",
    });
    expect(mocks.cookies).toHaveBeenCalled();
  });

  it("crea siempre una cuenta de jefe (el rol no es seleccionable)", async () => {
    const res = await POST(
      jsonRequest({
        name: "Jefe",
        email: "jefe@example.com",
        password: "secreto123",
      })
    );
    expect(res.status).toBe(201);
    expect(mocks.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: "ADMIN" })
    );
  });

  it("permite el registro público de nuevos jefes en cualquier momento (REQ-015)", async () => {
    const res = await POST(
      jsonRequest({
        name: "Ana",
        email: "ana@example.com",
        password: "secreto123",
      })
    );
    expect(res.status).toBe(201);
    expect(mocks.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "ana@example.com", role: "ADMIN" })
    );
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
