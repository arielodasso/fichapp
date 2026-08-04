import { pool } from "./client";
import type { UserRole } from "./users";

export interface Organizacion {
  id: string;
  nombre: string;
  email: string;
  empleados: number;
  obras: number;
  fichadas: number;
  tareas: number;
  createdAt: Date;
}

export interface UsuarioGlobal {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export async function listOrganizaciones(): Promise<Organizacion[]> {
  const { rows } = await pool.query<{
    id: string;
    nombre: string;
    email: string;
    empleados: string;
    obras: string;
    fichadas: string;
    tareas: string;
    created_at: Date;
  }>(
    `SELECT u.id,
            u.name  AS nombre,
            u.email AS email,
            u.created_at,
            (SELECT count(*)::text FROM empleados e WHERE e.jefe_id = u.id)              AS empleados,
            (SELECT count(*)::text FROM obras o       WHERE o.jefe_id = u.id)              AS obras,
            (SELECT count(*)::text FROM periodos p
               JOIN empleados e2 ON e2.id = p.empleado_id
             WHERE e2.jefe_id = u.id AND p.eliminado = false)                              AS fichadas,
            (SELECT count(*)::text FROM tareas t      WHERE t.jefe_id = u.id)              AS tareas
     FROM users u
     WHERE u.role = 'ADMIN'
     ORDER BY u.created_at ASC, u.name ASC`
  );
  return rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    email: r.email,
    empleados: Number(r.empleados),
    obras: Number(r.obras),
    fichadas: Number(r.fichadas),
    tareas: Number(r.tareas),
    createdAt: r.created_at,
  }));
}

export async function listUsuariosGlobales(): Promise<UsuarioGlobal[]> {
  const { rows } = await pool.query<{
    id: string;
    email: string;
    name: string;
    role: UserRole;
    created_at: Date;
  }>(
    `SELECT id, email, name, role, created_at
     FROM users
     ORDER BY created_at ASC, name ASC`
  );
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    createdAt: r.created_at,
  }));
}

export async function deleteUserAccount(userId: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const res = await client.query<{ role: UserRole }>(
      `SELECT role FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );
    const user = res.rows[0];
    if (!user) {
      await client.query("ROLLBACK");
      return false;
    }
    if (user.role === "SUPERADMIN") {
      await client.query("ROLLBACK");
      return false;
    }

    if (user.role === "ADMIN") {
      await deleteOrganizacionTx(client, userId);
    } else {
      await client.query(`UPDATE empleados SET user_id = NULL WHERE user_id = $1`, [
        userId,
      ]);
      await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    }

    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function deleteOrganizacionTx(
  client: import("pg").PoolClient,
  jefeId: string
): Promise<void> {
  await client.query(
    `DELETE FROM periodos
     WHERE empleado_id IN (SELECT id FROM empleados WHERE jefe_id = $1)`,
    [jefeId]
  );
  await client.query(`DELETE FROM tareas WHERE jefe_id = $1`, [jefeId]);
  await client.query(
    `DELETE FROM users
     WHERE role = 'EMPLOYEE'
       AND id IN (SELECT user_id FROM empleados WHERE jefe_id = $1 AND user_id IS NOT NULL)`,
    [jefeId]
  );
  await client.query(`DELETE FROM obras WHERE jefe_id = $1`, [jefeId]);
  await client.query(`DELETE FROM empleados WHERE jefe_id = $1`, [jefeId]);
  await client.query(`DELETE FROM users WHERE id = $1 AND role = 'ADMIN'`, [
    jefeId,
  ]);
}

export async function deleteOrganizacion(jefeId: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query<{ role: string }>(
      `SELECT role FROM users WHERE id = $1 FOR UPDATE`,
      [jefeId]
    );
    if (!res.rows[0] || res.rows[0].role !== "ADMIN") {
      await client.query("ROLLBACK");
      return false;
    }
    await deleteOrganizacionTx(client, jefeId);
    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
