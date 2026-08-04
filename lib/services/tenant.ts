import type { SessionUser } from "./auth";
import { findEmpleadoByUserId } from "@/lib/db/empleados";

/**
 * Resuelve el id del tenant (el jefe/ADMIN dueño de los datos) para cualquier
 * usuario autenticado. Un ADMIN es dueño de su propio espacio; un empleado
 * hereda el espacio del jefe que le dio de alta (multi-tenancy).
 */
export async function resolveTenantId(
  user: SessionUser
): Promise<string | null> {
  if (user.role === "ADMIN") return user.id;
  const empleado = await findEmpleadoByUserId(user.id);
  return empleado ? empleado.jefeId : null;
}
