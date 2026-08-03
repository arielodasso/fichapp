import { requireAdmin } from "@/lib/services/current-user";
import { listAllPeriodos } from "@/lib/db/fichadas";
import { listEmpleados } from "@/lib/db/empleados";
import { listObras } from "@/lib/db/obras";
import { calcularHoras } from "@/lib/domain/horarios";
import { PeriodosScreen } from "./periodos-screen";

export default async function PeriodosPage() {
  await requireAdmin();

  const [periodos, empleados, obras] = await Promise.all([
    listAllPeriodos(),
    listEmpleados(),
    listObras(),
  ]);

  const empleadoNombre = new Map(
    empleados.map((e) => [
      e.id,
      { nombre: e.nombre, apellido: e.apellido },
    ])
  );
  const obraNombre = new Map(obras.map((o) => [o.id, o.nombre]));

  return (
    <PeriodosScreen
      periodos={periodos.map((p) => {
        const emp = empleadoNombre.get(p.empleadoId) ?? {
          nombre: "Desconocido",
          apellido: "",
        };
        return {
          id: p.id,
          empleadoId: p.empleadoId,
          empleadoNombre: `${emp.nombre} ${emp.apellido}`.trim(),
          obraId: p.obraId,
          obraNombre: obraNombre.get(p.obraId) ?? "Desconocida",
          ingresoAt: p.ingresoAt.toISOString(),
          egresoAt: p.egresoAt?.toISOString() ?? null,
          corregido: p.corregido,
          corregidoPor: p.corregidoPor,
          corregidoEn: p.corregidoEn?.toISOString() ?? null,
          horas: p.egresoAt ? calcularHoras(p.ingresoAt, p.egresoAt) : null,
        };
      })}
    />
  );
}
