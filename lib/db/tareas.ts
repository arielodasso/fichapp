import { pool } from "./client";

export type TareaEstado = "PENDIENTE" | "EN_PROGRESO" | "COMPLETADA";

export interface Tarea {
  id: string;
  jefeId: string;
  obraId: string | null;
  empleadoId: string;
  titulo: string;
  descripcion: string | null;
  estado: TareaEstado;
  creadoPor: string;
  completadaEn: Date | null;
  createdAt: Date;
  updatedAt: Date;
  obraNombre?: string | null;
  empleadoNombre?: string;
  empleadoApellido?: string;
}

export interface CreateTareaInput {
  obraId?: string | null;
  empleadoId: string;
  titulo: string;
  descripcion?: string | null;
  creadoPor: string;
}

export interface UpdateTareaInput {
  titulo?: string;
  descripcion?: string | null;
  obraId?: string | null;
  empleadoId?: string | null;
  estado?: TareaEstado;
}

interface TareaRow {
  id: string;
  jefe_id: string;
  obra_id: string | null;
  empleado_id: string;
  titulo: string;
  descripcion: string | null;
  estado: TareaEstado;
  creado_por: string;
  completada_en: Date | null;
  created_at: Date;
  updated_at: Date;
  obra_nombre?: string | null;
  empleado_nombre?: string;
  empleado_apellido?: string;
}

function mapTarea(row: TareaRow): Tarea {
  return {
    id: row.id,
    jefeId: row.jefe_id,
    obraId: row.obra_id,
    empleadoId: row.empleado_id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    estado: row.estado,
    creadoPor: row.creado_por,
    completadaEn: row.completada_en,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    obraNombre: row.obra_nombre,
    empleadoNombre: row.empleado_nombre,
    empleadoApellido: row.empleado_apellido,
  };
}

const TAREA_SELECT = `SELECT t.*,
       o.nombre AS obra_nombre,
       e.nombre AS empleado_nombre,
       e.apellido AS empleado_apellido
FROM tareas t
LEFT JOIN obras o ON o.id = t.obra_id
JOIN empleados e ON e.id = t.empleado_id`;

export async function createTarea(
  jefeId: string,
  input: CreateTareaInput
): Promise<Tarea | null> {
  const { rows } = await pool.query<TareaRow>(
    `INSERT INTO tareas (jefe_id, obra_id, empleado_id, titulo, descripcion, creado_por)
     SELECT $1, $2, $3, $4, $5, $6
     WHERE EXISTS (SELECT 1 FROM empleados e WHERE e.id = $3 AND e.jefe_id = $1)
       AND ($2::uuid IS NULL OR EXISTS (SELECT 1 FROM obras o WHERE o.id = $2 AND o.jefe_id = $1))
     RETURNING *`,
    [
      jefeId,
      input.obraId ?? null,
      input.empleadoId,
      input.titulo,
      input.descripcion ?? null,
      input.creadoPor,
    ]
  );
  if (!rows[0]) return null;
  return mapTarea(rows[0]);
}

export async function listTareas(
  jefeId: string,
  options?: {
    obraId?: string | null;
    empleadoId?: string | null;
    estado?: TareaEstado | null;
  }
): Promise<Tarea[]> {
  const { rows } = await pool.query<TareaRow>(
    `${TAREA_SELECT}
     WHERE t.jefe_id = $1
       AND ($2::uuid IS NULL OR t.obra_id = $2)
       AND ($3::uuid IS NULL OR t.empleado_id = $3)
       AND ($4::text IS NULL OR t.estado = $4)
     ORDER BY t.created_at DESC`,
    [
      jefeId,
      options?.obraId ?? null,
      options?.empleadoId ?? null,
      options?.estado ?? null,
    ]
  );
  return rows.map(mapTarea);
}

