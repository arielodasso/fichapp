"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";
import {
  BarChartIcon,
  BuildingIcon,
  ClipboardCheckIcon,
  ClockIcon,
  HistoryIcon,
  LayoutGridIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@/components/icons";
import type { UserRole } from "@/lib/services/auth";

const links: Array<{
  href: string;
  label: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
  admin?: boolean;
  superadmin?: boolean;
}> = [
  { href: "/dashboard", label: "Inicio", icon: LayoutGridIcon },
  { href: "/fichadas", label: "Fichadas", icon: ClockIcon },
  { href: "/tareas", label: "Tareas", icon: ClipboardCheckIcon },
  { href: "/empleados", label: "Empleados", icon: UsersIcon, admin: true },
  { href: "/obras", label: "Obras", icon: BuildingIcon },
  { href: "/reportes", label: "Reportes", icon: BarChartIcon, admin: true },
  { href: "/periodos", label: "Períodos", icon: HistoryIcon, admin: true },
  { href: "/superadmin", label: "Superadmin", icon: ShieldCheckIcon, superadmin: true },
];

export function NavLinks({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const isAdmin = role === "ADMIN";
  const isSuperadmin = role === "SUPERADMIN";

  return (
    <nav
      aria-label="Principal"
      className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      {links
        .filter((l) => (!l.admin || isAdmin) && (!l.superadmin || isSuperadmin))
        .map((l) => {
          const active =
            pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                active
                  ? "bg-primary-soft text-primary"
                  : "text-muted hover:bg-muted/10 hover:text-foreground"
              )}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          );
        })}
    </nav>
  );
}
