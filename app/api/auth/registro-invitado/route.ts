import { cookies } from "next/headers";
import { findUserByEmail } from "@/lib/db/users";
import { normalizarCodigo } from "@/lib/domain/invitaciones";
import {
  EmpleadoYaVinculadoError,
  InvitacionNoValidaError,
  findInvitacionVigentePorCodigo,
  registrarEmpleadoInvitado,
} from "@/lib/db/invitaciones";
import {
  SESSION_COOKIE,
  createSessionToken,
  getSessionCookieOptions,
  hashPassword,
} from "@/lib/services/auth";

interface RegistroInvitadoBody {
  codigo?: unknown;
  name?: unknown;
  email?: unknown;
  password?: unknown;
}

export async function POST(request: Request) {
  let body: RegistroInvitadoBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const codigo = normalizarCodigo(
    typeof body.codigo === "string" ? body.codigo : ""
  );
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!codigo || !email || !email.includes("@") || password.length < 8) {
    return Response.json(
      { error: "Datos inválidos: enlace, email válido y contraseña (mín. 8 caracteres)" },
      { status: 400 }
    );
  }

  const invitacion = await findInvitacionVigentePorCodigo(codigo);
  if (!invitacion) {
    return Response.json(
      { error: "El enlace de invitación no es válido, fue usado o está expirado" },
      { status: 400 }
    );
  }

  if (await findUserByEmail(email)) {
    return Response.json(
      { error: "El email ya está registrado" },
      { status: 409 }
    );
  }

  const nombrePerfil =
    `${invitacion.empleadoNombre ?? ""} ${invitacion.empleadoApellido ?? ""}`.trim();
  const nombre = name || nombrePerfil;

  const passwordHash = await hashPassword(password);

  let user;
  try {
    user = await registrarEmpleadoInvitado(codigo, {
      email,
      name: nombre,
      passwordHash,
    });
  } catch (err) {
    if (err instanceof InvitacionNoValidaError) {
      return Response.json(
        { error: "El enlace de invitación no es válido, fue usado o está expirado" },
        { status: 400 }
      );
    }
    if (err instanceof EmpleadoYaVinculadoError) {
      return Response.json(
        { error: "Este perfil de empleado ya tiene un usuario vinculado" },
        { status: 409 }
      );
    }
    throw err;
  }

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, getSessionCookieOptions());

  return Response.json(
    { user: { id: user.id, email: user.email, name: user.name, role: user.role } },
    { status: 201 }
  );
}
