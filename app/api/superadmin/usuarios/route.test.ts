// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireSuperAdmin: vi.fn(),
  listUsuariosGlobales: vi.fn(),
}));

vi.mock("@/lib/services/current-user", () => ({
  requireSuperAdmin: mocks.requireSuperAdmin,
}));
vi.mock("@/lib/db/superadmin", () => ({
  listUsuariosGlobales: mocks.listUsuariosGlobales,
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSuperAdmin.mockResolvedValue({
    id: "s-1",
    email: "superadmin@fichapp.com",
    name: "Superadmin",
    role: "SUPERADMIN",
  });
});

describe("GET /api/superadmin/usuarios", () => {
  it("lista todos los usuarios del sistema", async () => {
    mocks.listUsuariosGlobales.mockResolvedValue([
      { id: "u-1", email: "a@x.com", name: "Ana", role: "ADMIN" },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      usuarios: [{ id: "u-1", email: "a@x.com", name: "Ana", role: "ADMIN" }],
    });
  });
});
