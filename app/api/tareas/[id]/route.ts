import { requireAdmin, requireUser } from "@/lib/services/current-user";
import { isValidUUID } from "@/lib/utils";
import { findEmpleadoByUserId } from "@/lib/db/empleados";
import {
  findTareaById,
  updateTarea,
  updateTareaEstado,
  deleteTarea,
  type TareaEstado,
} from "@/lib/db/tareas";

const ESTADOS: TareaEstado[] = ["PENDIENTE", "EN_PROGRESO", "COMPLETADA"];

interface TareaBody {
  titulo?: unknown;
  descripcion?: unknown;
  obraId?: unknown;
  empleadoId?: unknown;
  estado?: unknown;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;
  if (!isValidUUID(id)) {
    return Response.json({ error: "Id de tarea inválido" }, { status: 400 });
  }

  let body: TareaBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (user.role === "EMPLOYEE") {
    const estado =
      typeof body.estado === "string" &&
      ESTADOS.includes(body.estado as TareaEstado)
        ? (body.estado as TareaEstado)
        : null;
    if (!estado) {
      return Response.json(
        { error: "Solo podés actualizar el estado de tus tareas" },
        { status: 400 }
      );
    }
    const empleado = await findEmpleadoByUserId(user.id);
    if (!empleado) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }
    const tarea = await updateTareaEstado(id, estado, empleado.id);
    if (!tarea) {
      return Response.json({ error: "Tarea no encontrada" }, { status: 404 });
    }
    return Response.json({ tarea });
  }

  if (user.role !== "ADMIN") {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  const input: Parameters<typeof updateTarea>[1] = {};
  if (typeof body.titulo === "string") {
    input.titulo = body.titulo.trim();
  }
  if (typeof body.descripcion === "string") {
    input.descripcion = body.descripcion.trim();
  }
  if ("obraId" in body) {
    const obraId =
      typeof body.obraId === "string" && body.obraId.length > 0
        ? body.obraId
        : null;
    if (obraId && !isValidUUID(obraId)) {
      return Response.json({ error: "Obra inválida" }, { status: 400 });
    }
    input.obraId = obraId;
  }
  if ("empleadoId" in body) {
    const empleadoId =
      typeof body.empleadoId === "string" && body.empleadoId.length > 0
        ? body.empleadoId
        : null;
    if (empleadoId && !isValidUUID(empleadoId)) {
      return Response.json(
        { error: "Empleado asignado inválido" },
        { status: 400 }
      );
    }
    if (!empleadoId) {
      return Response.json(
        { error: "Asigná la tarea a un empleado" },
        { status: 400 }
      );
    }
    input.empleadoId = empleadoId;
  }
  if ("estado" in body) {
    const estado =
      typeof body.estado === "string" &&
      ESTADOS.includes(body.estado as TareaEstado)
        ? (body.estado as TareaEstado)
        : null;
    if (!estado) {
      return Response.json({ error: "Estado inválido" }, { status: 400 });
    }
    input.estado = estado;
  }

  const tarea = await updateTarea(id, input, user.id);
  if (!tarea) {
    const existe = await findTareaById(id, user.id);
    if (existe) {
      return Response.json(
        { error: "Empleado u obra inválidos para este espacio" },
        { status: 400 }
      );
    }
    return Response.json({ error: "Tarea no encontrada" }, { status: 404 });
  }

  return Response.json({ tarea });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  const { id } = await params;
  if (!isValidUUID(id)) {
    return Response.json({ error: "Id de tarea inválido" }, { status: 400 });
  }

  const ok = await deleteTarea(id, user.id);
  if (!ok) {
    return Response.json({ error: "Tarea no encontrada" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
