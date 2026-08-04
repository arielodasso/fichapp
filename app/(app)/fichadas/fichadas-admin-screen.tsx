"use client";

import Link from "next/link";
import { formatFecha, formatHoras } from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import {
  BarChartIcon,
  BuildingIcon,
  ClockIcon,
  HistoryIcon,
  InboxIcon,
  UsersIcon,
} from "@/components/icons";

interface PeriodoAdminItem {
  id: string;
  empleadoNombre: string;
  obraNombre: string;
  ingresoAt: string;
  egresoAt: string | null;
  corregido: boolean;
  horas: number | null;
}

interface FichadasAdminScreenProps {
  enObraAhora: number;
  fichadasHoy: number;
  horasHoy: number;
  empleadosActivos: number;
  periodos: PeriodoAdminItem[];
}

export function FichadasAdminScreen({
  enObraAhora,
  fichadasHoy,
  horasHoy,
  empleadosActivos,
  periodos,
}: FichadasAdminScreenProps) {
  const stats = [
    {
      label: "En obra ahora",
      value: String(enObraAhora),
      icon: ClockIcon,
      accent:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    },
    {
      label: "Fichadas hoy",
      value: String(fichadasHoy),
      icon: HistoryIcon,
      accent:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    {
      label: "Horas hoy",
      value: formatHoras(horasHoy),
      icon: BarChartIcon,
      accent:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    {
      label: "Empleados activos",
      value: String(empleadosActivos),
      icon: UsersIcon,
      accent:
        "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Fichadas"
        description="Supervisión de fichadas del personal"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Fichadas del día
          </h2>
          <Link
            href="/periodos"
            className="text-sm font-semibold text-primary transition-colors hover:text-primary-strong"
          >
            Corregir períodos
          </Link>
        </div>

        {periodos.length === 0 ? (
          <EmptyState
            icon={<InboxIcon className="h-8 w-8" />}
            title="Todavía no hay fichadas hoy"
            description="Cuando los empleados registren su ingreso, van a aparecer acá."
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-muted/5 text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Empleado</th>
                    <th className="px-4 py-3">Obra</th>
                    <th className="px-4 py-3">Ingreso</th>
                    <th className="px-4 py-3">Egreso</th>
                    <th className="px-4 py-3 text-right">Horas</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {periodos.map((p) => (
                    <tr
                      key={p.id}
                      className="transition-colors hover:bg-muted/5"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {p.empleadoNombre}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <BuildingIcon className="h-4 w-4 text-muted" />
                          {p.obraNombre}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {formatFecha(p.ingresoAt)}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {p.egresoAt ? formatFecha(p.egresoAt) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                        {p.horas !== null ? formatHoras(p.horas) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {p.egresoAt === null ? (
                          <Badge tone="warning">En curso</Badge>
                        ) : p.corregido ? (
                          <Badge tone="warning">Corregido</Badge>
                        ) : (
                          <Badge tone="success">Completa</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </main>
  );
}
