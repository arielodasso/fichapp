import { requireUser } from "@/lib/services/current-user";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Hola, {user.name}
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {user.role === "ADMIN" ? "Rol: Jefe" : "Rol: Empleado"} · {user.email}
      </p>
    </main>
  );
}
