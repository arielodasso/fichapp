import { requireAdmin } from "@/lib/services/current-user";
import { getReporteSemanal } from "@/lib/services/reportes";

export async function GET(request: Request) {
  const user = await requireAdmin();

  const url = new URL(request.url);
  const fechaParam = url.searchParams.get("fecha");
  const base = fechaParam ? new Date(`${fechaParam}T00:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) {
    return Response.json(
      { error: "Fecha inválida (formato AAAA-MM-DD)" },
      { status: 400 }
    );
  }

  const reporte = await getReporteSemanal(base, user.id);
  return Response.json(reporte);
}
