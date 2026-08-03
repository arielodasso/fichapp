"use client";

import Link from "next/link";
import { formatHoras } from "@/lib/format";
import type { ReporteSemanalDTO } from "@/lib/services/reportes";
import {
  Badge,
  btnSecondary,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import {
  BarChartIcon,
  BuildingIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InboxIcon,
  UsersIcon,
} from "@/components/icons";

function fechaLocalISO(d: Date): string {
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function ReportesScreen({ reporte }: { reporte: ReporteSemanalDTO }) {
  const inicio = new Date(reporte.inicioSemana);
  const fin = new Date(reporte.finSemana);
  const ultimoDia = new Date(fin.getTime() - 1);
  const prev = new Date(inicio);
  prev.setDate(prev.getDate() - 7);
  const next = new Date(inicio);
  next.setDate(next.getDate() + 7);

  const totalGeneral = reporte.porObra.reduce(
    (acc, obra) => acc + obra.empleados.reduce((s, e) => s + e.horas, 0),
    0
  );
  const empleadosConHoras = new Set(
    reporte.porObra.flatMap((o) => o.empleados.map((e) => e.empleadoId))
  ).size;

  const stats = [
    {
      label: "Horas totales",
      value: formatHoras(totalGeneral),
      icon: BarChartIcon,
      accent:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
    },
    {
      label: "Obras con actividad",
      value: String(reporte.porObra.length),
      icon: BuildingIcon,
      accent:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    },
    {
      label: "Empleados activos",
      value: String(empleadosConHoras),
      icon: UsersIcon,
      accent:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Reporte semanal"
        description={`${inicio.toLocaleDateString("es-AR")} al ${ultimoDia.toLocaleDateString("es-AR")}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/reportes?fecha=${fechaLocalISO(prev)}`}
              className={btnSecondary}
              aria-label="Semana anterior"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Link>
            <Link
              href={`/reportes?fecha=${fechaLocalISO(next)}`}
              className={btnSecondary}
              aria-label="Semana siguiente"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-4 p-5">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.accent}`}
            >
              <s.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                {s.value}
              </p>
              <p className="text-xs font-medium text-muted">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {reporte.porObra.length === 0 ? (
        <EmptyState
          icon={<InboxIcon className="h-8 w-8" />}
          title="No hay horas registradas esta semana"
          description="Cuando los empleados fichen, el resumen va a aparecer acá."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-muted/5 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Obra</th>
                  <th className="px-4 py-3">Empleado</th>
                  <th className="px-4 py-3 text-right">Horas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {reporte.porObra.map((obra) => (
                  <FragmentObra key={obra.obraId} obra={obra} />
                ))}
              </tbody>
              <tfoot className="border-t border-line bg-muted/5">
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-3 font-semibold text-foreground"
                  >
                    Total general
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">
                    {formatHoras(totalGeneral)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </main>
  );
}

function FragmentObra({
  obra,
}: {
  obra: ReporteSemanalDTO["porObra"][number];
}) {
  const totalObra = obra.empleados.reduce((s, e) => s + e.horas, 0);

  return (
    <>
      <tr className="bg-muted/5">
        <td colSpan={3} className="px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 font-semibold text-foreground">
              <BuildingIcon className="h-4 w-4 text-muted" />
              {obra.obraNombre}
            </span>
            <Badge tone="primary">{formatHoras(totalObra)}</Badge>
          </div>
        </td>
      </tr>
      {obra.empleados.map((e) => (
        <tr key={e.empleadoId} className="transition-colors hover:bg-muted/5">
          <td className="px-4 py-3 text-muted" />
          <td className="px-4 py-3 text-foreground">
            {e.apellido}, {e.nombre}
          </td>
          <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
            {formatHoras(e.horas)}
          </td>
        </tr>
      ))}
    </>
  );
}
