"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatFecha, formatHoras } from "@/lib/format";

interface PeriodoItem {
  id: string;
  obraId: string;
  obraNombre: string;
  ingresoAt: string;
  egresoAt: string | null;
  corregido: boolean;
  horas: number | null;
}

interface FichadasScreenProps {
  empleado: { id: string; nombre: string; apellido: string } | null;
  obras: { id: string; nombre: string }[];
  periodos: PeriodoItem[];
}

export function FichadasScreen({
  empleado,
  obras,
  periodos,
}: FichadasScreenProps) {
  const router = useRouter();
  const [obraId, setObraId] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function runAction(tipo: "ingreso" | "egreso") {
    setActionError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/fichadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          tipo === "ingreso" ? { tipo, obraId } : { tipo }
        ),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(json.error ?? "Error inesperado");
        return;
      }
      setObraId("");
      router.refresh();
    } catch {
      setActionError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  if (!empleado) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Fichadas
        </h1>
        <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          No tenés un perfil de empleado asociado. Pedile al jefe que te vincule
          a un perfil para poder registrar tus fichadas.
        </p>
      </main>
    );
  }

  const activo = periodos.find((p) => p.egresoAt === null) ?? null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Fichadas
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {empleado.nombre} {empleado.apellido}
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {activo ? (
          <div className="flex flex-col items-start gap-3">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Estás fichado en{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {activo.obraNombre}
                </span>
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Desde {formatFecha(activo.ingresoAt)}
              </p>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={() => runAction("egreso")}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
            >
              {submitting ? "Procesando..." : "Registrar egreso"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No estás fichado. Seleccioná la obra y registrá tu ingreso.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Obra
                <select
                  value={obraId}
                  onChange={(e) => setObraId(e.target.value)}
                  className="w-64 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  <option value="">Seleccionar obra...</option>
                  {obras.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={submitting || !obraId}
                onClick={() => runAction("ingreso")}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {submitting ? "Procesando..." : "Registrar ingreso"}
              </button>
            </div>
          </div>
        )}

        {actionError && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">
            {actionError}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Historial
        </h2>
        {periodos.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Todavía no hay fichadas.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Ingreso</th>
                  <th className="px-4 py-2 font-medium">Egreso</th>
                  <th className="px-4 py-2 font-medium">Obra</th>
                  <th className="px-4 py-2 font-medium">Horas</th>
                  <th className="px-4 py-2 font-medium">Corregido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {periodos.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">{formatFecha(p.ingresoAt)}</td>
                    <td className="px-4 py-2">
                      {p.egresoAt ? formatFecha(p.egresoAt) : "—"}
                    </td>
                    <td className="px-4 py-2">{p.obraNombre}</td>
                    <td className="px-4 py-2">
                      {p.horas !== null ? formatHoras(p.horas) : "—"}
                    </td>
                    <td className="px-4 py-2">{p.corregido ? "Sí" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
