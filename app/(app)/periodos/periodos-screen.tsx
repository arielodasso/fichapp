"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatFecha, formatHoras } from "@/lib/format";
import {
  Alert,
  Badge,
  btnDanger,
  btnPrimary,
  btnSecondary,
  Card,
  cx,
  EmptyState,
  inputClass,
  PageHeader,
} from "@/components/ui";
import {
  AlertIcon,
  HistoryIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/icons";

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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
    setError(null);
    const res = await fetch(`/api/periodos/${p.id}`, { method: "DELETE" });
    if (res.ok) {
      setConfirmDeleteId(null);
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "No se pudo eliminar el período");
    }
  }

  const fieldClass = "flex flex-col gap-1.5 text-sm font-medium text-foreground";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Corrección de períodos"
        description="Corregí o eliminá períodos de trabajo erróneos. Queda registro de la corrección."
      />

      {error && (
        <Alert tone="danger">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <div>{error}</div>
        </Alert>
      )}

      {editing && (
        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Corregir período · {editing.empleadoNombre} ·{" "}
            {editing.obraNombre}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={fieldClass}>
              Ingreso
              <input
                type="datetime-local"
                value={ingresoAt}
                onChange={(e) => setIngresoAt(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className={fieldClass}>
              Egreso
              <input
                type="datetime-local"
                value={egresoAt}
                onChange={(e) => setEgresoAt(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-muted">
            Dejá el egreso vacío para dejar el período abierto.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={save}
              className={btnPrimary}
            >
              {submitting ? "Guardando..." : "Guardar corrección"}
            </button>
            <button type="button" onClick={close} className={btnSecondary}>
              Cancelar
            </button>
          </div>
        </Card>
      )}

      {periodos.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon className="h-8 w-8" />}
          title="No hay períodos registrados"
          description="Cuando los empleados fichen, vas a poder corregirlos desde acá."
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
                  <th className="px-4 py-3">Corregido</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {periodos.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-muted/5">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {p.empleadoNombre}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {p.obraNombre}
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
                      {p.corregido ? (
                        <Badge tone="warning">Corregido</Badge>
                      ) : (
                        <Badge tone="neutral">No</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Editar
                        </button>
                        {confirmDeleteId === p.id ? (
                          <button
                            type="button"
                            onClick={() => eliminar(p)}
                            className={cx(
                              btnDanger,
                              "px-2.5 py-1.5 text-xs"
                            )}
                          >
                            Confirmar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteId(p.id);
                              setError(null);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                          >
                            <TrashIcon className="h-4 w-4" />
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </main>
  );
}
