"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatFecha, formatHoras } from "@/lib/format";
import {
  Alert,
  Badge,
  btnPrimary,
  Card,
  cx,
  EmptyState,
  inputClass,
  PageHeader,
} from "@/components/ui";
import {
  AlertIcon,
  BuildingIcon,
  ClockIcon,
  InboxIcon,
  UserIcon,
} from "@/components/icons";

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
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
        <PageHeader title="Fichadas" />
        <EmptyState
          icon={<UserIcon className="h-8 w-8" />}
          title="No tenés un perfil de empleado asociado"
          description="Pedile al jefe que te vincule a un perfil para poder registrar tus fichadas."
        />
      </main>
    );
  }

  const activo = periodos.find((p) => p.egresoAt === null) ?? null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Fichadas"
        description={`${empleado.nombre} ${empleado.apellido}`}
      />

      <Card
        className={cx(
          "relative overflow-hidden p-6",
          activo && "border-amber-300 dark:border-amber-500/40"
        )}
      >
        {activo && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-400/15 blur-2xl"
          />
        )}

        {activo ? (
          <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <ClockIcon className="h-6 w-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone="warning">En curso</Badge>
                </div>
                <p className="mt-1.5 font-semibold text-foreground">
                  Estás fichado en{" "}
                  <span className="text-amber-700 dark:text-amber-300">
                    {activo.obraNombre}
                  </span>
                </p>
                <p className="text-sm text-muted">
                  Desde {formatFecha(activo.ingresoAt)}
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={() => runAction("egreso")}
              className={btnPrimary}
            >
              {submitting ? "Procesando..." : "Registrar egreso"}
            </button>
          </div>
        ) : (
          <div className="relative flex flex-col items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <BuildingIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-foreground">No estás fichado</p>
              <p className="mt-0.5 text-sm text-muted">
                Seleccioná la obra y registrá tu ingreso.
              </p>
            </div>
            <div className="flex w-full flex-wrap items-end gap-3">
              <label className="flex min-w-56 flex-1 flex-col gap-1.5 text-sm font-medium text-foreground">
                Obra
                <select
                  value={obraId}
                  onChange={(e) => setObraId(e.target.value)}
                  className={inputClass}
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
                className={btnPrimary}
              >
                {submitting ? "Procesando..." : "Registrar ingreso"}
              </button>
            </div>
          </div>
        )}

        {actionError && (
          <Alert tone="danger" >
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <div>{actionError}</div>
          </Alert>
        )}
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Historial
        </h2>
        {periodos.length === 0 ? (
          <EmptyState
            icon={<InboxIcon className="h-8 w-8" />}
            title="Todavía no hay fichadas"
            description="Cuando registres tu primer ingreso, aparecerá acá."
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-muted/5 text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Ingreso</th>
                    <th className="px-4 py-3">Egreso</th>
                    <th className="px-4 py-3">Obra</th>
                    <th className="px-4 py-3 text-right">Horas</th>
                    <th className="px-4 py-3">Corregido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {periodos.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-muted/5">
                      <td className="px-4 py-3 text-foreground">
                        {formatFecha(p.ingresoAt)}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {p.egresoAt ? formatFecha(p.egresoAt) : "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {p.obraNombre}
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
