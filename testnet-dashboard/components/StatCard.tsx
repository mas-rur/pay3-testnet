import { Panel } from "./ui";

export function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Panel>
      <div className="font-mono text-[11px] uppercase tracking-widest text-muted mb-2">
        {label}
      </div>
      <div className="font-sans text-2xl sm:text-3xl font-semibold tabular-nums">
        {value}
      </div>
    </Panel>
  );
}
