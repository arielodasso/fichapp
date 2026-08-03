"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  BuildingIcon,
  PencilIcon,
  PlusIcon,
} from "@/components/icons";

type ObraEstado = "ACTIVA" | "PAUSADA" | "FINALIZADA";

interface ObraView {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: ObraEstado;
  activo: boolean;
}

interface ObrasScreenProps {
  obras: ObraView[];
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

export function ObrasScreen({ obras }: ObrasScreenProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ObraView | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState<ObraEstado>("ACTIVA");
  const [activo, setActivo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function openNew() {
    setEditing(null);
    setNombre("");
    setDescripcion("");
    setEstado("ACTIVA");
    setActivo(true);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(o: ObraView) {
    setEditing(o);
    setNombre(o.nombre);
    setDescripcion(o.descripcion ?? "");
    setEstado(o.estado);
    setActivo(o.activo);
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
    if (!nombre.trim()) {
      setError("El nombre de la obra es obligatorio");
      return;
    }
    setSubmitting(true);
    try {
      const body = JSON.stringify({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        estado,
        ...(editing ? { activo } : {}),
      });
      const res = await fetch(editing ? `/api/obras/${editing.id}` : "/api/obras", {
        method: editing ? "PATCH" : "POST",
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

  async function toggleActivo(o: ObraView) {
    const res = await fetch(`/api/obras/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !o.activo }),
    });
    if (res.ok) router.refresh();
  }

  const fieldClass = "flex flex-col gap-1.5 text-sm font-medium text-foreground";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Obras"
        description="Administración de las obras"
        actions={
          <button type="button" onClick={openNew} className={btnPrimary}>
            <PlusIcon className="h-4 w-4" />
            Nueva obra
          </button>
        }
      />

      {formOpen && (
        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            {editing ? "Editar obra" : "Nueva obra"}
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
            {editing && (
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="h-4 w-4 rounded border-line accent-indigo-600"
                />
                Activa
              </label>
            )}
          </div>

          {error && (
            <Alert tone="danger" >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <div>{error}</div>
            </Alert>
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

      {obras.length === 0 ? (
        <EmptyState
          icon={<BuildingIcon className="h-8 w-8" />}
          title="No hay obras cargadas"
          description="Creá la primera obra para poder fichar en ella."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-muted/5 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Activa</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {obras.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-muted/5">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {o.nombre}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {o.descripcion ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={estadoTone[o.estado]}>
                        {estadoLabel(o.estado)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {o.activo ? (
                        <Badge tone="success">Sí</Badge>
                      ) : (
                        <Badge tone="neutral">No</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(o)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActivo(o)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
                        >
                          {o.activo ? "Desactivar" : "Activar"}
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
