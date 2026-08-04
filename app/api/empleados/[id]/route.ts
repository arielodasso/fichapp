import { requireAdmin } from "@/lib/services/current-user";
import { isValidUUID } from "@/lib/utils";
import {
  deactivateEmpleado,
  updateEmpleado,
  type UpdateEmpleadoInput,
} from "@/lib/db/empleados";

interface EmpleadoBody {
  nombre?: unknown;
  apellido?: unknown;
  documento?: unknown;
  rol?: unknown;
  activo?: unknown;
  userId?: unknown;
  obraIds?: unknown;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  if (!isValidUUID(id)) {
    return Response.json({ error: "Id de empleado inválido" }, { status: 400 });
  }

  let body: EmpleadoBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const input: UpdateEmpleadoInput = {};
  if (typeof body.nombre === "string") {
    input.nombre = body.nombre.trim();
  }
  if (typeof body.apellido === "string") {
    input.apellido = body.apellido.trim();
  }
  if (typeof body.documento === "string") {
    input.documento = body.documento.trim();
  }
  if (typeof body.rol === "string") {
    input.rol = body.rol.trim();
  }
  if (typeof body.activo === "boolean") {
    input.activo = body.activo;
  }
  if ("userId" in body) {
    input.userId =
      typeof body.userId === "string" && body.userId.length > 0
        ? body.userId
        : null;
  }
  if ("obraIds" in body) {
    const obraIds = Array.isArray(body.obraIds) ? body.obraIds : [];
    if (obraIds.some((o) => typeof o !== "string" || !isValidUUID(o))) {
      return Response.json(
        { error: "Obras asignadas inválidas" },
        { status: 400 }
      );
    }
    input.obraIds = obraIds;
  }

  const empleado = await updateEmpleado(id, input);
  if (!empleado) {
    return Response.json({ error: "Empleado no encontrado" }, { status: 404 });
  }

  return Response.json({ empleado });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  if (!isValidUUID(id)) {
    return Response.json({ error: "Id de empleado inválido" }, { status: 400 });
  }

  const empleado = await deactivateEmpleado(id);
  if (!empleado) {
    return Response.json({ error: "Empleado no encontrado" }, { status: 404 });
  }

  return Response.json({ empleado });
}
