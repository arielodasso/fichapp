// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  ensureSuperadminUser: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));
vi.mock("@/lib/db/users", () => ({
  findUserByEmail: mocks.findUserByEmail,
  createUser: mocks.createUser,
  updateUser: mocks.updateUser,
}));
vi.mock("@/lib/services/superadmin", () => ({
  SUPERADMIN_EMAIL: "superadmin@fichapp.com",
  SUPERADMIN_NAME: "Superadmin",
  SUPERADMIN_PASSWORD: "superadmin2026",
  ensureSuperadminUser: mocks.ensureSuperadminUser,
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

describe("POST /api/auth/login · superadmin hardcodeado", () => {
  beforeEach(() => {
    mocks.ensureSuperadminUser.mockResolvedValue({
      id: "s-1",
      email: "superadmin@fichapp.com",
      name: "Superadmin",
      role: "SUPERADMIN",
      passwordHash: "hash",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("inicia sesión como superadmin con las credenciales fijas", async () => {
    const res = await POST(
      jsonRequest({ email: "superadmin@fichapp.com", password: "superadmin2026" })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user).toMatchObject({
      email: "superadmin@fichapp.com",
      name: "Superadmin",
      role: "SUPERADMIN",
    });
    expect(mocks.ensureSuperadminUser).toHaveBeenCalled();
  });

  it("rechaza una contraseña incorrecta del superadmin", async () => {
    const res = await POST(
      jsonRequest({ email: "superadmin@fichapp.com", password: "incorrecta" })
    );
    expect(res.status).toBe(401);
    expect(mocks.ensureSuperadminUser).not.toHaveBeenCalled();
  });
});
