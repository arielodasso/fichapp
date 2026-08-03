import { requireUser } from "@/lib/services/current-user";
import { listObras } from "@/lib/db/obras";
import { ObrasScreen } from "./obras-screen";

export default async function ObrasPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const obras = await listObras({ soloActivas: !isAdmin });

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
