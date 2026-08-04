import { requireUser } from "@/lib/services/current-user";
import {
  findEmpleadoByUserId,
  listEmpleados,
} from "@/lib/db/empleados";
import { listObras, listObrasDeEmpleado } from "@/lib/db/obras";
import { listAllPeriodos, listPeriodosDeEmpleado } from "@/lib/db/fichadas";
import { calcularHoras } from "@/lib/domain/horarios";
import { FichadasScreen } from "./fichadas-screen";
import { FichadasAdminScreen } from "./fichadas-admin-screen";

export default async function FichadasPage() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    const [periodos, empleados, obras] = await Promise.all([
      listAllPeriodos(user.id),
      listEmpleados(user.id),
      listObras(user.id),
    ]);

    const empleadoNombre = new Map(
      empleados.map((e) => [
        e.id,
        { nombre: e.nombre, apellido: e.apellido },
      ])
    );
    const obraNombre = new Map(obras.map((o) => [o.id, o.nombre]));

    const ahora = new Date();
    const inicioHoy = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate()
    );
    const finHoy = new Date(inicioHoy);
    finHoy.setDate(finHoy.getDate() + 1);

    const hoyItems = periodos.filter(
      (p) => p.ingresoAt >= inicioHoy && p.ingresoAt < finHoy
    );

    let horasHoy = 0;
    for (const p of hoyItems) {
      if (!p.egresoAt) continue;
      try {
        horasHoy += calcularHoras(p.ingresoAt, p.egresoAt);
      } catch {
        // período inválido: no cuenta para el total del día
      }
    }

    return (
      <FichadasAdminScreen
        enObraAhora={periodos.filter((p) => p.egresoAt === null).length}
        fichadasHoy={hoyItems.length}
        horasHoy={Math.round(horasHoy * 100) / 100}
        empleadosActivos={empleados.filter((e) => e.activo).length}
        periodos={hoyItems.map((p) => {
          const emp = empleadoNombre.get(p.empleadoId) ?? {
            nombre: "Desconocido",
            apellido: "",
          };
          return {
            id: p.id,
            empleadoNombre: `${emp.nombre} ${emp.apellido}`.trim(),
            obraNombre: obraNombre.get(p.obraId) ?? "Desconocida",
            ingresoAt: p.ingresoAt.toISOString(),
            egresoAt: p.egresoAt ? p.egresoAt.toISOString() : null,
            corregido: p.corregido,
            horas: p.egresoAt ? calcularHoras(p.ingresoAt, p.egresoAt) : null,
          };
        })}
      />
    );
  }

  const empleado = await findEmpleadoByUserId(user.id);
  const [obras, obrasRef] = await Promise.all([
    empleado ? listObrasDeEmpleado(empleado.id) : Promise.resolve([]),
    empleado ? listObras(empleado.jefeId) : Promise.resolve([]),
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
