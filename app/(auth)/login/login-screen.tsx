"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert, cx, inputClass } from "@/components/ui";
import {
  AlertIcon,
  BarChartIcon,
  ClockIcon,
  ShieldCheckIcon,
} from "@/components/icons";

type Mode = "login" | "register";

const FEATURES = [
  {
    icon: ClockIcon,
    title: "Fichado simple",
    text: "Ingreso y egreso en segundos, con historial completo.",
  },
  {
    icon: BarChartIcon,
    title: "Reportes semanales",
    text: "Horas por obra y empleado, de lunes a domingo.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Roles claros",
    text: "El jefe administra; los empleados registran sus fichadas.",
  },
];

interface LoginScreenProps {
  registroAbierto: boolean;
}

export function LoginScreen({ registroAbierto }: LoginScreenProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

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
    if (mode === "register" && !name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        mode === "login" ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "login" ? { email, password } : { name, email, password }
          ),
        }
      );
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
    <main className="flex min-h-screen">
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-10 text-white lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <ClockIcon className="h-6 w-6" />
          </span>
          <span className="text-lg font-bold tracking-tight">FichApp</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            Fichero de empleados y obras, en orden.
          </h1>
          <p className="mt-3 text-base text-indigo-100">
            Digitalizá el control de ingreso y egreso, y conocé las horas
            trabajadas por obra cada semana.
          </p>

          <ul className="mt-8 flex flex-col gap-5">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <f.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-indigo-100">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-indigo-200">
          Construcción · Obras · Equipos · Horas
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
              <ClockIcon className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight text-foreground">
              FichApp
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {mode === "login" ? "Ingresá a tu cuenta" : "Creá tu cuenta"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {mode === "login"
              ? "Registrá tu fichada o consultá el reporte semanal."
              : "Registrate como jefe para administrar tu fichero."}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-line bg-card p-1">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                aria-pressed={mode === m}
                className={cx(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-200",
                  mode === m
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                )}
              >
                {m === "login" ? "Ingresar" : "Registrarse"}
              </button>
            ))}
          </div>

          {mode === "register" && !registroAbierto ? (
            <div className="mt-6 flex flex-col gap-4">
              <Alert>
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  El registro público está cerrado. Si sos empleado, usá el
                  enlace de invitación que te envió el jefe.
                </div>
              </Alert>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-strong"
              >
                Ir a Ingresar
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-6 flex flex-col gap-4"
              noValidate
            >
              {mode === "register" && (
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Nombre
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="Nombre y apellido"
                    autoComplete="name"
                  />
                </label>
              )}

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
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
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
                {loading
                  ? "Procesando..."
                  : mode === "login"
                    ? "Ingresar"
                    : "Crear cuenta"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
