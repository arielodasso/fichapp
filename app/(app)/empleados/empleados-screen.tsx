"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EmpleadoView {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  rol: string;
  activo: boolean;
  userId: string | null;
}

interface EmpleadosScreenProps {
  empleados: EmpleadoView[];
  usuarios: { id: string; email: string; name: string }[];
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

export function EmpleadosScreen({
  empleados,
  usuarios,
}: EmpleadosScreenProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmpleadoView | null>(null);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [documento, setDocumento] = useState("");
  const [rol, setRol] = useState("OBRERO");
  const [userId, setUserId] = useState("");
  const [activo, setActivo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function openNew() {
    setEditing(null);
    setNombre("");
    setApellido("");
    setDocumento("");
    setRol("OBRERO");
    setUserId("");
    setActivo(true);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(e: EmpleadoView) {
    setEditing(e);
    setNombre(e.nombre);
    setApellido(e.apellido);
    setDocumento(e.documento);
    setRol(e.rol);
    setUserId(e.userId ?? "");
    setActivo(e.activo);
    setError(null);
    setFormOpen(true);
  }

  async function save() {
    setError(null);
    if (!nombre.trim() || !apellido.trim() || !documento.trim()) {
      setError("Nombre, apellido y documento son obligatorios");
      return;
    }
    setSubmitting(true);
    try {
      const body = JSON.stringify({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        documento: documento.trim(),
        rol: rol.trim(),
        userId: userId || null,
        ...(editing ? { activo } : {}),
      });
      const res = await fetch(
        editing ? `/api/empleados/${editing.id}` : "/api/empleados",
        { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body }
      );
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

  async function toggleActivo(e: EmpleadoView) {
    const res = await fetch(`/api/empleados/${e.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !e.activo }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Empleados
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Administración del fichero de empleados
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Nuevo empleado
        </button>
      </header>

      {formOpen && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {editing ? "Editar empleado" : "Nuevo empleado"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nombre
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Apellido
              <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Documento
              <input type="text" value={documento} onChange={(e) => setDocumento(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Rol
              <input type="text" value={rol} onChange={(e) => setRol(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Usuario vinculado
              <select value={userId} onChange={(e) => setUserId(e.target.value)} className={inputClass}>
                <option value="">Sin usuario</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {u.email}
                  </option>
                ))}
              </select>
            </label>
            {editing && (
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="h-4 w-4"
                />
                Activo
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
              <th className="px-4 py-2 font-medium">Documento</th>
              <th className="px-4 py-2 font-medium">Rol</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {empleados.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2">
                  {e.nombre} {e.apellido}
                </td>
                <td className="px-4 py-2">{e.documento}</td>
                <td className="px-4 py-2">{e.rol}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      e.activo
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {e.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => openEdit(e)}
                      className="font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActivo(e)}
                      className="font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                    >
                      {e.activo ? "Desactivar" : "Activar"}
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
