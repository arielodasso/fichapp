import { pool } from "./client";

export interface Empleado {
  id: string;
  jefeId: string;
  nombre: string;
  apellido: string;
  documento: string;
  rol: string;
  activo: boolean;
  userId: string | null;
  obraIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmpleadoInput {
  nombre: string;
  apellido: string;
  documento: string;
  rol?: string;
  userId?: string | null;
  obraIds?: string[];
}

export interface UpdateEmpleadoInput {
  nombre?: string;
  apellido?: string;
  documento?: string;
  rol?: string;
  activo?: boolean;
  userId?: string | null;
  obraIds?: string[];
}

interface EmpleadoRow {
  id: string;
  jefe_id: string;
  nombre: string;
  apellido: string;
  documento: string;
  rol: string;
  activo: boolean;
  user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapEmpleado(row: EmpleadoRow, obraIds: string[] = []): Empleado {
  return {
    id: row.id,
    jefeId: row.jefe_id,
    nombre: row.nombre,
    apellido: row.apellido,
    documento: row.documento,
    rol: row.rol,
    activo: row.activo,
    userId: row.user_id,
    obraIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchObraIds(empleadoIds: string[]): Promise<Map<string, string[]>> {
  if (empleadoIds.length === 0) {
    return new Map();
  }
  const { rows } = await pool.query<{ empleado_id: string; obra_id: string }>(
    `SELECT empleado_id, obra_id FROM empleado_obras
     WHERE empleado_id = ANY($1)`,
    [empleadoIds]
  );
  const porEmpleado = new Map<string, string[]>();
  for (const r of rows) {
    const lista = porEmpleado.get(r.empleado_id) ?? [];
    lista.push(r.obra_id);
    porEmpleado.set(r.empleado_id, lista);
  }
  return porEmpleado;
}

export async function asignarObrasEmpleado(
  empleadoId: string,
  obraIds: string[],
  jefeId?: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM empleado_obras WHERE empleado_id = $1`, [
      empleadoId,
    ]);
    for (const obraId of obraIds) {
      await client.query(
        `INSERT INTO empleado_obras (empleado_id, obra_id)
         SELECT $1, $2
         WHERE EXISTS (SELECT 1 FROM obras o WHERE o.id = $2 AND ($3::uuid IS NULL OR o.jefe_id = $3))`,
        [empleadoId, obraId, jefeId ?? null]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function createEmpleado(
  jefeId: string,
  input: CreateEmpleadoInput
): Promise<Empleado> {
  const { rows } = await pool.query<EmpleadoRow>(
    `INSERT INTO empleados (jefe_id, nombre, apellido, documento, rol, user_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      jefeId,
      input.nombre,
      input.apellido,
      input.documento,
      input.rol ?? "OBRERO",
      input.userId ?? null,
    ]
  );
  const empleado = mapEmpleado(rows[0]);
  const obraIds = input.obraIds ?? [];
  if (obraIds.length > 0) {
    await asignarObrasEmpleado(empleado.id, obraIds, jefeId);
    empleado.obraIds = obraIds;
  }
  return empleado;
}

export async function listEmpleados(
  jefeId: string,
  options?: {
    soloActivos?: boolean;
  }
): Promise<Empleado[]> {
  const { rows } = await pool.query<EmpleadoRow>(
    `SELECT * FROM empleados
     WHERE jefe_id = $1
       AND ($2::boolean IS NULL OR activo = $2)
     ORDER BY apellido ASC, nombre ASC`,
    [jefeId, options?.soloActivos ?? null]
  );
  const obraIds = await fetchObraIds(rows.map((r) => r.id));
  return rows.map((r) => mapEmpleado(r, obraIds.get(r.id) ?? []));
}

export async function findEmpleadoById(
  id: string,
  jefeId?: string
): Promise<Empleado | null> {
  const { rows } = await pool.query<EmpleadoRow>(
    `SELECT * FROM empleados WHERE id = $1 AND ($2::uuid IS NULL OR jefe_id = $2)`,
    [id, jefeId ?? null]
  );
  if (!rows[0]) return null;
  const obraIds = await fetchObraIds([id]);
  return mapEmpleado(rows[0], obraIds.get(id) ?? []);
}

export async function findEmpleadoByUserId(
  userId: string
): Promise<Empleado | null> {
  const { rows } = await pool.query<EmpleadoRow>(
    `SELECT * FROM empleados WHERE user_id = $1`,
    [userId]
  );
  if (!rows[0]) return null;
  const obraIds = await fetchObraIds([rows[0].id]);
  return mapEmpleado(rows[0], obraIds.get(rows[0].id) ?? []);
}

export async function updateEmpleado(
  id: string,
  input: UpdateEmpleadoInput,
  jefeId?: string
): Promise<Empleado | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (input.nombre !== undefined) {
    sets.push(`nombre = $${i++}`);
    values.push(input.nombre);
  }
  if (input.apellido !== undefined) {
    sets.push(`apellido = $${i++}`);
    values.push(input.apellido);
  }
  if (input.documento !== undefined) {
    sets.push(`documento = $${i++}`);
    values.push(input.documento);
  }
  if (input.rol !== undefined) {
    sets.push(`rol = $${i++}`);
    values.push(input.rol);
  }
  if (input.activo !== undefined) {
    sets.push(`activo = $${i++}`);
    values.push(input.activo);
  }
  if (input.userId !== undefined) {
    sets.push(`user_id = $${i++}`);
    values.push(input.userId);
  }

  let empleado: Empleado | null = null;
  if (sets.length === 0) {
    empleado = await findEmpleadoById(id, jefeId);
  } else {
    sets.push(`updated_at = now()`);
    values.push(id);

    let whereClause = `id = $${i++}`;
    if (jefeId) {
      whereClause += ` AND jefe_id = $${i++}`;
      values.push(jefeId);
    }

    const { rows } = await pool.query<EmpleadoRow>(
      `UPDATE empleados SET ${sets.join(", ")} WHERE ${whereClause} RETURNING *`,
      values
    );
    empleado = rows[0] ? mapEmpleado(rows[0]) : null;
  }

  if (empleado && input.obraIds !== undefined) {
    await asignarObrasEmpleado(id, input.obraIds, jefeId);
    empleado.obraIds = input.obraIds;
  }

  return empleado;
}

export async function deactivateEmpleado(
  id: string,
  jefeId?: string
): Promise<Empleado | null> {
  return updateEmpleado(id, { activo: false }, jefeId);
}
