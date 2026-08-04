"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert, inputClass } from "@/components/ui";
import { AlertIcon, UserIcon } from "@/components/icons";

interface RegistroScreenProps {
  codigo: string;
  valida: boolean;
  empleadoNombre: string | null;
  empleadoVinculado: boolean;
}

export function RegistroScreen({
  codigo,
  valida,
  empleadoNombre,
  empleadoVinculado,
}: RegistroScreenProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Ingresá un email válido");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/registro-invitado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Error inesperado");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <Link
          href="/login"
          className="mb-6 flex items-center gap-2.5"
        >
          <Image
            src="/logo-fichapp.png"
            alt="FichApp"
            width={44}
            height={44}
            className="h-11 w-11 rounded-xl"
          />
          <span className="text-lg font-bold tracking-tight text-foreground">
            FichApp
          </span>
        </Link>

        {!valida ? (
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Enlace de invitación no disponible
            </h1>
            <p className="text-sm text-muted">
              {empleadoVinculado
                ? "Este perfil de empleado ya tiene un usuario vinculado. Ingresá con tu cuenta."
                : "El enlace es inválido, fue usado o está expirado. Pedile al jefe que genere uno nuevo."}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-strong"
            >
              Ir a Ingresar
            </Link>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Completá tu registro
            </h1>
            <p className="mt-1 text-sm text-muted">
              El jefe te invitó a formar parte de FichApp.
            </p>

            {empleadoNombre && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-card p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <UserIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-muted">Perfil vinculado</p>
                  <p className="text-sm font-semibold text-foreground">
                    {empleadoNombre}
                  </p>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-6 flex flex-col gap-4"
              noValidate
            >
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Contraseña
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                />
              </label>

              {error && (
                <Alert>
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </Alert>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Procesando..." : "Crear mi cuenta"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
