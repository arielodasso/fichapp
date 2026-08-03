import { cookies } from "next/headers";
import { countUsers, createUser, findUserByEmail } from "@/lib/db/users";
import { getCurrentUser } from "@/lib/services/current-user";
import {
  SESSION_COOKIE,
  createSessionToken,
  getSessionCookieOptions,
  hashPassword,
  type UserRole,
} from "@/lib/services/auth";

interface RegisterBody {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  role?: unknown;
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
  let role: UserRole = body.role === "ADMIN" ? "ADMIN" : "EMPLOYEE";

  if (!name || !email || !email.includes("@") || password.length < 8) {
    return Response.json(
      { error: "Datos inválidos: nombre, email válido y contraseña (mín. 8 caracteres)" },
      { status: 400 }
    );
  }

  if (await findUserByEmail(email)) {
    return Response.json(
      { error: "El email ya está registrado" },
      { status: 409 }
    );
  }

  const [totalUsers, currentUser] = await Promise.all([
    countUsers(),
    getCurrentUser(),
  ]);

  if (totalUsers === 0) {
    // Primer usuario del sistema: se crea como jefe para poder administrar (REQ-009).
    role = "ADMIN";
  } else if (role === "ADMIN" && currentUser?.role !== "ADMIN") {
    return Response.json(
      { error: "Solo el jefe puede crear cuentas de jefe" },
      { status: 403 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({ email, passwordHash, name, role });

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
