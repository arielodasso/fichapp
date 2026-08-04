import { requireSuperAdmin } from "@/lib/services/current-user";
import { listOrganizaciones } from "@/lib/db/superadmin";

export async function GET() {
  await requireSuperAdmin();
  const organizaciones = await listOrganizaciones();
  return Response.json({ organizaciones });
}
