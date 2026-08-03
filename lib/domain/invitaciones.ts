import { randomBytes } from "node:crypto";

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LONGITUD_CODIGO = 6;
export const INVITACION_DIAS_VALIDEZ = 30;

export function normalizarCodigo(raw: string): string {
  return raw.trim().toUpperCase();
}

export function generarCodigoInvitacion(): string {
  const bytes = randomBytes(LONGITUD_CODIGO);
  let codigo = "";
  for (let i = 0; i < LONGITUD_CODIGO; i++) {
    codigo += ALFABETO[bytes[i] % ALFABETO.length];
  }
  return codigo;
}

export function expiracionInvitacion(
  desde: Date,
  dias: number = INVITACION_DIAS_VALIDEZ
): Date {
  return new Date(desde.getTime() + dias * 24 * 60 * 60 * 1000);
}
