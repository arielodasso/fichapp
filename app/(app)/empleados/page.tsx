import { requireAdmin } from "@/lib/services/current-user";
import { listEmpleados } from "@/lib/db/empleados";
import { listUsers } from "@/lib/db/users";
import { listInvitaciones } from "@/lib/db/invitaciones";
import { listObras } from "@/lib/db/obras";
import { EmpleadosScreen } from "./empleados-screen";

export default async function EmpleadosPage() {
  await requireAdmin();

  const [empleados, usuarios, invitaciones, obras] = await Promise.all([
    listEmpleados(),
    listUsers(),
    listInvitaciones(),
    listObras(),
  ]);

  const invitacionesPorEmpleado = new Map<
    string,
    { id: string; codigo: string; expiraEn: string }
  >();
  const ahora = new Date();
  for (const i of invitaciones) {
    if (
      !invitacionesPorEmpleado.has(i.empleadoId) &&
      !i.usadoEn &&
      i.expiraEn &&
      i.expiraEn > ahora
    ) {
      invitacionesPorEmpleado.set(i.empleadoId, {
        id: i.id,
        codigo: i.codigo,
        expiraEn: i.expiraEn.toISOString(),
      });
    }
  }

  return (
    <EmpleadosScreen
      empleados={empleados.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        apellido: e.apellido,
        documento: e.documento,
        rol: e.rol,
        activo: e.activo,
        userId: e.userId,
        obraIds: e.obraIds,
      }))}
      usuarios={usuarios.map((u) => ({ id: u.id, email: u.email, name: u.name }))}
      obras={obras.map((o) => ({ id: o.id, nombre: o.nombre }))}
      invitaciones={Object.fromEntries(invitacionesPorEmpleado)}
    />
  );
}
