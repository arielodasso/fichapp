import Link from "next/link";
import { getCurrentUser } from "@/lib/services/current-user";
import { LogoutButton } from "./dashboard/logout-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <Link
          href="/dashboard"
          className="font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Fichero Empleados y Obras
        </Link>
        <nav className="flex items-center gap-4 text-sm text-zinc-700 dark:text-zinc-300">
          <Link href="/fichadas" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Fichadas
          </Link>
          {user?.role === "ADMIN" && (
            <>
              <Link href="/empleados" className="hover:text-zinc-900 dark:hover:text-zinc-50">
                Empleados
              </Link>
              <Link href="/obras" className="hover:text-zinc-900 dark:hover:text-zinc-50">
                Obras
              </Link>
              <Link href="/reportes" className="hover:text-zinc-900 dark:hover:text-zinc-50">
                Reportes
              </Link>
              <Link href="/periodos" className="hover:text-zinc-900 dark:hover:text-zinc-50">
                Períodos
              </Link>
            </>
          )}
          <LogoutButton />
        </nav>
      </header>
      {children}
    </div>
  );
}
