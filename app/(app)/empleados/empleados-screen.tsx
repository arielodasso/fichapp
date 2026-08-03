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
  PencilIcon,
  PlusIcon,
  UsersIcon,
} from "@/components/icons";

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

  function close() {
    setFormOpen(false);
    setEditing(null);
    setError(null);
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

  async function toggleActivo(e: EmpleadoView) {
    const res = await fetch(`/api/empleados/${e.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !e.activo }),
    });
    if (res.ok) router.refresh();
  }

  const fieldClass =
    "flex flex-col gap-1.5 text-sm font-medium text-foreground";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Empleados"
        description="Administración del fichero de empleados"
        actions={
          <button type="button" onClick={openNew} className={btnPrimary}>
            <PlusIcon className="h-4 w-4" />
            Nuevo empleado
          </button>
        }
      />

      {formOpen && (
        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            {editing ? "Editar empleado" : "Nuevo empleado"}
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
              Apellido
              <input
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className={fieldClass}>
              Documento
              <input
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className={fieldClass}>
              Rol
              <input
                type="text"
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className={cx(fieldClass, "sm:col-span-2")}>
              Usuario vinculado
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className={inputClass}
              >
                <option value="">Sin usuario</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {u.email}
                  </option>
                ))}
              </select>
            </label>
            {editing && (
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="h-4 w-4 rounded border-line accent-indigo-600"
                />
                Activo
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

      {empleados.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="h-8 w-8" />}
          title="No hay empleados cargados"
          description="Creá el primer empleado para empezar a registrar fichadas."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-muted/5 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {empleados.map((e) => (
                  <tr
                    key={e.id}
                    className="transition-colors hover:bg-muted/5"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {e.nombre} {e.apellido}
                      </p>
                      {e.userId && (
                        <p className="text-xs text-muted">Vinculado a usuario</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {e.documento}
                    </td>
                    <td className="px-4 py-3 text-foreground">{e.rol}</td>
                    <td className="px-4 py-3">
                      {e.activo ? (
                        <Badge tone="success">Activo</Badge>
                      ) : (
                        <Badge tone="neutral">Inactivo</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(e)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActivo(e)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
                        >
                          {e.activo ? "Desactivar" : "Activar"}
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
