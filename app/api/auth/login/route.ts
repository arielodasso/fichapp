import { cookies } from "next/headers";
import { findUserByEmail } from "@/lib/db/users";
import {
  SESSION_COOKIE,
  createSessionToken,
  getSessionCookieOptions,
  verifyPassword,
} from "@/lib/services/auth";
import {
  SUPERADMIN_EMAIL,
  SUPERADMIN_NAME,
  SUPERADMIN_PASSWORD,
  ensureSuperadminUser,
} from "@/lib/services/superadmin";

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return Response.json(
      { error: "Email y contraseña son obligatorios" },
      { status: 400 }
    );
  }

  if (email === SUPERADMIN_EMAIL) {
    if (password !== SUPERADMIN_PASSWORD) {
      return Response.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }
    const superadmin = await ensureSuperadminUser();
    const token = await createSessionToken({
      id: superadmin.id,
      email: superadmin.email,
      name: SUPERADMIN_NAME,
      role: "SUPERADMIN",
    });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, getSessionCookieOptions());
    return Response.json({
      user: {
        id: superadmin.id,
        email: superadmin.email,
        name: SUPERADMIN_NAME,
        role: "SUPERADMIN",
      },
    });
  }

  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return Response.json(
      { error: "Credenciales inválidas" },
      { status: 401 }
    );
  }

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, getSessionCookieOptions());

  return Response.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
