import { cookies } from "next/headers";
import { createUser, findUserByEmail } from "@/lib/db/users";
import {
  SESSION_COOKIE,
  createSessionToken,
  getSessionCookieOptions,
  hashPassword,
} from "@/lib/services/auth";
import { SUPERADMIN_EMAIL } from "@/lib/services/superadmin";

interface RegisterBody {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}

export async function POST(request: Request) {
  let body: RegisterBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || !email || !email.includes("@") || password.length < 8) {
    return Response.json(
      { error: "Datos inválidos: nombre, email válido y contraseña (mín. 8 caracteres)" },
      { status: 400 }
    );
  }

  if (email === SUPERADMIN_EMAIL) {
    return Response.json(
      { error: "Ese email no se puede registrar" },
      { status: 400 }
    );
  }

  if (await findUserByEmail(email)) {
    return Response.json(
      { error: "El email ya está registrado" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({ email, passwordHash, name, role: "ADMIN" });

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
