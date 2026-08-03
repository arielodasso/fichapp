// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUserByEmail: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));
vi.mock("@/lib/db/users", () => ({
  findUserByEmail: mocks.findUserByEmail,
}));

import { POST } from "./route";
import { hashPassword } from "@/lib/services/auth";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = "secreto-de-prueba-con-suficiente-entropia";
  mocks.cookies.mockResolvedValue({ set: vi.fn() });
});

describe("POST /api/auth/login (REQ-010)", () => {
  it("inicia sesión con credenciales correctas", async () => {
    const passwordHash = await hashPassword("secreto123");
    mocks.findUserByEmail.mockResolvedValue({
      id: "u-1",
      email: "ana@example.com",
      name: "Ana",
      role: "ADMIN",
      passwordHash,
    });

    const res = await POST(
      jsonRequest({ email: "ana@example.com", password: "secreto123" })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user).toMatchObject({ email: "ana@example.com", role: "ADMIN" });
    expect(mocks.cookies).toHaveBeenCalled();
  });

  it("rechaza una contraseña incorrecta", async () => {
    const passwordHash = await hashPassword("secreto123");
    mocks.findUserByEmail.mockResolvedValue({
      id: "u-1",
      email: "ana@example.com",
      name: "Ana",
      role: "ADMIN",
      passwordHash,
    });

    const res = await POST(
      jsonRequest({ email: "ana@example.com", password: "incorrecta" })
    );
    expect(res.status).toBe(401);
  });

  it("rechaza un email inexistente", async () => {
    mocks.findUserByEmail.mockResolvedValue(null);
    const res = await POST(
      jsonRequest({ email: "nadie@example.com", password: "secreto123" })
    );
    expect(res.status).toBe(401);
  });
});
