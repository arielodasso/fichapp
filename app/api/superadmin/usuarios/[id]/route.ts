import { requireSuperAdmin } from "@/lib/services/current-user";
import { isValidUUID } from "@/lib/utils";
import { findUserById, updateUser } from "@/lib/db/users";
import { pool } from "@/lib/db/client";
import { deleteUserAccount } from "@/lib/db/superadmin";

interface UsuarioBody {
  name?: unknown;
  email?: unknown;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSuperAdmin();
  const { id } = await params;
  if (!isValidUUID(id)) {
    return Response.json({ error: "Id de usuario inválido" }, { status: 400 });
  }

  const target = await findUserById(id);
  if (!target) {
    return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
  }
  if (target.role === "SUPERADMIN") {
    return Response.json(
      { error: "La cuenta superadmin es fija y no se puede editar" },
      { status: 400 }
    );
  }

  let body: UsuarioBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : null;
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : null;

  if (!name && !email) {
    return Response.json(
      { error: "Nombre o email requeridos" },
      { status: 400 }
    );
  }
  if (email && !email.includes("@")) {
    return Response.json({ error: "Email inválido" }, { status: 400 });
  }

  const input: { name?: string; email?: string } = {};
  if (name) input.name = name;
  if (email) input.email = email;

  if (email) {
    const { rows } = await pool.query<{ id: string }>(
      `SELECT id FROM users WHERE email = $1 AND id <> $2`,
      [email, id]
    );
    if (rows.length > 0) {
      return Response.json(
        { error: "Ese email ya está en uso por otro usuario" },
        { status: 409 }
      );
    }
  }

  const usuario = await updateUser(id, input);
  if (!usuario) {
    return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return Response.json({
    usuario: {
      id: usuario.id,
      email: usuario.email,
      name: usuario.name,
      role: usuario.role,
      createdAt: usuario.createdAt,
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireSuperAdmin();
  const { id } = await params;
  if (!isValidUUID(id)) {
    return Response.json({ error: "Id de usuario inválido" }, { status: 400 });
  }

  if (id === user.id) {
    return Response.json(
      { error: "No podés eliminar tu propia cuenta" },
      { status: 400 }
    );
  }

  const target = await findUserById(id);
  if (!target) {
    return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const ok = await deleteUserAccount(id);
  if (!ok) {
    return Response.json(
      { error: "La cuenta superadmin no se puede eliminar" },
      { status: 400 }
    );
  }
  return Response.json({ ok: true });
}
