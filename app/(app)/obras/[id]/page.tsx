import { notFound } from "next/navigation";
import { requireUser } from "@/lib/services/current-user";
import { isValidUUID } from "@/lib/utils";
import { findObraById } from "@/lib/db/obras";
import { listNovedadesDeObra } from "@/lib/db/novedades";
import { ObraScreen } from "./obra-screen";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ObraPage({ params }: Props) {
  const { id } = await params;
  if (!isValidUUID(id)) {
    notFound();
  }

  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const obra = await findObraById(id);
  if (!obra || (!isAdmin && !obra.activo)) {
    notFound();
  }

  const novedades = await listNovedadesDeObra(id);

  return (
    <ObraScreen
      userId={user.id}
      isAdmin={isAdmin}
      obra={{
        id: obra.id,
        nombre: obra.nombre,
        descripcion: obra.descripcion,
        estado: obra.estado,
        activo: obra.activo,
      }}
      novedades={novedades.map((n) => ({
        id: n.id,
        autorId: n.autorId,
        autorNombre: n.autorNombre,
        contenido: n.contenido,
        createdAt: n.createdAt.toISOString(),
      }))}
    />
  );
}
