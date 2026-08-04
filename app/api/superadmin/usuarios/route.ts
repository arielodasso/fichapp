import { requireSuperAdmin } from "@/lib/services/current-user";
import { listUsuariosGlobales } from "@/lib/db/superadmin";

export async function GET() {
  await requireSuperAdmin();
  const usuarios = await listUsuariosGlobales();
  return Response.json({ usuarios });
}
