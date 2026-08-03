import Link from "next/link";
import { getCurrentUser } from "@/lib/services/current-user";
import { LogoutButton } from "./dashboard/logout-button";
import { NavLinks } from "./nav-links";
import { ClockIcon } from "@/components/icons";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-foreground"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <ClockIcon className="h-5 w-5" />
            </span>
            <span className="hidden text-base font-bold tracking-tight sm:block">
              Dev Boost
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-right">
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold text-foreground">
                  {user?.name}
                </p>
                <p className="text-xs text-muted">
                  {user?.role === "ADMIN" ? "Jefe" : "Empleado"}
                </p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                {(user?.name ?? "?").charAt(0).toUpperCase()}
              </span>
            </div>
            <LogoutButton />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-6xl px-4 pb-2 sm:px-6">
          <NavLinks isAdmin={user?.role === "ADMIN"} />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
