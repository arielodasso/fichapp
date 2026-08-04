import Link from "next/link";
import { requireUser } from "@/lib/services/current-user";
import { getReporteSemanal } from "@/lib/services/reportes";
import { formatHoras } from "@/lib/format";
import { Badge, cx } from "@/components/ui";
import {
  ArrowRightIcon,
  BarChartIcon,
  BuildingIcon,
  ClockIcon,
  UsersIcon,
} from "@/components/icons";

export default async function DashboardPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const reporte = isAdmin ? await getReporteSemanal(new Date(), user.id) : null;

  const totalHoras =
    reporte?.porObra.reduce(
      (acc, obra) =>
        acc + obra.empleados.reduce((s, e) => s + e.horas, 0),
      0
    ) ?? null;

  const quickLinks = [
    {
      href: "/fichadas",
      title: "Fichadas",
      text: "Registrá tu ingreso y egreso de hoy.",
      icon: ClockIcon,
      accent: "text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/15",
    },
    {
      href: "/reportes",
      title: "Reporte semanal",
      text: "Horas por obra y empleado, lunes a domingo.",
      icon: BarChartIcon,
      accent: "text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/15",
      admin: true,
    },
    {
      href: "/empleados",
      title: "Empleados",
      text: "Administrá el fichero de empleados.",
      icon: UsersIcon,
      accent: "text-sky-600 bg-sky-100 dark:text-sky-300 dark:bg-sky-500/15",
      admin: true,
    },
    {
      href: "/obras",
      title: "Obras",
      text: "Consultá las obras y dejá tus novedades.",
      icon: BuildingIcon,
      accent: "text-amber-600 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/15",
    },
  ].filter((l) => !l.admin || isAdmin);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 sm:p-6">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Hola, {user.name}
            </h1>
            <Badge tone="primary">
              {isAdmin ? "Jefe" : "Empleado"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted">{user.email}</p>

          {totalHoras !== null && (
            <div className="mt-6 flex flex-wrap items-end gap-3">
              <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
                {formatHoras(totalHoras)}
              </p>
              <p className="pb-1.5 text-sm font-medium text-muted">
                horas registradas esta semana
              </p>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Accesos rápidos
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cx(
                "group flex flex-col gap-4 rounded-2xl border border-line bg-card p-5 shadow-sm transition-all duration-200",
                "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              )}
            >
              <span
                className={cx(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  l.accent
                )}
              >
                <l.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-foreground">{l.title}</p>
                <p className="mt-0.5 text-sm text-muted">{l.text}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Abrir
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
