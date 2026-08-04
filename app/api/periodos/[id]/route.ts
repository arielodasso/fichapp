import { requireAdmin } from "@/lib/services/current-user";
import { isValidUUID } from "@/lib/utils";
import {
  PeriodoAbiertoError,
  actualizarPeriodo,
  eliminarPeriodo,
  marcarCorregido,
} from "@/lib/db/fichadas";

interface CorreccionBody {
  ingresoAt?: unknown;
  egresoAt?: unknown;
}

function fechaValida(valor: unknown): Date | null {
  if (typeof valor !== "string") {
    return null;
  }
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  const { id } = await params;
  if (!isValidUUID(id)) {
    return Response.json({ error: "Id de período inválido" }, { status: 400 });
  }

  let body: CorreccionBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const ingresoAt = fechaValida(body.ingresoAt);
  if (!ingresoAt) {
    return Response.json(
      { error: "Fecha de ingreso inválida (formato ISO)" },
      { status: 400 }
    );
  }

  let egresoAt: Date | null = null;
  if (body.egresoAt !== null && body.egresoAt !== undefined) {
    egresoAt = fechaValida(body.egresoAt);
    if (!egresoAt) {
      return Response.json(
        { error: "Fecha de egreso inválida (formato ISO)" },
        { status: 400 }
      );
    }
    if (egresoAt.getTime() < ingresoAt.getTime()) {
      return Response.json(
        { error: "El egreso no puede ser anterior al ingreso" },
        { status: 400 }
      );
    }
  }

  let periodo;
  try {
    periodo = await actualizarPeriodo(id, { ingresoAt, egresoAt }, user.id);
  } catch (err) {
    if (err instanceof PeriodoAbiertoError) {
      return Response.json(
        { error: "El empleado ya tiene otro período abierto" },
        { status: 409 }
      );
    }
    throw err;
  }
  if (!periodo) {
    return Response.json({ error: "Período no encontrado" }, { status: 404 });
  }

  const corregido = await marcarCorregido(id, user.id, user.id);
  return Response.json({ periodo: corregido ?? periodo });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  const { id } = await params;
  if (!isValidUUID(id)) {
    return Response.json({ error: "Id de período inválido" }, { status: 400 });
  }

  const periodo = await eliminarPeriodo(id, user.id, user.id);
  if (!periodo) {
    return Response.json({ error: "Período no encontrado" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
