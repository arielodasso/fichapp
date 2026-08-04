// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireSuperAdmin: vi.fn(),
  deleteOrganizacion: vi.fn(),
}));

vi.mock("@/lib/services/current-user", () => ({
  requireSuperAdmin: mocks.requireSuperAdmin,
}));
vi.mock("@/lib/db/superadmin", () => ({
  deleteOrganizacion: mocks.deleteOrganizacion,
}));

import { DELETE } from "./route";

const SUPER_ID = "11111111-1111-4111-8111-111111111111";
const TARGET_ID = "22222222-2222-4222-8222-222222222222";

const SUPER = {
  id: SUPER_ID,
  email: "superadmin@fichapp.com",
  name: "Superadmin",
  role: "SUPERADMIN",
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSuperAdmin.mockResolvedValue(SUPER);
});

describe("DELETE /api/superadmin/organizaciones/[id]", () => {
  it("rechaza eliminar al propio superadmin", async () => {
    const res = await DELETE(new Request("http://localhost/"), {
      params: Promise.resolve({ id: SUPER_ID }),
    });
    expect(res.status).toBe(400);
    expect(mocks.deleteOrganizacion).not.toHaveBeenCalled();
  });

  it("elimina una organización", async () => {
    mocks.deleteOrganizacion.mockResolvedValue({});
    const res = await DELETE(new Request("http://localhost/"), {
      params: Promise.resolve({ id: TARGET_ID }),
    });
    expect(res.status).toBe(200);
    expect(mocks.deleteOrganizacion).toHaveBeenCalledWith(TARGET_ID);
  });
});
