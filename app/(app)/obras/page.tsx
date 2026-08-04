import { requireUser } from "@/lib/services/current-user";
import { findEmpleadoByUserId } from "@/lib/db/empleados";
import { listObras, listObrasDeEmpleado } from "@/lib/db/obras";
import { ObrasScreen } from "./obras-screen";

export default async function ObrasPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const obras = isAdmin
    ? await listObras(user.id, { soloActivas: false })
    : await (async () => {
        const empleado = await findEmpleadoByUserId(user.id);
        return empleado
          ? listObrasDeEmpleado(empleado.id, empleado.jefeId)
          : [];
      })();

  return (
    <ObrasScreen
      isAdmin={isAdmin}
      obras={obras.map((o) => ({
        id: o.id,
        nombre: o.nombre,
        descripcion: o.descripcion,
        estado: o.estado,
        activo: o.activo,
      }))}
    />
  );
}
