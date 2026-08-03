import { requireAdmin } from "@/lib/services/current-user";
import { listObras } from "@/lib/db/obras";
import { ObrasScreen } from "./obras-screen";

export default async function ObrasPage() {
  await requireAdmin();

  const obras = await listObras();

  return (
    <ObrasScreen
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
