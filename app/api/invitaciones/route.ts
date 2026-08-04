import { requireAdmin } from "@/lib/services/current-user";
import { isValidUUID } from "@/lib/utils";
import { findEmpleadoById } from "@/lib/db/empleados";
import {
  createInvitacion,
  findInvitacionPendientePorEmpleado,
  listInvitaciones,
} from "@/lib/db/invitaciones";
import {
  expiracionInvitacion,
  generarCodigoInvitacion,
} from "@/lib/domain/invitaciones";

interface InvitacionBody {
  empleadoId?: unknown;
}

export async function GET(request: Request) {
  const user = await requireAdmin();

  const invitaciones = await listInvitaciones(user.id);
  return Response.json({
    invitaciones: invitaciones.map((i) => ({
      id: i.id,
      codigo: i.codigo,
      empleadoId: i.empleadoId,
      empleadoNombre: `${i.empleadoNombre ?? ""} ${i.empleadoApellido ?? ""}`.trim(),
      estado: i.usadoEn
        ? "usada"
        : i.expiraEn && i.expiraEn <= new Date()
          ? "expirada"
          : "pendiente",
      link: `${new URL(request.url).origin}/registro?invitacion=${i.codigo}`,
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireAdmin();

  let body: InvitacionBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const empleadoId = typeof body.empleadoId === "string" ? body.empleadoId : "";
  if (!empleadoId || !isValidUUID(empleadoId)) {
    return Response.json(
      { error: "Id de empleado inválido" },
      { status: 400 }
    );
  }

  const empleado = await findEmpleadoById(empleadoId, user.id);
  if (!empleado) {
    return Response.json({ error: "Empleado no encontrado" }, { status: 404 });
  }
  if (empleado.userId) {
    return Response.json(
      { error: "El empleado ya tiene un usuario vinculado" },
      { status: 400 }
    );
  }
  if (!empleado.activo) {
    return Response.json(
      { error: "El empleado está inactivo" },
      { status: 400 }
    );
  }

  const pendiente = await findInvitacionPendientePorEmpleado(empleadoId);
  const invitacion =
    pendiente ??
    (await createInvitacion({
      empleadoId,
      creadoPor: user.id,
      codigo: generarCodigoInvitacion(),
      expiraEn: expiracionInvitacion(new Date()),
    }));

  return Response.json(
    {
      invitacion: {
        id: invitacion.id,
        codigo: invitacion.codigo,
        empleadoId: invitacion.empleadoId,
        link: `${new URL(request.url).origin}/registro?invitacion=${invitacion.codigo}`,
      },
    },
    { status: pendiente ? 200 : 201 }
  );
}
