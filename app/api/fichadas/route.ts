import { getCurrentUser } from "@/lib/services/current-user";
import { isValidUUID } from "@/lib/utils";
import {
  calcularHoras,
  validarEgreso,
  validarIngreso,
} from "@/lib/domain/horarios";
import { findEmpleadoByUserId } from "@/lib/db/empleados";
import { findObraById, listObras } from "@/lib/db/obras";
import {
  PeriodoAbiertoError,
  cerrarPeriodo,
  createIngreso,
  findPeriodoAbierto,
  listPeriodosDeEmpleado,
} from "@/lib/db/fichadas";

interface FichadaBody {
  tipo?: unknown;
  obraId?: unknown;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const empleado = await findEmpleadoByUserId(user.id);
  const obras = await listObras({ soloActivas: true });

  const periodos = empleado
    ? await listPeriodosDeEmpleado(empleado.id)
    : [];

  const obraNombre = new Map(obras.map((o) => [o.id, o.nombre]));

  return Response.json({
    empleado: empleado
      ? {
          id: empleado.id,
          nombre: empleado.nombre,
          apellido: empleado.apellido,
        }
      : null,
    obras: obras.map((o) => ({ id: o.id, nombre: o.nombre })),
    periodos: periodos.map((p) => ({
      id: p.id,
      obraId: p.obraId,
      obraNombre: obraNombre.get(p.obraId) ?? "Desconocida",
      ingresoAt: p.ingresoAt,
      egresoAt: p.egresoAt,
      corregido: p.corregido,
      horas: p.egresoAt ? calcularHoras(p.ingresoAt, p.egresoAt) : null,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const empleado = await findEmpleadoByUserId(user.id);
  if (!empleado) {
    return Response.json(
      { error: "No tenés un perfil de empleado asociado" },
      { status: 400 }
    );
  }

  let body: FichadaBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const tipo = body.tipo;
  if (tipo !== "ingreso" && tipo !== "egreso") {
    return Response.json(
      { error: "Tipo inválido: debe ser ingreso o egreso" },
      { status: 400 }
    );
  }

  const ahora = new Date();

  if (tipo === "ingreso") {
    const obraId = typeof body.obraId === "string" ? body.obraId : "";
    if (!obraId) {
      return Response.json(
        { error: "Seleccioná una obra para el ingreso" },
        { status: 400 }
      );
    }
    if (!isValidUUID(obraId)) {
      return Response.json(
        { error: "Id de obra inválido" },
        { status: 400 }
      );
    }

    const obra = await findObraById(obraId);
    if (!obra || !obra.activo) {
      return Response.json({ error: "La obra no existe o está inactiva" }, { status: 400 });
    }

    const periodoActivo = await findPeriodoAbierto(empleado.id);
    try {
      validarIngreso(periodoActivo);
    } catch {
      return Response.json(
        { error: "Ya tenés un período de trabajo abierto" },
        { status: 409 }
      );
    }

    try {
      const periodo = await createIngreso(empleado.id, obraId, ahora);
      return Response.json({
        periodo: {
          id: periodo.id,
          obraId: periodo.obraId,
          ingresoAt: periodo.ingresoAt,
          egresoAt: null,
          horas: null,
        },
      });
    } catch (err) {
      if (err instanceof PeriodoAbiertoError) {
        return Response.json(
          { error: "Ya tenés un período de trabajo abierto" },
          { status: 409 }
        );
      }
      throw err;
    }
  }

  const periodoActivo = await findPeriodoAbierto(empleado.id);
  try {
    validarEgreso(periodoActivo);
  } catch {
    return Response.json(
      { error: "No tenés un período de trabajo abierto" },
      { status: 400 }
    );
  }

  const periodo = await cerrarPeriodo(periodoActivo.id, ahora);
  if (!periodo) {
    return Response.json({ error: "No se encontró el período" }, { status: 404 });
  }

  return Response.json({
    periodo: {
      id: periodo.id,
      obraId: periodo.obraId,
      ingresoAt: periodo.ingresoAt,
      egresoAt: periodo.egresoAt,
      horas: periodo.egresoAt
        ? calcularHoras(periodo.ingresoAt, periodo.egresoAt)
        : null,
    },
  });
}
