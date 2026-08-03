import { requireUser } from "@/lib/services/current-user";
import { isValidUUID } from "@/lib/utils";
import {
  deleteNovedad,
  findNovedadById,
} from "@/lib/db/novedades";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; novedadId: string }> }
) {
  const user = await requireUser();
  const { id, novedadId } = await params;
  if (!isValidUUID(id) || !isValidUUID(novedadId)) {
    return Response.json({ error: "Id inválido" }, { status: 400 });
  }

  const novedad = await findNovedadById(novedadId);
  if (!novedad) {
    return Response.json({ error: "Novedad no encontrada" }, { status: 404 });
  }
  if (novedad.obraId !== id) {
    return Response.json({ error: "Novedad no encontrada" }, { status: 404 });
  }
  if (novedad.autorId !== user.id && user.role !== "ADMIN") {
    return Response.json(
      { error: "No tenés permiso para eliminar esta novedad" },
      { status: 403 }
    );
  }

  const eliminada = await deleteNovedad(novedadId);
  if (!eliminada) {
    return Response.json({ error: "Novedad no encontrada" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
