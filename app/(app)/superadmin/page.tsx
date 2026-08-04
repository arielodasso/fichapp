import { requireSuperAdmin } from "@/lib/services/current-user";
import {
  listOrganizaciones,
  listUsuariosGlobales,
} from "@/lib/db/superadmin";
import { SuperadminScreen } from "./superadmin-screen";

export default async function SuperadminPage() {
  const user = await requireSuperAdmin();

  const [usuarios, organizaciones] = await Promise.all([
    listUsuariosGlobales(),
    listOrganizaciones(),
  ]);

  return (
    <SuperadminScreen
      usuarioActualId={user.id}
      usuarios={usuarios.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
      }))}
      organizaciones={organizaciones.map((o) => ({
        id: o.id,
        nombre: o.nombre,
        email: o.email,
        empleados: o.empleados,
        obras: o.obras,
        fichadas: o.fichadas,
        tareas: o.tareas,
        createdAt: o.createdAt.toISOString(),
      }))}
    />
  );
}
