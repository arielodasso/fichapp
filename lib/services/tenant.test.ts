// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findEmpleadoByUserId: vi.fn(),
}));

vi.mock("@/lib/db/empleados", () => ({
  findEmpleadoByUserId: mocks.findEmpleadoByUserId,
}));

import { resolveTenantId } from "./tenant";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveTenantId (multi-tenancy)", () => {
  it("usa el id del jefe como tenant para un ADMIN", async () => {
    await expect(
      resolveTenantId({
        id: "j-1",
        email: "jefe@example.com",
        name: "Jefe",
        role: "ADMIN",
      })
    ).resolves.toBe("j-1");
    expect(mocks.findEmpleadoByUserId).not.toHaveBeenCalled();
  });

  it("hereda el tenant del jefe para un EMPLOYEE", async () => {
    mocks.findEmpleadoByUserId.mockResolvedValue({
      id: "e-1",
      jefeId: "j-9",
    } as never);
    await expect(
      resolveTenantId({
        id: "u-1",
        email: "juan@example.com",
        name: "Juan",
        role: "EMPLOYEE",
      })
    ).resolves.toBe("j-9");
    expect(mocks.findEmpleadoByUserId).toHaveBeenCalledWith("u-1");
  });

  it("devuelve null si el empleado no tiene perfil", async () => {
    mocks.findEmpleadoByUserId.mockResolvedValue(null);
    await expect(
      resolveTenantId({
        id: "u-1",
        email: "juan@example.com",
        name: "Juan",
        role: "EMPLOYEE",
      })
    ).resolves.toBeNull();
  });
});
