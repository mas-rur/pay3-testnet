import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-background p-5 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

/** Soft lavender-gray panel, used for stat tiles and the sidebar. */
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-surface p-5 ${className}`}>{children}</div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="block font-mono text-[11px] uppercase tracking-widest text-muted mb-2">
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent placeholder:text-muted/70 ${props.className ?? ""}`}
    />
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-sans text-sm font-medium px-5 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-surface-strong text-foreground hover:bg-border",
    outline:
      "border border-border text-foreground hover:border-accent hover:text-accent-link",
    ghost: "bg-surface text-foreground hover:bg-surface-strong",
  }[variant];
  return (
    <button {...props} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function Pill({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "danger" | "accent";
  className?: string;
}) {
  const styles = {
    neutral: "bg-surface text-muted",
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    accent: "bg-accent/15 text-accent-ink",
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${styles} ${className}`}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = "neutral" }: { tone?: "neutral" | "success" | "danger" }) {
  const color = {
    neutral: "bg-muted",
    success: "bg-success",
    danger: "bg-danger",
  }[tone];
  return <span className={`h-1.5 w-1.5 rounded-full ${color}`} />;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <p className="font-mono text-xs text-danger mt-3">{children}</p>;
}

export function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-sans text-base font-semibold text-foreground">{title}</h2>
      {action}
    </div>
  );
}
