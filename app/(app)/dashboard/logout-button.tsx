"use client";

import { useRouter } from "next/navigation";
import { btnSecondary } from "@/components/ui";
import { LogOutIcon } from "@/components/icons";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={btnSecondary}
      aria-label="Cerrar sesión"
    >
      <LogOutIcon className="h-4 w-4" />
      <span className="hidden sm:inline">Cerrar sesión</span>
    </button>
  );
}
