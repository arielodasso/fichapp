import type { ReactNode } from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const btn =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50";

export const btnPrimary = cx(
  btn,
  "bg-primary text-white shadow-sm hover:bg-primary-strong active:bg-primary-strong"
);

export const btnSecondary = cx(
  btn,
  "border border-line bg-card text-foreground hover:bg-muted/10 active:bg-muted/20"
);

export const btnDanger = cx(
  btn,
  "bg-red-600 text-white shadow-sm hover:bg-red-500 active:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400"
);

export const btnGhost = cx(
  btn,
  "text-muted hover:bg-muted/10 hover:text-foreground"
);

export const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/25";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-line bg-card shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "primary"
  | "info";

const badgeTones: Record<BadgeTone, string> = {
  neutral:
    "bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300",
  success:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  danger: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  primary:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300",
  info: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      {actions}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      {icon && <div className="text-muted">{icon}</div>}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted">{description}</p>
      )}
    </div>
  );
}

export function Alert({
  tone = "danger",
  children,
}: {
  tone?: "danger" | "success" | "warning" | "info";
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    danger: "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    warning:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    info: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
  };
  return (
    <div
      role="alert"
      className={cx(
        "flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium",
        tones[tone]
      )}
    >
      {children}
    </div>
  );
}
