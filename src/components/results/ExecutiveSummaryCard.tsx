import { Badge } from "@/components/common/Badge";
import { Panel } from "@/components/common/Panel";
import { stakeholderRoleConfig } from "@/features/stakeholder-role/roleConfig";
import { RoleBasedSummary, StakeholderRole } from "@/types/review";

interface ExecutiveSummaryCardProps {
  role: StakeholderRole;
  summary: RoleBasedSummary;
}

export function ExecutiveSummaryCard({ role, summary }: ExecutiveSummaryCardProps) {
  const roleConfig = stakeholderRoleConfig[role];

  return (
    <Panel highlighted className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className={roleConfig.badgeClass}>{roleConfig.shortLabel}</Badge>
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">{summary.eyebrow}</span>
        </div>
        <div className="space-y-3">
          <h2 className="max-w-3xl font-display text-3xl font-bold tracking-tight text-on-surface">{summary.title}</h2>
          <p className="max-w-3xl text-sm leading-7 text-on-surface-variant">{summary.description}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-on-surface">
          {summary.callout}
        </div>
      </div>
    </Panel>
  );
}
