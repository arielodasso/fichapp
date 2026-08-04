import { pool } from "./client";

export interface Periodo {
  id: string;
  empleadoId: string;
  obraId: string;
  ingresoAt: Date;
  egresoAt: Date | null;
  corregido: boolean;
  corregidoPor: string | null;
  corregidoEn: Date | null;
  createdAt: Date;
}

interface PeriodoRow {
  id: string;
  empleado_id: string;
  obra_id: string;
  ingreso_at: Date;
  egreso_at: Date | null;
  corregido: boolean;
  corregido_por: string | null;
  corregido_en: Date | null;
  created_at: Date;
}

export class PeriodoAbiertoError extends Error {
  constructor() {
    super("El empleado ya tiene un período de trabajo abierto");
    this.name = "PeriodoAbiertoError";
  }
}

function mapPeriodo(row: PeriodoRow): Periodo {
  return {
    id: row.id,
    empleadoId: row.empleado_id,
    obraId: row.obra_id,
    ingresoAt: row.ingreso_at,
    egresoAt: row.egreso_at,
    corregido: row.corregido,
    corregidoPor: row.corregido_por,
    corregidoEn: row.corregido_en,
    createdAt: row.created_at,
  };
}

function isUniqueViolation(err: unknown): boolean {
  return (err as { code?: string }).code === "23505";
}

export async function createIngreso(
  empleadoId: string,
  obraId: string,
  ingresoAt: Date
): Promise<Periodo> {
  try {
    const { rows } = await pool.query<PeriodoRow>(
      `INSERT INTO periodos (empleado_id, obra_id, ingreso_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [empleadoId, obraId, ingresoAt]
    );
    return mapPeriodo(rows[0]);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new PeriodoAbiertoError();
    }
    throw err;
  }
}

export async function findPeriodoAbierto(
  empleadoId: string
): Promise<Periodo | null> {
  const { rows } = await pool.query<PeriodoRow>(
    `SELECT * FROM periodos WHERE empleado_id = $1 AND egreso_at IS NULL AND eliminado = false`,
    [empleadoId]
  );
  return rows[0] ? mapPeriodo(rows[0]) : null;
}

export async function cerrarPeriodo(
  id: string,
  egresoAt: Date
): Promise<Periodo | null> {
  const { rows } = await pool.query<PeriodoRow>(
    `UPDATE periodos SET egreso_at = $2 WHERE id = $1 RETURNING *`,
    [id, egresoAt]
  );
  return rows[0] ? mapPeriodo(rows[0]) : null;
}

export async function marcarCorregido(
  id: string,
  userId: string,
  jefeId?: string
): Promise<Periodo | null> {
  const { rows } = await pool.query<PeriodoRow>(
    `UPDATE periodos
     SET corregido = true, corregido_por = $2, corregido_en = now()
     WHERE id = $1
       AND ($3::uuid IS NULL OR empleado_id IN (SELECT id FROM empleados WHERE jefe_id = $3))
     RETURNING *`,
    [id, userId, jefeId ?? null]
  );
  return rows[0] ? mapPeriodo(rows[0]) : null;
}

export async function listPeriodosEntre(
  fechaDesde: Date,
  fechaHasta: Date,
  jefeId: string
): Promise<Periodo[]> {
  const { rows } = await pool.query<PeriodoRow>(
    `SELECT * FROM periodos
     WHERE ingreso_at < $2
       AND (egreso_at IS NULL OR egreso_at >= $1)
       AND eliminado = false
       AND empleado_id IN (SELECT id FROM empleados WHERE jefe_id = $3)
     ORDER BY ingreso_at ASC`,
    [fechaDesde, fechaHasta, jefeId]
  );
  return rows.map(mapPeriodo);
}

export async function listPeriodosDeEmpleado(
  empleadoId: string
): Promise<Periodo[]> {
  const { rows } = await pool.query<PeriodoRow>(
    `SELECT * FROM periodos
     WHERE empleado_id = $1 AND eliminado = false
     ORDER BY ingreso_at DESC`,
    [empleadoId]
  );
  return rows.map(mapPeriodo);
}

export async function listAllPeriodos(jefeId: string): Promise<Periodo[]> {
  const { rows } = await pool.query<PeriodoRow>(
    `SELECT * FROM periodos
     WHERE eliminado = false
       AND empleado_id IN (SELECT id FROM empleados WHERE jefe_id = $1)
     ORDER BY ingreso_at DESC`,
    [jefeId]
  );
  return rows.map(mapPeriodo);
}

export async function actualizarPeriodo(
  id: string,
  input: { ingresoAt: Date; egresoAt: Date | null },
  jefeId?: string
): Promise<Periodo | null> {
  try {
    const { rows } = await pool.query<PeriodoRow>(
      `UPDATE periodos SET ingreso_at = $2, egreso_at = $3
       WHERE id = $1
         AND ($4::uuid IS NULL OR empleado_id IN (SELECT id FROM empleados WHERE jefe_id = $4))
       RETURNING *`,
      [id, input.ingresoAt, input.egresoAt, jefeId ?? null]
    );
    return rows[0] ? mapPeriodo(rows[0]) : null;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new PeriodoAbiertoError();
    }
    throw err;
  }
}

export async function eliminarPeriodo(
  id: string,
  userId: string,
  jefeId?: string
): Promise<Periodo | null> {
  const { rows } = await pool.query<PeriodoRow>(
    `UPDATE periodos
     SET eliminado = true,
         corregido = true,
         corregido_por = $2,
         corregido_en = now(),
         egreso_at = COALESCE(egreso_at, ingreso_at)
     WHERE id = $1
       AND ($3::uuid IS NULL OR empleado_id IN (SELECT id FROM empleados WHERE jefe_id = $3))
     RETURNING *`,
    [id, userId, jefeId ?? null]
  );
  return rows[0] ? mapPeriodo(rows[0]) : null;
}
