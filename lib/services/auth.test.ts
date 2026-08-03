// @vitest-environment node

import { beforeEach, describe, expect, it } from "vitest";
import {
  InvalidSessionError,
  createSessionToken,
  getSessionCookieOptions,
  hasRole,
  hashPassword,
  verifyPassword,
  verifySessionToken,
  type SessionUser,
} from "./auth";

const user: SessionUser = {
  id: "u-1",
  email: "ana@example.com",
  name: "Ana",
  role: "ADMIN",
};

describe("auth: hash de contraseñas", () => {
  it("genera un hash distinto de la contraseña original", async () => {
    const hash = await hashPassword("secreto123");
    expect(hash).not.toBe("secreto123");
  });

  it("verifica la contraseña correcta y rechaza la incorrecta", async () => {
    const hash = await hashPassword("secreto123");
    await expect(verifyPassword("secreto123", hash)).resolves.toBe(true);
    await expect(verifyPassword("incorrecta", hash)).resolves.toBe(false);
  });
});

describe("auth: sesión", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "secreto-de-prueba-con-suficiente-entropia";
  });

  it("crea y verifica un token de sesión", async () => {
    const token = await createSessionToken(user);
    await expect(verifySessionToken(token)).resolves.toEqual(user);
  });

  it("rechaza un token inválido", async () => {
    await expect(verifySessionToken("no-es-un-token")).rejects.toThrow(
      InvalidSessionError
    );
  });

  it("rechaza un token firmado con otro secreto", async () => {
    const token = await createSessionToken(user);
    process.env.JWT_SECRET = "otro-secreto-diferente";
    await expect(verifySessionToken(token)).rejects.toThrow(
      InvalidSessionError
    );
  });

  it("las opciones de cookie son seguras", () => {
    const options = getSessionCookieOptions();
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
  });
});

describe("auth: guard de roles", () => {
  it("autoriza solo con rol permitido", () => {
    expect(hasRole(user, ["ADMIN"])).toBe(true);
    expect(hasRole(user, ["EMPLOYEE"])).toBe(false);
    expect(hasRole(null, ["ADMIN"])).toBe(false);
    expect(hasRole(undefined, ["EMPLOYEE"])).toBe(false);
  });
});
