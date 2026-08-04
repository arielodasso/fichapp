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
  EmptyState,
  inputClass,
  PageHeader,
  type BadgeTone,
} from "@/components/ui";
import {
  AlertIcon,
  BuildingIcon,
  PencilIcon,
  ShieldCheckIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/icons";
import type { UserRole } from "@/lib/services/auth";

interface UsuarioView {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

interface OrganizacionView {
  id: string;
  nombre: string;
  email: string;
  empleados: number;
  obras: number;
  fichadas: number;
  tareas: number;
  createdAt: string;
}

interface SuperadminScreenProps {
  usuarioActualId: string;
  usuarios: UsuarioView[];
  organizaciones: OrganizacionView[];
}

const roleLabel: Record<UserRole, string> = {
  ADMIN: "Jefe",
  EMPLOYEE: "Empleado",
  SUPERADMIN: "Superadmin",
};

const roleTone: Record<UserRole, BadgeTone> = {
  ADMIN: "primary",
  EMPLOYEE: "neutral",
  SUPERADMIN: "info",
};

export function SuperadminScreen({
  usuarioActualId,
  usuarios,
  organizaciones,
}: SuperadminScreenProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<UsuarioView | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function openEdit(u: UsuarioView) {
    setEditing(u);
    setName(u.name);
    setEmail(u.email);
    setError(null);
  }

  function closeEdit() {
    setEditing(null);
    setName("");
    setEmail("");
    setError(null);
  }

  async function guardarUsuario() {
    if (!editing) return;
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError("Nombre y email son obligatorios");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/superadmin/usuarios/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Error inesperado");
        return;
      }
      closeEdit();
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  async function eliminarUsuario(u: UsuarioView) {
    if (
      !window.confirm(
        `¿Eliminar a ${u.name}${u.role === "ADMIN" ? " y toda su organización" : ""}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    setError(null);
    const res = await fetch(`/api/superadmin/usuarios/${u.id}`, {
      method: "DELETE",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "No se pudo eliminar");
      return;
    }
    router.refresh();
  }

  async function eliminarOrganizacion(o: OrganizacionView) {
    if (
      !window.confirm(
        `¿Eliminar la organización de ${o.nombre}? Se borrarán sus ${o.empleados} empleados, ${o.obras} obras, ${o.fichadas} fichadas y ${o.tareas} tareas.`
      )
    ) {
      return;
    }
    setError(null);
    const res = await fetch(`/api/superadmin/organizaciones/${o.id}`, {
      method: "DELETE",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "No se pudo eliminar");
      return;
    }
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 sm:p-6">
      <PageHeader
        title="Panel de superadmin"
        description="Administración global de usuarios y organizaciones"
      />

      {error && (
        <Alert tone="danger">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <div>{error}</div>
        </Alert>
      )}

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
          <UsersIcon className="h-4 w-4" />
          Usuarios ({usuarios.length})
        </h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-muted/5 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Creado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {usuarios.map((u) => {
                  const esSuperadmin = u.role === "SUPERADMIN";
                  const esSelf = u.id === usuarioActualId;
                  return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-muted/5"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{u.name}</p>
                        {esSuperadmin && (
                          <p className="text-xs text-muted">
                            Cuenta fija (credenciales hardcodeadas)
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge tone={roleTone[u.role]}>{roleLabel[u.role]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {formatFecha(u.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {!esSuperadmin ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(u)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
                            >
                              <PencilIcon className="h-4 w-4" />
                              Editar
                            </button>
                            <button
                              type="button"
                              disabled={esSelf}
                              onClick={() => eliminarUsuario(u)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-500/10"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 text-muted">
                            <ShieldCheckIcon className="h-4 w-4" />
                            <span className="text-xs">Protegido</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
          <BuildingIcon className="h-4 w-4" />
          Organizaciones ({organizaciones.length})
        </h2>
        {organizaciones.length === 0 ? (
          <EmptyState
            icon={<BuildingIcon className="h-8 w-8" />}
            title="No hay organizaciones"
            description="Los usuarios registrados como jefes aparecen acá."
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-muted/5 text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Organización</th>
                    <th className="px-4 py-3 text-center">Empleados</th>
                    <th className="px-4 py-3 text-center">Obras</th>
                    <th className="px-4 py-3 text-center">Fichadas</th>
                    <th className="px-4 py-3 text-center">Tareas</th>
                    <th className="px-4 py-3">Creada</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {organizaciones.map((o) => (
                    <tr
                      key={o.id}
                      className="transition-colors hover:bg-muted/5"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{o.nombre}</p>
                        <p className="text-xs text-muted">{o.email}</p>
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-foreground">
                        {o.empleados}
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-foreground">
                        {o.obras}
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-foreground">
                        {o.fichadas}
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-foreground">
                        {o.tareas}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {formatFecha(o.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={o.id === usuarioActualId}
                            onClick={() => eliminarOrganizacion(o)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-500/10"
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
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="mb-4 text-base font-semibold text-foreground">
              Editar usuario
            </h2>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Nombre
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={guardarUsuario}
                className={btnPrimary}
              >
                {submitting ? "Guardando..." : "Guardar"}
              </button>
              <button type="button" onClick={closeEdit} className={btnSecondary}>
                Cancelar
              </button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
