"use client";

import { MoonIcon, SunIcon } from "@/components/icons";

const THEME_KEY = "fichapp-theme";

export function ThemeToggle() {
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      // el tema visual igual se aplica para la sesión actual
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar modo claro/oscuro"
      title="Cambiar modo claro/oscuro"
      className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all duration-200 hover:bg-primary-strong hover:shadow-xl active:scale-95"
    >
      <SunIcon className="hidden h-5 w-5 dark:block" />
      <MoonIcon className="h-5 w-5 dark:hidden" />
    </button>
  );
}