export async function listTareasDeEmpleado(
  empleadoId: string,
  jefeId?: string
): Promise<Tarea[]> {
  const { rows } = await pool.query<TareaRow>(
    `${TAREA_SELECT}
     WHERE t.empleado_id = $1
       AND ($2::uuid IS NULL OR t.jefe_id = $2)
     ORDER BY t.created_at DESC`,
    [empleadoId, jefeId ?? null]
  );
  return rows.map(mapTarea);
}

export async function findTareaById(
  id: string,
  jefeId?: string
): Promise<Tarea | null> {
  const { rows } = await pool.query<TareaRow>(
    `${TAREA_SELECT}
     WHERE t.id = $1
       AND ($2::uuid IS NULL OR t.jefe_id = $2)`,
    [id, jefeId ?? null]
  );
  return rows[0] ? mapTarea(rows[0]) : null;
}

export async function updateTarea(
  id: string,
  input: UpdateTareaInput,
  jefeId: string
): Promise<Tarea | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (input.titulo !== undefined) {
    sets.push(`titulo = $${i++}`);
    values.push(input.titulo);
  }
  if (input.descripcion !== undefined) {
    sets.push(`descripcion = $${i++}`);
    values.push(input.descripcion);
  }
  if (input.obraId !== undefined) {
    sets.push(`obra_id = $${i++}`);
    values.push(input.obraId);
  }
  if (input.empleadoId !== undefined) {
    sets.push(`empleado_id = $${i++}`);
    values.push(input.empleadoId);
  }
  if (input.estado !== undefined) {
    sets.push(`estado = $${i++}`);
    sets.push(`completada_en = CASE WHEN $${i++} = 'COMPLETADA' THEN now() ELSE NULL END`);
    values.push(input.estado);
    values.push(input.estado);
  }

  if (sets.length === 0) {
    return findTareaById(id, jefeId);
  }

  sets.push(`updated_at = now()`);

  const idIdx = i++;
  const jefeIdx = i++;
  const obraIdx = input.obraId !== undefined ? i++ : null;
  const empIdx = input.empleadoId !== undefined ? i++ : null;

  values.push(id, jefeId);
  if (obraIdx !== null) values.push(input.obraId);
  if (empIdx !== null) values.push(input.empleadoId);

  let whereExtra = "";
  if (obraIdx !== null) {
    whereExtra += ` AND ($${obraIdx}::uuid IS NULL OR EXISTS
      (SELECT 1 FROM obras o WHERE o.id = $${obraIdx} AND o.jefe_id = $${jefeIdx}))`;
  }
  if (empIdx !== null) {
    whereExtra += ` AND ($${empIdx}::uuid IS NULL OR EXISTS
      (SELECT 1 FROM empleados e WHERE e.id = $${empIdx} AND e.jefe_id = $${jefeIdx}))`;
  }

  const { rows } = await pool.query<TareaRow>(
    `UPDATE tareas SET ${sets.join(", ")}
     WHERE id = $${idIdx} AND jefe_id = $${jefeIdx}${whereExtra}
     RETURNING *`,
    values
  );
  return rows[0] ? mapTarea(rows[0]) : null;
}

export async function updateTareaEstado(
  id: string,
  estado: TareaEstado,
  empleadoId: string
): Promise<Tarea | null> {
  const { rows } = await pool.query<TareaRow>(
    `UPDATE tareas
     SET estado = $2,
         completada_en = CASE WHEN $2 = 'COMPLETADA' THEN now() ELSE NULL END,
         updated_at = now()
     WHERE id = $1 AND empleado_id = $3
     RETURNING *`,
    [id, estado, empleadoId]
  );
  if (!rows[0]) return null;
  const tarea = mapTarea(rows[0]);
  return {
    ...tarea,
    obraNombre: tarea.obraNombre ?? null,
    empleadoNombre: tarea.empleadoNombre ?? "",
    empleadoApellido: tarea.empleadoApellido ?? "",
  };
}

export async function deleteTarea(
  id: string,
  jefeId: string
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM tareas WHERE id = $1 AND jefe_id = $2`,
    [id, jefeId]
  );
  return (rowCount ?? 0) > 0;
}
