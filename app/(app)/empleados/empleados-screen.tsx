"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatHoras } from "@/lib/format";
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
  CheckIcon,
  CopyIcon,
  LinkIcon,
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
  obraIds: string[];
}

interface EmpleadosScreenProps {
  empleados: EmpleadoView[];
  usuarios: { id: string; email: string; name: string }[];
  obras: { id: string; nombre: string }[];
  invitaciones: Record<string, { id: string; codigo: string; expiraEn: string }>;
  horasTotales: Record<string, number>;
}

export function EmpleadosScreen({
  empleados,
  usuarios,
  obras,
  invitaciones,
  horasTotales,
}: EmpleadosScreenProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmpleadoView | null>(null);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [documento, setDocumento] = useState("");
  const [rol, setRol] = useState("OBRERO");
  const [userId, setUserId] = useState("");
  const [obraIds, setObraIds] = useState<string[]>([]);
  const [activo, setActivo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [invitacionBanner, setInvitacionBanner] = useState<{
    nombre: string;
    link: string;
  } | null>(null);
  const [copiado, setCopiado] = useState(false);

  function openNew() {
    setEditing(null);
    setNombre("");
    setApellido("");
    setDocumento("");
    setRol("OBRERO");
    setUserId("");
    setObraIds([]);
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
    setObraIds(e.obraIds);
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
        obraIds,
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
      if (!editing && json.invitacion?.link) {
        setInvitacionBanner({
          nombre: `${json.empleado?.nombre ?? nombre.trim()} ${json.empleado?.apellido ?? apellido.trim()}`,
          link: json.invitacion.link,
        });
        setCopiado(false);
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

  async function generarInvitacion(e: EmpleadoView) {
    setError(null);
    setInvitacionBanner(null);
    try {
      const res = await fetch("/api/invitaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empleadoId: e.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Error inesperado");
        return;
      }
      setInvitacionBanner({
        nombre: `${e.nombre} ${e.apellido}`,
        link: json.invitacion.link,
      });
      setCopiado(false);
    } catch {
      setError("Error de conexión");
    }
  }

  async function copiarEnlace() {
    if (!invitacionBanner) return;
    try {
      await navigator.clipboard.writeText(invitacionBanner.link);
      setCopiado(true);
    } catch {
      setError("No se pudo copiar el enlace");
    }
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
            <fieldset className={cx(fieldClass, "sm:col-span-2")}>
              <legend>Obras asignadas</legend>
              {obras.length === 0 ? (
                <p className="text-sm font-normal text-muted">
                  No hay obras cargadas todavía. Creá obras para asignarlas a
                  los empleados.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {obras.map((o) => {
                    const checked = obraIds.includes(o.id);
                    return (
                      <label
                        key={o.id}
                        className="flex items-center gap-2 text-sm font-normal text-foreground"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setObraIds((prev) =>
                              checked
                                ? prev.filter((id) => id !== o.id)
                                : [...prev, o.id]
                            )
                          }
                          className="h-4 w-4 rounded border-line accent-indigo-600"
                        />
                        {o.nombre}
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>
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

      {invitacionBanner && (
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <LinkIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-foreground">
                Enlace de invitación para {invitacionBanner.nombre}
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                Enviáselo por WhatsApp o email. Al abrirlo, el empleado completa
                su registro y queda vinculado a su perfil.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <code className="min-w-0 flex-1 break-all rounded-lg border border-line bg-muted/5 px-3 py-2 text-sm text-foreground">
                  {invitacionBanner.link}
                </code>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copiarEnlace}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-strong"
                  >
                    {copiado ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                    {copiado ? "Copiado" : "Copiar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvitacionBanner(null)}
                    className="inline-flex items-center justify-center rounded-lg border border-line px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
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
                  <th className="px-4 py-3">Obras</th>
                  <th className="px-4 py-3 text-right">Horas totales</th>
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
                      {e.userId ? (
                        <p className="text-xs text-muted">Vinculado a usuario</p>
                      ) : invitaciones[e.id] ? (
                        <Badge tone="warning">Invitación pendiente</Badge>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {e.documento}
                    </td>
                    <td className="px-4 py-3 text-foreground">{e.rol}</td>
                    <td className="px-4 py-3">
                      {e.obraIds.length === 0 ? (
                        <span className="text-xs text-muted">Sin obras</span>
                      ) : (
                        <div className="flex max-w-64 flex-wrap gap-1">
                          {e.obraIds.map((oid) => {
                            const obra = obras.find((o) => o.id === oid);
                            return obra ? (
                              <Badge key={oid} tone="neutral">
                                {obra.nombre}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                      {formatHoras(horasTotales[e.id] ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      {e.activo ? (
                        <Badge tone="success">Activo</Badge>
                      ) : (
                        <Badge tone="neutral">Inactivo</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {!e.userId && (
                          <button
                            type="button"
                            onClick={() => generarInvitacion(e)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
                          >
                            <LinkIcon className="h-4 w-4" />
                            Invitar
                          </button>
                        )}
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
