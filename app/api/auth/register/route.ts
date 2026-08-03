import { cookies } from "next/headers";
import { countAdmins, createUser, findUserByEmail } from "@/lib/db/users";
import {
  SESSION_COOKIE,
  createSessionToken,
  getSessionCookieOptions,
  hashPassword,
} from "@/lib/services/auth";

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

  if (await findUserByEmail(email)) {
    return Response.json(
      { error: "El email ya está registrado" },
      { status: 409 }
    );
  }

  const admins = await countAdmins();
  if (admins > 0) {
    // El registro público crea exclusivamente al jefe inicial (bootstrap).
    // Los empleados se registran mediante enlaces de invitación (REQ-013).
    return Response.json(
      {
        error:
          "El registro público está cerrado. Si sos empleado, usá el enlace de invitación que te envió el jefe.",
      },
      { status: 403 }
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
