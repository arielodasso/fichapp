import { pool } from "./client";

export type ObraEstado = "ACTIVA" | "PAUSADA" | "FINALIZADA";

export interface Obra {
  id: string;
  jefeId: string;
  nombre: string;
  descripcion: string | null;
  estado: ObraEstado;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateObraInput {
  nombre: string;
  descripcion?: string | null;
  estado?: ObraEstado;
}

export interface UpdateObraInput {
  nombre?: string;
  descripcion?: string | null;
  estado?: ObraEstado;
  activo?: boolean;
}

interface ObraRow {
  id: string;
  jefe_id: string;
  nombre: string;
  descripcion: string | null;
  estado: ObraEstado;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapObra(row: ObraRow): Obra {
  return {
    id: row.id,
    jefeId: row.jefe_id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    estado: row.estado,
    activo: row.activo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createObra(
  jefeId: string,
  input: CreateObraInput
): Promise<Obra> {
  const { rows } = await pool.query<ObraRow>(
    `INSERT INTO obras (jefe_id, nombre, descripcion, estado)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [jefeId, input.nombre, input.descripcion ?? null, input.estado ?? "ACTIVA"]
  );
  return mapObra(rows[0]);
}

export async function listObras(
  jefeId: string,
  options?: {
    soloActivas?: boolean;
  }
): Promise<Obra[]> {
  const { rows } = await pool.query<ObraRow>(
    `SELECT * FROM obras
     WHERE jefe_id = $1
       AND ($2::boolean IS NOT TRUE OR activo = true)
     ORDER BY nombre ASC`,
    [jefeId, options?.soloActivas ?? null]
  );
  return rows.map(mapObra);
}

export async function findObraById(
  id: string,
  jefeId?: string
): Promise<Obra | null> {
  const { rows } = await pool.query<ObraRow>(
    `SELECT * FROM obras WHERE id = $1 AND ($2::uuid IS NULL OR jefe_id = $2)`,
    [id, jefeId ?? null]
  );
  return rows[0] ? mapObra(rows[0]) : null;
}

export async function listObrasDeEmpleado(
  empleadoId: string,
  jefeId?: string
): Promise<Obra[]> {
  const { rows } = await pool.query<ObraRow>(
    `SELECT o.*
     FROM obras o
     JOIN empleado_obras eo ON eo.obra_id = o.id
     WHERE eo.empleado_id = $1
       AND o.activo = true
       AND ($2::uuid IS NULL OR o.jefe_id = $2)
     ORDER BY o.nombre ASC`,
    [empleadoId, jefeId ?? null]
  );
  return rows.map(mapObra);
}

export async function updateObra(
  id: string,
  input: UpdateObraInput,
  jefeId?: string
): Promise<Obra | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (input.nombre !== undefined) {
    sets.push(`nombre = $${i++}`);
    values.push(input.nombre);
  }
  if (input.descripcion !== undefined) {
    sets.push(`descripcion = $${i++}`);
    values.push(input.descripcion);
  }
  if (input.estado !== undefined) {
    sets.push(`estado = $${i++}`);
    values.push(input.estado);
  }
  if (input.activo !== undefined) {
    sets.push(`activo = $${i++}`);
    values.push(input.activo);
  }

  if (sets.length === 0) {
    return findObraById(id, jefeId);
  }

  sets.push(`updated_at = now()`);
  values.push(id);

  let whereClause = `id = $${i++}`;
  if (jefeId) {
    whereClause += ` AND jefe_id = $${i++}`;
    values.push(jefeId);
  }

  const { rows } = await pool.query<ObraRow>(
    `UPDATE obras SET ${sets.join(", ")} WHERE ${whereClause} RETURNING *`,
    values
  );
  return rows[0] ? mapObra(rows[0]) : null;
}

export async function deactivateObra(
  id: string,
  jefeId?: string
): Promise<Obra | null> {
  return updateObra(id, { activo: false }, jefeId);
}
