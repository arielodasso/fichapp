import { requireUser } from "@/lib/services/current-user";
import { findEmpleadoByUserId } from "@/lib/db/empleados";
import { listObras, listObrasDeEmpleado } from "@/lib/db/obras";
import { listPeriodosDeEmpleado } from "@/lib/db/fichadas";
import { calcularHoras } from "@/lib/domain/horarios";
import { FichadasScreen } from "./fichadas-screen";

export default async function FichadasPage() {
  const user = await requireUser();

  const empleado = await findEmpleadoByUserId(user.id);
  const [obras, obrasRef] = await Promise.all([
    empleado ? listObrasDeEmpleado(empleado.id) : Promise.resolve([]),
    listObras(),
  ]);
  const periodos = empleado ? await listPeriodosDeEmpleado(empleado.id) : [];
  const obraNombre = new Map(obrasRef.map((o) => [o.id, o.nombre]));

  return (
    <FichadasScreen
      empleado={
        empleado
          ? {
              id: empleado.id,
              nombre: empleado.nombre,
              apellido: empleado.apellido,
            }
          : null
      }
      obras={obras.map((o) => ({ id: o.id, nombre: o.nombre }))}
      periodos={periodos.map((p) => ({
        id: p.id,
        obraId: p.obraId,
        obraNombre: obraNombre.get(p.obraId) ?? "Desconocida",
        ingresoAt: p.ingresoAt.toISOString(),
        egresoAt: p.egresoAt ? p.egresoAt.toISOString() : null,
        corregido: p.corregido,
        horas: p.egresoAt ? calcularHoras(p.ingresoAt, p.egresoAt) : null,
      }))}
    />
  );
}
