import { Panel } from "@/components/common/Panel";
import { SeverityCounts } from "@/types/review";

interface SeverityOverviewProps {
  counts: SeverityCounts;
}

const config = [
  { key: "critical", label: "Critical", color: "bg-error", textColor: "text-error" },
  { key: "high", label: "High", color: "bg-tertiary", textColor: "text-tertiary" },
  { key: "medium", label: "Medium", color: "bg-secondary", textColor: "text-secondary" },
  { key: "low", label: "Low", color: "bg-outline", textColor: "text-on-surface-variant" },
] as const;

export function SeverityOverview({ counts }: SeverityOverviewProps) {
  const total = counts.critical + counts.high + counts.medium + counts.low;

  return (
    <Panel className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
          Severity Distribution
        </div>
        <h3 className="mt-2 font-display text-xl font-semibold text-on-surface">Normalized findings by risk</h3>
      </div>
      <div className="space-y-4">
        {config.map((item) => {
          const value = counts[item.key];
          const percentage = total === 0 ? 0 : Math.round((value / total) * 100);
          return (
            <div key={item.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span>{item.label}</span>
                <span className={item.textColor}>{value}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5">
                <div className={`${item.color} h-full rounded-full`} style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
