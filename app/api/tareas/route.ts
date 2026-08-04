import { requireAdmin, requireUser } from "@/lib/services/current-user";
import { isValidUUID } from "@/lib/utils";
import { findEmpleadoByUserId } from "@/lib/db/empleados";
import {
  createTarea,
  listTareas,
  listTareasDeEmpleado,
  type TareaEstado,
} from "@/lib/db/tareas";

const ESTADOS: TareaEstado[] = ["PENDIENTE", "EN_PROGRESO", "COMPLETADA"];

interface TareaBody {
  titulo?: unknown;
  descripcion?: unknown;
  obraId?: unknown;
  empleadoId?: unknown;
}

export async function GET(request: Request) {
  const user = await requireUser();
  if (user.role === "SUPERADMIN") {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  if (user.role === "ADMIN") {
    const url = new URL(request.url);
    const obraId = url.searchParams.get("obraId");
    const empleadoId = url.searchParams.get("empleadoId");
    const estadoRaw = url.searchParams.get("estado");
    const estado = ESTADOS.includes(estadoRaw as TareaEstado)
      ? (estadoRaw as TareaEstado)
      : null;

    const tareas = await listTareas(user.id, {
      obraId,
      empleadoId,
      estado,
    });
    return Response.json({ tareas });
  }

  const empleado = await findEmpleadoByUserId(user.id);
  const tareas = empleado
    ? await listTareasDeEmpleado(empleado.id, empleado.jefeId)
    : [];
  return Response.json({ tareas });
}

export async function POST(request: Request) {
  const user = await requireAdmin();

  let body: TareaBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const titulo = typeof body.titulo === "string" ? body.titulo.trim() : "";
  const descripcion =
    typeof body.descripcion === "string" ? body.descripcion.trim() : null;
  const obraId = typeof body.obraId === "string" && body.obraId.length > 0 ? body.obraId : null;
  const empleadoId = typeof body.empleadoId === "string" ? body.empleadoId : "";

  if (!titulo) {
    return Response.json(
      { error: "El título de la tarea es obligatorio" },
      { status: 400 }
    );
  }
  if (!empleadoId || !isValidUUID(empleadoId)) {
    return Response.json(
      { error: "Empleado asignado inválido" },
      { status: 400 }
    );
  }
  if (obraId && !isValidUUID(obraId)) {
    return Response.json({ error: "Obra inválida" }, { status: 400 });
  }

  const tarea = await createTarea(user.id, {
    titulo,
    descripcion,
    obraId,
    empleadoId,
    creadoPor: user.id,
  });
  if (!tarea) {
    return Response.json(
      { error: "Empleado u obra inválidos para este espacio" },
      { status: 400 }
    );
  }

  return Response.json({ tarea }, { status: 201 });
}
