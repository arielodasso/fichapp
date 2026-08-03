"use client";

import Link from "next/link";
import type { ReporteSemanalDTO } from "@/lib/services/reportes";

function fechaLocalISO(d: Date): string {
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function formatHoras(horas: number): string {
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
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

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Reporte semanal
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {inicio.toLocaleDateString("es-AR")} al{" "}
            {ultimoDia.toLocaleDateString("es-AR")}
          </p>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href={`/reportes?fecha=${fechaLocalISO(prev)}`}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Semana anterior
          </Link>
          <Link
            href={`/reportes?fecha=${fechaLocalISO(next)}`}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Semana siguiente
          </Link>
        </nav>
      </header>

      {reporte.porObra.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No hay horas registradas esta semana.
        </p>
      ) : (
        <section className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2 font-medium">Obra</th>
                <th className="px-4 py-2 font-medium">Empleado</th>
                <th className="px-4 py-2 text-right font-medium">Horas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {reporte.porObra.map((obra) => (
                <FragmentObra key={obra.obraId} obra={obra} />
              ))}
            </tbody>
            <tfoot className="bg-zinc-100 dark:bg-zinc-900">
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-2 font-semibold text-zinc-900 dark:text-zinc-50"
                >
                  Total general
                </td>
                <td className="px-4 py-2 text-right font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatHoras(totalGeneral)}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>
      )}
    </main>
  );
}

function FragmentObra({ obra }: { obra: ReporteSemanalDTO["porObra"][number] }) {
  const totalObra = obra.empleados.reduce((s, e) => s + e.horas, 0);

  return (
    <>
      <tr className="bg-zinc-50 dark:bg-zinc-900/50">
        <td
          colSpan={3}
          className="px-4 py-2 font-semibold text-zinc-900 dark:text-zinc-50"
        >
          {obra.obraNombre}
          <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
            · {formatHoras(totalObra)}
          </span>
        </td>
      </tr>
      {obra.empleados.map((e) => (
        <tr key={e.empleadoId}>
          <td className="px-4 py-2 text-zinc-400 dark:text-zinc-500" />
          <td className="px-4 py-2">
            {e.apellido}, {e.nombre}
          </td>
          <td className="px-4 py-2 text-right">{formatHoras(e.horas)}</td>
        </tr>
      ))}
    </>
  );
}
