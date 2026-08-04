import { requireAdmin } from "@/lib/services/current-user";
import { isValidUUID } from "@/lib/utils";
import { deleteInvitacion } from "@/lib/db/invitaciones";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  const { id } = await params;
  if (!isValidUUID(id)) {
    return Response.json({ error: "Id de invitación inválido" }, { status: 400 });
  }

  const eliminada = await deleteInvitacion(id, user.id);
  if (!eliminada) {
    return Response.json({ error: "Invitación no encontrada" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
