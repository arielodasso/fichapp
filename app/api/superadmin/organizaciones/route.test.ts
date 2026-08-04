// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireSuperAdmin: vi.fn(),
  listOrganizaciones: vi.fn(),
}));

vi.mock("@/lib/services/current-user", () => ({
  requireSuperAdmin: mocks.requireSuperAdmin,
}));
vi.mock("@/lib/db/superadmin", () => ({
  listOrganizaciones: mocks.listOrganizaciones,
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

describe("GET /api/superadmin/organizaciones", () => {
  it("lista las organizaciones (jefes) con sus conteos", async () => {
    mocks.listOrganizaciones.mockResolvedValue([
      { id: "u-1", nombre: "Jefa", email: "j@x.com", empleados: 3, obras: 2 },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      organizaciones: [
        { id: "u-1", nombre: "Jefa", email: "j@x.com", empleados: 3, obras: 2 },
      ],
    });
  });
});
