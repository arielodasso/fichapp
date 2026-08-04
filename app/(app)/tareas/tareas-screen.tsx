"use client";

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
  PageHeader,
} from "@/components/ui";
import {
  AlertIcon,
  ClipboardCheckIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";

type TareaEstado = "PENDIENTE" | "EN_PROGRESO" | "COMPLETADA";

interface TareaView {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: TareaEstado;
  obraId: string | null;
  obraNombre: string | null;
  empleadoId: string;
  empleadoNombre: string;
  creadaEn: string;
  completadaEn: string | null;
}

interface TareasScreenProps {
  esAdmin: boolean;
  tareas: TareaView[];
  obras?: { id: string; nombre: string }[];
  empleados?: { id: string; nombre: string }[];
}

const ESTADOS: { value: TareaEstado; label: string }[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_PROGRESO", label: "En progreso" },
  { value: "COMPLETADA", label: "Completada" },
];

const estadoTone: Record<TareaEstado, "neutral" | "warning" | "success"> = {
  PENDIENTE: "neutral",
  EN_PROGRESO: "warning",
  COMPLETADA: "success",
};

function estadoLabel(estado: TareaEstado): string {
  return ESTADOS.find((e) => e.value === estado)?.label ?? estado;
}

export function TareasScreen({
  esAdmin,
  tareas,
  obras = [],
  empleados = [],
}: TareasScreenProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [filtroObra, setFiltroObra] = useState("");
  const [filtroEmpleado, setFiltroEmpleado] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TareaView | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [obraId, setObraId] = useState("");
  const [empleadoId, setEmpleadoId] = useState("");
  const [estado, setEstado] = useState<TareaEstado>("PENDIENTE");
  const [submitting, setSubmitting] = useState(false);

  function openNew() {
    setEditing(null);
    setTitulo("");
    setDescripcion("");
    setObraId("");
    setEmpleadoId(empleados[0]?.id ?? "");
    setEstado("PENDIENTE");
    setError(null);
    setFormOpen(true);
  }

  function openEdit(t: TareaView) {
    setEditing(t);
    setTitulo(t.titulo);
    setDescripcion(t.descripcion ?? "");
    setObraId(t.obraId ?? "");
    setEmpleadoId(t.empleadoId);
    setEstado(t.estado);
    setError(null);
    setFormOpen(true);
  }

  function close() {
    setFormOpen(false);
    setEditing(null);
    setError(null);
  }

  async function save() {
    setError(null);
    if (!titulo.trim()) {
      setError("El título de la tarea es obligatorio");
      return;
    }
    if (!empleadoId) {
      setError("Asigná una tarea a un empleado");
      return;
    }
    setSubmitting(true);
    try {
      const body = JSON.stringify({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        obraId: obraId || null,
        empleadoId,
        ...(editing ? { estado } : {}),
      });
      const res = await fetch(
        editing ? `/api/tareas/${editing.id}` : "/api/tareas",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }
      );
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

  async function cambiarEstado(t: TareaView, nuevo: TareaEstado) {
    setError(null);
    const res = await fetch(`/api/tareas/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevo }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "No se pudo actualizar la tarea");
      return;
    }
    router.refresh();
  }

  async function eliminar(t: TareaView) {
    if (!window.confirm(`¿Eliminar la tarea "${t.titulo}"?`)) return;
    setError(null);
    const res = await fetch(`/api/tareas/${t.id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "No se pudo eliminar la tarea");
      return;
    }
    router.refresh();
  }

  const filtradas = tareas.filter(
    (t) =>
      (!filtroObra || t.obraId === filtroObra) &&
      (!filtroEmpleado || t.empleadoId === filtroEmpleado) &&
      (!filtroEstado || t.estado === filtroEstado)
  );

  const fieldClass =
    "flex flex-col gap-1.5 text-sm font-medium text-foreground";

  if (!esAdmin) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
        <PageHeader
          title="Mis tareas"
          description="Tareas asignadas por tu jefe"
        />

        {error && (
          <Alert tone="danger">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <div>{error}</div>
          </Alert>
        )}

        {tareas.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheckIcon className="h-8 w-8" />}
            title="No tenés tareas asignadas"
            description="Cuando tu jefe te asigne una tarea la vas a ver acá."
          />
        ) : (
          <div className="grid gap-4">
            {tareas.map((t) => (
              <Card key={t.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-foreground">{t.titulo}</h2>
                    {t.descripcion && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                        {t.descripcion}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted">
                      {t.obraNombre ? `Obra: ${t.obraNombre}` : "Sin obra"}
                    </p>
                  </div>
                  <Badge tone={estadoTone[t.estado]}>
                    {estadoLabel(t.estado)}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted">
                    Creada el {formatFecha(t.creadaEn)}
                  </p>
                  <div className="flex gap-2">
                    {t.estado === "PENDIENTE" && (
                      <button
                        type="button"
                        onClick={() => cambiarEstado(t, "EN_PROGRESO")}
                        className={btnSecondary}
                      >
                        Empezar
                      </button>
                    )}
                    {t.estado !== "COMPLETADA" && (
                      <button
                        type="button"
                        onClick={() => cambiarEstado(t, "COMPLETADA")}
                        className={btnPrimary}
                      >
                        Completar
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Tareas"
        description="Creá, asigná y seguí las tareas de tus obras"
        actions={
          <button type="button" onClick={openNew} className={btnPrimary}>
            <PlusIcon className="h-4 w-4" />
            Nueva tarea
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <label className={fieldClass}>
          Obra
          <select
            value={filtroObra}
            onChange={(e) => setFiltroObra(e.target.value)}
            className={inputClass}
          >
            <option value="">Todas</option>
            {obras.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className={fieldClass}>
          Empleado
          <select
            value={filtroEmpleado}
            onChange={(e) => setFiltroEmpleado(e.target.value)}
            className={inputClass}
          >
            <option value="">Todos</option>
            {empleados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className={fieldClass}>
          Estado
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className={inputClass}
          >
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {formOpen && (
        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            {editing ? "Editar tarea" : "Nueva tarea"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={fieldClass}>
              Título
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className={fieldClass}>
              Obra
              <select
                value={obraId}
                onChange={(e) => setObraId(e.target.value)}
                className={inputClass}
              >
                <option value="">Sin obra</option>
                {obras.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className={fieldClass}>
              Asignado a
              <select
                value={empleadoId}
                onChange={(e) => setEmpleadoId(e.target.value)}
                className={inputClass}
              >
                {empleados.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </label>
            {editing && (
              <label className={fieldClass}>
                Estado
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as TareaEstado)}
                  className={inputClass}
                >
                  {ESTADOS.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className={cx(fieldClass, "sm:col-span-2")}>
              Descripción
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className={inputClass}
              />
            </label>
          </div>

          {error && (
            <div className="mt-4">
              <Alert tone="danger">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <div>{error}</div>
              </Alert>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={save}
              className={btnPrimary}
            >
              {submitting ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" onClick={close} className={btnSecondary}>
              Cancelar
            </button>
          </div>
        </Card>
      )}

      {filtradas.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheckIcon className="h-8 w-8" />}
          title="No hay tareas"
          description={
            tareas.length === 0
              ? "Creá la primera tarea para asignarla a un empleado."
              : "No hay tareas que coincidan con los filtros."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-muted/5 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Tarea</th>
                  <th className="px-4 py-3">Obra</th>
                  <th className="px-4 py-3">Empleado</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Creada</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtradas.map((t) => (
                  <tr
                    key={t.id}
                    className="transition-colors hover:bg-muted/5"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{t.titulo}</p>
                      {t.descripcion && (
                        <p className="max-w-xs truncate text-xs text-muted">
                          {t.descripcion}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {t.obraNombre ? (
                        <Badge tone="neutral">{t.obraNombre}</Badge>
                      ) : (
                        <span className="text-xs text-muted">Sin obra</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {t.empleadoNombre}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={t.estado}
                        onChange={(e) =>
                          cambiarEstado(t, e.target.value as TareaEstado)
                        }
                        className={cx(inputClass, "w-auto px-2 py-1 text-xs")}
                      >
                        {ESTADOS.map((e) => (
                          <option key={e.value} value={e.value}>
                            {e.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {formatFecha(t.creadaEn)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminar(t)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Eliminar
                        </button>
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
