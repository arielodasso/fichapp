"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatFecha, formatHoras } from "@/lib/format";

interface PeriodoAdmin {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  obraId: string;
  obraNombre: string;
  ingresoAt: string;
  egresoAt: string | null;
  corregido: boolean;
  horas: number | null;
}

interface PeriodosScreenProps {
  periodos: PeriodoAdmin[];
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}

export function PeriodosScreen({ periodos }: PeriodosScreenProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<PeriodoAdmin | null>(null);
  const [ingresoAt, setIngresoAt] = useState("");
  const [egresoAt, setEgresoAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function openEdit(p: PeriodoAdmin) {
    setEditing(p);
    setIngresoAt(toLocalInputValue(p.ingresoAt));
    setEgresoAt(p.egresoAt ? toLocalInputValue(p.egresoAt) : "");
    setError(null);
  }

  function close() {
    setEditing(null);
    setError(null);
  }

  async function save() {
    setError(null);
    if (!ingresoAt) {
      setError("La fecha de ingreso es obligatoria");
      return;
    }
    setSubmitting(true);
    try {
      const body = JSON.stringify({
        ingresoAt: new Date(ingresoAt).toISOString(),
        egresoAt: egresoAt ? new Date(egresoAt).toISOString() : null,
      });
      const res = await fetch(`/api/periodos/${editing!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Error inesperado");
        return;
      }
      close();
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  async function eliminar(p: PeriodoAdmin) {
    if (!window.confirm(`¿Eliminar el período de ${p.empleadoNombre}?`)) {
      return;
    }
    const res = await fetch(`/api/periodos/${p.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "No se pudo eliminar el período");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Corrección de períodos
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Corregí o eliminá períodos de trabajo erróneos. Queda registro de la
          corrección.
        </p>
      </header>

      {editing && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Corregir período · {editing.empleadoNombre} · {editing.obraNombre}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Ingreso
              <input
                type="datetime-local"
                value={ingresoAt}
                onChange={(e) => setIngresoAt(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Egreso
              <input
                type="datetime-local"
                value={egresoAt}
                onChange={(e) => setEgresoAt(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Dejá el egreso vacío para dejar el período abierto.
          </p>
          {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={save}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {submitting ? "Guardando..." : "Guardar corrección"}
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Cancelar
            </button>
          </div>
        </section>
      )}

      <section className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2 font-medium">Empleado</th>
              <th className="px-4 py-2 font-medium">Obra</th>
              <th className="px-4 py-2 font-medium">Ingreso</th>
              <th className="px-4 py-2 font-medium">Egreso</th>
              <th className="px-4 py-2 font-medium">Horas</th>
              <th className="px-4 py-2 font-medium">Corregido</th>
              <th className="px-4 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {periodos.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2">{p.empleadoNombre}</td>
                <td className="px-4 py-2">{p.obraNombre}</td>
                <td className="px-4 py-2">{formatFecha(p.ingresoAt)}</td>
                <td className="px-4 py-2">
                  {p.egresoAt ? formatFecha(p.egresoAt) : "—"}
                </td>
                <td className="px-4 py-2">
                  {p.horas !== null ? formatHoras(p.horas) : "—"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.corregido
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {p.corregido ? "Sí" : "No"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminar(p)}
                      className="font-medium text-red-600 hover:text-red-500 dark:text-red-400"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
