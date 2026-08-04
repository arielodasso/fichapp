import { requireAdmin } from "@/lib/services/current-user";
import { getReporteSemanal } from "@/lib/services/reportes";
import { ReportesScreen } from "./reportes-screen";

interface Props {
  searchParams: Promise<{ fecha?: string }>;
}

export default async function ReportesPage({ searchParams }: Props) {
  const user = await requireAdmin();

  const sp = await searchParams;
  const fechaParam = sp.fecha;
  const base = fechaParam ? new Date(`${fechaParam}T00:00:00`) : new Date();
  const reporte = await getReporteSemanal(
    Number.isNaN(base.getTime()) ? new Date() : base,
    user.id
  );

  return <ReportesScreen reporte={reporte} />;
}
