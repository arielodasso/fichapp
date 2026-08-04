import { requireAdmin } from "@/lib/services/current-user";
import { listEmpleados } from "@/lib/db/empleados";
import { listUsers } from "@/lib/db/users";
import { listInvitaciones } from "@/lib/db/invitaciones";
import { listObras } from "@/lib/db/obras";
import { listAllPeriodos } from "@/lib/db/fichadas";
import { calcularHoras } from "@/lib/domain/horarios";
import { EmpleadosScreen } from "./empleados-screen";

export default async function EmpleadosPage() {
  await requireAdmin();

  const [empleados, usuarios, invitaciones, obras, periodos] =
    await Promise.all([
      listEmpleados(),
      listUsers(),
      listInvitaciones(),
      listObras(),
      listAllPeriodos(),
    ]);

  const horasTotales = new Map<string, number>();
  for (const p of periodos) {
    if (!p.egresoAt) continue;
    let horas: number;
    try {
      horas = calcularHoras(p.ingresoAt, p.egresoAt);
    } catch {
      continue;
    }
    const prev = horasTotales.get(p.empleadoId) ?? 0;
    horasTotales.set(p.empleadoId, Math.round((prev + horas) * 100) / 100);
  }

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
      horasTotales={Object.fromEntries(horasTotales)}
    />
  );
}
