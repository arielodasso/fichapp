"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatFecha } from "@/lib/format";
import {
  Alert,
  Badge,
  btnPrimary,
  btnSecondary,
  Card,
  cx,
  EmptyState,
  inputClass,
} from "@/components/ui";
import {
  AlertIcon,
  BuildingIcon,
  ChevronLeftIcon,
  InboxIcon,
  MessageIcon,
  SendIcon,
  TrashIcon,
} from "@/components/icons";

type ObraEstado = "ACTIVA" | "PAUSADA" | "FINALIZADA";

interface ObraView {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: ObraEstado;
  activo: boolean;
}

interface NovedadView {
  id: string;
  autorId: string;
  autorNombre: string;
  contenido: string;
  createdAt: string;
}

interface ObraScreenProps {
  userId: string;
  isAdmin: boolean;
  obra: ObraView;
  novedades: NovedadView[];
}

const ESTADOS: { value: ObraEstado; label: string }[] = [
  { value: "ACTIVA", label: "Activa" },
  { value: "PAUSADA", label: "En pausa" },
  { value: "FINALIZADA", label: "Finalizada" },
];

const estadoTone: Record<ObraEstado, "success" | "warning" | "neutral"> = {
  ACTIVA: "success",
  PAUSADA: "warning",
  FINALIZADA: "neutral",
};

function estadoLabel(estado: ObraEstado): string {
  return ESTADOS.find((e) => e.value === estado)?.label ?? estado;
}

export function ObraScreen({
  userId,
  isAdmin,
  obra,
  novedades,
}: ObraScreenProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState(obra.nombre);
  const [descripcion, setDescripcion] = useState(obra.descripcion ?? "");
  const [estado, setEstado] = useState<ObraEstado>(obra.estado);
  const [activo, setActivo] = useState(obra.activo);
  const [contenido, setContenido] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function saveObra() {
    setError(null);
    if (!nombre.trim()) {
      setError("El nombre de la obra es obligatorio");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/obras/${obra.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          estado,
          activo,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Error inesperado");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  async function publicar() {
    setError(null);
    if (!contenido.trim()) {
      setError("Escribí una novedad antes de publicar");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/obras/${obra.id}/novedades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: contenido.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Error inesperado");
        return;
      }
      setContenido("");
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  async function eliminarNovedad(n: NovedadView) {
    setError(null);
    const res = await fetch(`/api/obras/${obra.id}/novedades/${n.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "No se pudo eliminar la novedad");
    }
  }

  const fieldClass = "flex flex-col gap-1.5 text-sm font-medium text-foreground";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <Link
        href="/obras"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Volver a Obras
      </Link>

      <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <BuildingIcon className="h-6 w-6" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {obra.nombre}
              </h1>
              <Badge tone={estadoTone[obra.estado]}>
                {estadoLabel(obra.estado)}
              </Badge>
            </div>
            {obra.descripcion && (
              <p className="mt-1 text-sm text-muted">{obra.descripcion}</p>
            )}
          </div>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setEditing((v) => !v);
              setError(null);
            }}
            className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
          >
            {editing ? "Cancelar edición" : "Editar obra"}
          </button>
        )}
      </section>

      {error && (
        <Alert tone="danger">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <div>{error}</div>
        </Alert>
      )}

      {editing && isAdmin && (
        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Editar obra
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={fieldClass}>
              Nombre
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className={fieldClass}>
              Estado
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as ObraEstado)}
                className={inputClass}
              >
                {ESTADOS.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={cx(fieldClass, "sm:col-span-2")}>
              Descripción
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className={inputClass}
                rows={3}
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="h-4 w-4 rounded border-line accent-indigo-600"
              />
              Activa
            </label>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={saveObra}
              className={btnPrimary}
            >
              {submitting ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className={btnSecondary}
            >
              Cancelar
            </button>
          </div>
        </Card>
      )}

      <section>
        <div className="mb-3 flex items-center gap-2">
          <MessageIcon className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Novedades de la obra
          </h2>
        </div>

        <Card className="mb-4 p-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Dejá una novedad
            <textarea
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              className={inputClass}
              rows={3}
              placeholder="Comentarios, notas o novedades de la obra..."
              maxLength={500}
            />
          </label>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              disabled={submitting || !contenido.trim()}
              onClick={publicar}
              className={btnPrimary}
            >
              <SendIcon className="h-4 w-4" />
              {submitting ? "Publicando..." : "Publicar novedad"}
            </button>
          </div>
        </Card>

        {novedades.length === 0 ? (
          <EmptyState
            icon={<InboxIcon className="h-8 w-8" />}
            title="Todavía no hay novedades"
            description="Las notas que dejen los empleados sobre esta obra aparecerán acá."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {novedades.map((n) => (
              <Card key={n.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                      {n.autorNombre.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {n.autorNombre}
                      </p>
                      <p className="text-xs text-muted">
                        {formatFecha(n.createdAt)}
                      </p>
                    </div>
                  </div>
                  {(isAdmin || n.autorId === userId) && (
                    <button
                      type="button"
                      onClick={() => eliminarNovedad(n)}
                      aria-label="Eliminar novedad"
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">
                  {n.contenido}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
