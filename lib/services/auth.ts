import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

export type UserRole = "ADMIN" | "EMPLOYEE";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const BCRYPT_ROUNDS = 10;

export class InvalidSessionError extends Error {
  constructor() {
    super("Sesión inválida o expirada");
    this.name = "InvalidSessionError";
  }
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? process.env.AUTH_SECRET ?? "";
  if (!secret) {
    throw new Error("Falta JWT_SECRET/AUTH_SECRET en el entorno");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionUser> {
  let payload: import("jose").JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, getJwtSecret()));
  } catch {
    throw new InvalidSessionError();
  }

  const { sub, email, name, role } = payload;
  if (
    !sub ||
    typeof email !== "string" ||
    typeof name !== "string" ||
    (role !== "ADMIN" && role !== "EMPLOYEE")
  ) {
    throw new InvalidSessionError();
  }

  return { id: sub, email, name, role };
}

export function hasRole(
  user: SessionUser | null | undefined,
  allowedRoles: UserRole[]
): boolean {
  return !!user && allowedRoles.includes(user.role);
}

export interface SessionCookieOptions {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
}

export function getSessionCookieOptions(): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
