import { requireAdmin } from "@/lib/services/current-user";
import { listEmpleados } from "@/lib/db/empleados";
import { listUsers } from "@/lib/db/users";
import { EmpleadosScreen } from "./empleados-screen";

export default async function EmpleadosPage() {
  await requireAdmin();

  const [empleados, usuarios] = await Promise.all([
    listEmpleados(),
    listUsers(),
  ]);

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
      }))}
      usuarios={usuarios.map((u) => ({ id: u.id, email: u.email, name: u.name }))}
    />
  );
}
