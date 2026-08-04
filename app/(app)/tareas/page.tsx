import { redirect } from "next/navigation";
import { requireUser } from "@/lib/services/current-user";
import { findEmpleadoByUserId, listEmpleados } from "@/lib/db/empleados";
import { listObras } from "@/lib/db/obras";
import { listTareas, listTareasDeEmpleado } from "@/lib/db/tareas";
import { TareasScreen } from "./tareas-screen";

export default async function TareasPage() {
  const user = await requireUser();
  if (user.role === "SUPERADMIN") {
    redirect("/dashboard");
  }

  if (user.role === "ADMIN") {
    const [tareas, obras, empleados] = await Promise.all([
      listTareas(user.id),
      listObras(user.id),
      listEmpleados(user.id),
    ]);

    return (
      <TareasScreen
        esAdmin
        tareas={tareas.map((t) => ({
          id: t.id,
          titulo: t.titulo,
          descripcion: t.descripcion,
          estado: t.estado,
          obraId: t.obraId,
          obraNombre: t.obraNombre ?? null,
          empleadoId: t.empleadoId,
          empleadoNombre: `${t.empleadoNombre ?? ""} ${t.empleadoApellido ?? ""}`.trim(),
          creadaEn: t.createdAt.toISOString(),
          completadaEn: t.completadaEn ? t.completadaEn.toISOString() : null,
        }))}
        obras={obras.map((o) => ({ id: o.id, nombre: o.nombre }))}
        empleados={empleados.map((e) => ({
          id: e.id,
          nombre: `${e.nombre} ${e.apellido}`.trim(),
        }))}
      />
    );
  }

  const empleado = await findEmpleadoByUserId(user.id);
  const tareas = empleado
    ? await listTareasDeEmpleado(empleado.id, empleado.jefeId)
    : [];

  return (
    <TareasScreen
      esAdmin={false}
      tareas={tareas.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        descripcion: t.descripcion,
        estado: t.estado,
        obraId: t.obraId,
        obraNombre: t.obraNombre ?? null,
        empleadoId: t.empleadoId,
        empleadoNombre: `${t.empleadoNombre ?? ""} ${t.empleadoApellido ?? ""}`.trim(),
        creadaEn: t.createdAt.toISOString(),
        completadaEn: t.completadaEn ? t.completadaEn.toISOString() : null,
      }))}
    />
  );
}
