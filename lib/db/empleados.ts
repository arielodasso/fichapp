import { pool } from "./client";

export interface Empleado {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  rol: string;
  activo: boolean;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmpleadoInput {
  nombre: string;
  apellido: string;
  documento: string;
  rol?: string;
  userId?: string | null;
}

export interface UpdateEmpleadoInput {
  nombre?: string;
  apellido?: string;
  documento?: string;
  rol?: string;
  activo?: boolean;
  userId?: string | null;
}

interface EmpleadoRow {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  rol: string;
  activo: boolean;
  user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapEmpleado(row: EmpleadoRow): Empleado {
  return {
    id: row.id,
    nombre: row.nombre,
    apellido: row.apellido,
    documento: row.documento,
    rol: row.rol,
    activo: row.activo,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createEmpleado(
  input: CreateEmpleadoInput
): Promise<Empleado> {
  const { rows } = await pool.query<EmpleadoRow>(
    `INSERT INTO empleados (nombre, apellido, documento, rol, user_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.nombre, input.apellido, input.documento, input.rol ?? "OBRERO", input.userId ?? null]
  );
  return mapEmpleado(rows[0]);
}

export async function listEmpleados(options?: {
  soloActivos?: boolean;
}): Promise<Empleado[]> {
  const { rows } = await pool.query<EmpleadoRow>(
    `SELECT * FROM empleados
     WHERE ($1::boolean IS NULL OR activo = $1)
     ORDER BY apellido ASC, nombre ASC`,
    [options?.soloActivos ?? null]
  );
  return rows.map(mapEmpleado);
}

export async function findEmpleadoById(id: string): Promise<Empleado | null> {
  const { rows } = await pool.query<EmpleadoRow>(
    `SELECT * FROM empleados WHERE id = $1`,
    [id]
  );
  return rows[0] ? mapEmpleado(rows[0]) : null;
}

export async function findEmpleadoByUserId(
  userId: string
): Promise<Empleado | null> {
  const { rows } = await pool.query<EmpleadoRow>(
    `SELECT * FROM empleados WHERE user_id = $1`,
    [userId]
  );
  return rows[0] ? mapEmpleado(rows[0]) : null;
}

export async function updateEmpleado(
  id: string,
  input: UpdateEmpleadoInput
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

  if (sets.length === 0) {
    return findEmpleadoById(id);
  }

  sets.push(`updated_at = now()`);
  values.push(id);

  const { rows } = await pool.query<EmpleadoRow>(
    `UPDATE empleados SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
  return rows[0] ? mapEmpleado(rows[0]) : null;
}

export async function deactivateEmpleado(id: string): Promise<Empleado | null> {
  return updateEmpleado(id, { activo: false });
}
