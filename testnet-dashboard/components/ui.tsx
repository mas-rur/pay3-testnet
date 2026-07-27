import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border border-border bg-surface p-6 ${className}`}>{children}</div>
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
      className={`w-full border border-border bg-background px-3 py-2.5 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent placeholder:text-muted/60 ${props.className ?? ""}`}
    />
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const base =
    "font-mono text-xs uppercase tracking-widest px-4 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-accent text-[#05070a] hover:bg-[#8ad6fe]"
      : "border border-border text-foreground hover:border-accent hover:text-accent";
  return (
    <button {...props} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <p className="font-mono text-xs text-danger mt-3">{children}</p>;
}
