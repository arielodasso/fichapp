"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

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
      setFormOpen(false);
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

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Obras
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Administración de las obras
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Nueva obra
        </button>
      </header>

      {formOpen && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {editing ? "Editar obra" : "Nueva obra"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nombre
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Estado
              <select value={estado} onChange={(e) => setEstado(e.target.value as ObraEstado)} className={inputClass}>
                {ESTADOS.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:col-span-2">
              Descripción
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className={inputClass}
                rows={3}
              />
            </label>
            {editing && (
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="h-4 w-4"
                />
                Activa
              </label>
            )}
          </div>
          {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={save}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {submitting ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
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
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Descripción</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Activa</th>
              <th className="px-4 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {obras.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-2 font-medium text-zinc-900 dark:text-zinc-50">
                  {o.nombre}
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  {o.descripcion ?? "—"}
                </td>
                <td className="px-4 py-2">{estadoLabel(o.estado)}</td>
                <td className="px-4 py-2">{o.activo ? "Sí" : "No"}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => openEdit(o)}
                      className="font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActivo(o)}
                      className="font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                    >
                      {o.activo ? "Desactivar" : "Activar"}
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
