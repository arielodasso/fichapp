import { pool } from "./client";

export type ObraEstado = "ACTIVA" | "PAUSADA" | "FINALIZADA";

export interface Obra {
  id: string;
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
    nombre: row.nombre,
    descripcion: row.descripcion,
    estado: row.estado,
    activo: row.activo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createObra(input: CreateObraInput): Promise<Obra> {
  const { rows } = await pool.query<ObraRow>(
    `INSERT INTO obras (nombre, descripcion, estado)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [input.nombre, input.descripcion ?? null, input.estado ?? "ACTIVA"]
  );
  return mapObra(rows[0]);
}

export async function listObras(options?: {
  soloActivas?: boolean;
}): Promise<Obra[]> {
  const { rows } = await pool.query<ObraRow>(
    `SELECT * FROM obras
     WHERE ($1::boolean IS NULL OR activo = $1)
     ORDER BY nombre ASC`,
    [options?.soloActivas ?? null]
  );
  return rows.map(mapObra);
}

export async function findObraById(id: string): Promise<Obra | null> {
  const { rows } = await pool.query<ObraRow>(
    `SELECT * FROM obras WHERE id = $1`,
    [id]
  );
  return rows[0] ? mapObra(rows[0]) : null;
}

export async function updateObra(
  id: string,
  input: UpdateObraInput
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
    return findObraById(id);
  }

  sets.push(`updated_at = now()`);
  values.push(id);

  const { rows } = await pool.query<ObraRow>(
    `UPDATE obras SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
  return rows[0] ? mapObra(rows[0]) : null;
}

export async function deactivateObra(id: string): Promise<Obra | null> {
  return updateObra(id, { activo: false });
}
