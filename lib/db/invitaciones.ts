import { pool } from "./client";
import { mapUser, type User, type UserRow } from "./users";

export interface Invitacion {
  id: string;
  empleadoId: string;
  creadoPor: string;
  codigo: string;
  usadoPor: string | null;
  usadoEn: Date | null;
  expiraEn: Date | null;
  createdAt: Date;
  empleadoNombre?: string;
  empleadoApellido?: string;
  empleadoVinculado?: boolean;
  empleadoActivo?: boolean;
}

export interface CreateInvitacionInput {
  empleadoId: string;
  creadoPor: string;
  codigo: string;
  expiraEn: Date;
}

interface InvitacionRow {
  id: string;
  empleado_id: string;
  creado_por: string;
  codigo: string;
  usado_por: string | null;
  usado_en: Date | null;
  expira_en: Date | null;
  created_at: Date;
  empleado_nombre?: string;
  empleado_apellido?: string;
  empleado_user_id?: string | null;
  empleado_activo?: boolean;
}

export class InvitacionNoValidaError extends Error {
  constructor() {
    super("El enlace de invitación no es válido, fue usado o está expirado");
    this.name = "InvitacionNoValidaError";
  }
}

export class EmpleadoYaVinculadoError extends Error {
  constructor() {
    super("Este empleado ya tiene un usuario vinculado");
    this.name = "EmpleadoYaVinculadoError";
  }
}

function mapInvitacion(row: InvitacionRow): Invitacion {
  return {
    id: row.id,
    empleadoId: row.empleado_id,
    creadoPor: row.creado_por,
    codigo: row.codigo,
    usadoPor: row.usado_por,
    usadoEn: row.usado_en,
    expiraEn: row.expira_en,
    createdAt: row.created_at,
    empleadoNombre: row.empleado_nombre,
    empleadoApellido: row.empleado_apellido,
    empleadoVinculado:
      row.empleado_user_id !== undefined ? row.empleado_user_id !== null : undefined,
    empleadoActivo: row.empleado_activo,
  };
}

export async function createInvitacion(
  input: CreateInvitacionInput
): Promise<Invitacion> {
  const { rows } = await pool.query<InvitacionRow>(
    `INSERT INTO invitaciones (empleado_id, creado_por, codigo, expira_en)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.empleadoId, input.creadoPor, input.codigo, input.expiraEn]
  );
  return mapInvitacion(rows[0]);
}

export async function findInvitacionPendientePorEmpleado(
  empleadoId: string
): Promise<Invitacion | null> {
  const { rows } = await pool.query<InvitacionRow>(
    `SELECT * FROM invitaciones
     WHERE empleado_id = $1
       AND usado_en IS NULL
       AND expira_en > now()
     ORDER BY created_at DESC
     LIMIT 1`,
    [empleadoId]
  );
  return rows[0] ? mapInvitacion(rows[0]) : null;
}

export async function findInvitacionVigentePorCodigo(
  codigo: string
): Promise<Invitacion | null> {
  const { rows } = await pool.query<InvitacionRow>(
    `SELECT i.*,
            e.nombre  AS empleado_nombre,
            e.apellido AS empleado_apellido,
            e.user_id AS empleado_user_id,
            e.activo  AS empleado_activo
     FROM invitaciones i
     JOIN empleados e ON e.id = i.empleado_id
     WHERE i.codigo = $1`,
    [codigo]
  );
  const row = rows[0];
  if (!row) return null;
  const ahora = new Date();
  if (row.usado_en || (row.expira_en && row.expira_en <= ahora)) {
    return null;
  }
  const invitacion = mapInvitacion(row);
  return invitacion.empleadoActivo === false ? null : invitacion;
}

export async function listInvitaciones(): Promise<Invitacion[]> {
  const { rows } = await pool.query<InvitacionRow>(
    `SELECT i.*,
            e.nombre   AS empleado_nombre,
            e.apellido AS empleado_apellido,
            e.user_id  AS empleado_user_id,
            e.activo   AS empleado_activo
     FROM invitaciones i
     JOIN empleados e ON e.id = i.empleado_id
     ORDER BY i.created_at DESC`
  );
  return rows.map(mapInvitacion);
}

export async function deleteInvitacion(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM invitaciones WHERE id = $1`,
    [id]
  );
  return (rowCount ?? 0) > 0;
}

export async function registrarEmpleadoInvitado(
  codigo: string,
  input: { email: string; name: string; passwordHash: string }
): Promise<User> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const invRes = await client.query<InvitacionRow>(
      `SELECT * FROM invitaciones WHERE codigo = $1 FOR UPDATE`,
      [codigo]
    );
    const inv = invRes.rows[0];
    const ahora = new Date();
    if (!inv || inv.usado_en || (inv.expira_en && inv.expira_en <= ahora)) {
      throw new InvitacionNoValidaError();
    }

    const empRes = await client.query<{
      user_id: string | null;
      activo: boolean;
    }>(
      `SELECT user_id, activo FROM empleados WHERE id = $1 FOR UPDATE`,
      [inv.empleado_id]
    );
    const emp = empRes.rows[0];
    if (!emp || !emp.activo) {
      throw new InvitacionNoValidaError();
    }
    if (emp.user_id) {
      throw new EmpleadoYaVinculadoError();
    }

    const userRes = await client.query<UserRow>(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'EMPLOYEE')
       RETURNING *`,
      [input.email, input.passwordHash, input.name]
    );
    const user = mapUser(userRes.rows[0]);

    await client.query(
      `UPDATE empleados SET user_id = $1, updated_at = now() WHERE id = $2`,
      [user.id, inv.empleado_id]
    );
    await client.query(
      `UPDATE invitaciones SET usado_por = $1, usado_en = now() WHERE id = $2`,
      [user.id, inv.id]
    );

    await client.query("COMMIT");
    return user;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
