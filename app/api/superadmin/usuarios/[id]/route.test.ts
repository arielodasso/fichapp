// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireSuperAdmin: vi.fn(),
  findUserById: vi.fn(),
  updateUser: vi.fn(),
  deleteUserAccount: vi.fn(),
  poolQuery: vi.fn(),
}));

vi.mock("@/lib/services/current-user", () => ({
  requireSuperAdmin: mocks.requireSuperAdmin,
}));
vi.mock("@/lib/db/users", () => ({
  findUserById: mocks.findUserById,
  updateUser: mocks.updateUser,
}));
vi.mock("@/lib/db/superadmin", () => ({
  deleteUserAccount: mocks.deleteUserAccount,
}));
vi.mock("@/lib/db/client", () => ({
  pool: { query: mocks.poolQuery },
}));

import { DELETE, PATCH } from "./route";

const SUPER_ID = "11111111-1111-4111-8111-111111111111";
const TARGET_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_ID = "33333333-3333-4333-8333-333333333333";

const SUPER = {
  id: SUPER_ID,
  email: "superadmin@fichapp.com",
  name: "Superadmin",
  role: "SUPERADMIN",
} as const;

function jsonRequest(body: unknown): Request {
  return new Request(`http://localhost/api/superadmin/usuarios/${TARGET_ID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSuperAdmin.mockResolvedValue(SUPER);
  mocks.poolQuery.mockResolvedValue({ rows: [] });
});

describe("PATCH /api/superadmin/usuarios/[id]", () => {
  it("actualiza nombre y email de un usuario", async () => {
    mocks.findUserById.mockResolvedValue({
      id: TARGET_ID,
      email: "a@x.com",
      name: "Ana",
      role: "ADMIN",
    });
    mocks.updateUser.mockResolvedValue({
      id: TARGET_ID,
      email: "ana@x.com",
      name: "Ana Nuevo",
      role: "ADMIN",
    });
    const res = await PATCH(
      jsonRequest({ name: "Ana Nuevo", email: "ana@x.com" }),
      { params: Promise.resolve({ id: TARGET_ID }) }
    );
    expect(res.status).toBe(200);
    expect(mocks.updateUser).toHaveBeenCalledWith(TARGET_ID, {
      name: "Ana Nuevo",
      email: "ana@x.com",
    });
    expect(await res.json()).toMatchObject({ usuario: { id: TARGET_ID } });
  });

  it("rechaza editar al superadmin", async () => {
    mocks.findUserById.mockResolvedValue({ ...SUPER });
    const res = await PATCH(jsonRequest({ name: "X" }), {
      params: Promise.resolve({ id: SUPER_ID }),
    });
    expect(res.status).toBe(400);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("devuelve 404 si el usuario no existe", async () => {
    mocks.findUserById.mockResolvedValue(null);
    const res = await PATCH(jsonRequest({ name: "X" }), {
      params: Promise.resolve({ id: TARGET_ID }),
    });
    expect(res.status).toBe(404);
  });

  it("devuelve 409 si el email ya está en uso", async () => {
    mocks.findUserById.mockResolvedValue({
      id: TARGET_ID,
      email: "a@x.com",
      name: "Ana",
      role: "ADMIN",
    });
    mocks.poolQuery.mockResolvedValue({ rows: [{ id: OTHER_ID }] });
    const res = await PATCH(jsonRequest({ email: "tomado@x.com" }), {
      params: Promise.resolve({ id: TARGET_ID }),
    });
    expect(res.status).toBe(409);
  });
});

describe("DELETE /api/superadmin/usuarios/[id]", () => {
  it("rechaza eliminarse a sí mismo", async () => {
    const res = await DELETE(new Request("http://localhost/"), {
      params: Promise.resolve({ id: SUPER_ID }),
    });
    expect(res.status).toBe(400);
    expect(mocks.deleteUserAccount).not.toHaveBeenCalled();
  });

  it("rechaza eliminar al superadmin", async () => {
    mocks.findUserById.mockResolvedValue({ ...SUPER });
    mocks.deleteUserAccount.mockResolvedValue(false);
    const res = await DELETE(new Request("http://localhost/"), {
      params: Promise.resolve({ id: OTHER_ID }),
    });
    expect(res.status).toBe(400);
    expect(mocks.deleteUserAccount).toHaveBeenCalledWith(OTHER_ID);
  });

  it("devuelve 404 si el usuario no existe", async () => {
    mocks.findUserById.mockResolvedValue(null);
    const res = await DELETE(new Request("http://localhost/"), {
      params: Promise.resolve({ id: TARGET_ID }),
    });
    expect(res.status).toBe(404);
  });

  it("elimina una cuenta de jefe", async () => {
    mocks.findUserById.mockResolvedValue({
      id: TARGET_ID,
      email: "jefa@x.com",
      name: "Jefa",
      role: "ADMIN",
    });
    mocks.deleteUserAccount.mockResolvedValue({});
    const res = await DELETE(new Request("http://localhost/"), {
      params: Promise.resolve({ id: TARGET_ID }),
    });
    expect(res.status).toBe(200);
    expect(mocks.deleteUserAccount).toHaveBeenCalledWith(TARGET_ID);
  });
});
