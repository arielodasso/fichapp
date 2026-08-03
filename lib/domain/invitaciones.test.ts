import { describe, expect, it } from "vitest";
import {
  INVITACION_DIAS_VALIDEZ,
  expiracionInvitacion,
  generarCodigoInvitacion,
  normalizarCodigo,
} from "./invitaciones";

describe("lib/domain/invitaciones (REQ-013)", () => {
  it("normaliza el código a mayúsculas sin espacios", () => {
    expect(normalizarCodigo("  abc123  ")).toBe("ABC123");
  });

  it("genera un código de 6 caracteres del alfabeto seguro", () => {
    const codigo = generarCodigoInvitacion();
    expect(codigo).toHaveLength(6);
    expect(codigo).toMatch(/^[A-Z2-9]+$/);
  });

  it("genera códigos distintos en llamadas sucesivas", () => {
    expect(generarCodigoInvitacion()).not.toBe(generarCodigoInvitacion());
  });

  it("calcula la expiración por días", () => {
    const desde = new Date("2026-08-03T12:00:00Z");
    const exp = expiracionInvitacion(desde);
    expect(exp.toISOString()).toBe(
      new Date(
        desde.getTime() + INVITACION_DIAS_VALIDEZ * 24 * 60 * 60 * 1000
      ).toISOString()
    );
  });
});
