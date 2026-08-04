import { requireSuperAdmin } from "@/lib/services/current-user";
import { isValidUUID } from "@/lib/utils";
import { deleteOrganizacion } from "@/lib/db/superadmin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireSuperAdmin();
  const { id } = await params;
  if (!isValidUUID(id)) {
    return Response.json(
      { error: "Id de organización inválido" },
      { status: 400 }
    );
  }

  if (id === user.id) {
    return Response.json(
      { error: "No podés eliminar tu propia cuenta" },
      { status: 400 }
    );
  }

  const ok = await deleteOrganizacion(id);
  if (!ok) {
    return Response.json(
      { error: "Organización no encontrada" },
      { status: 404 }
    );
  }
  return Response.json({ ok: true });
}
