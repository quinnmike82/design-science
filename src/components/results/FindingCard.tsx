import { Badge } from "@/components/common/Badge";
import { Panel } from "@/components/common/Panel";
import { agentDefinitions } from "@/data/agents";
import { getRoleBasedFindingView } from "@/features/review-results/presenters";
import { Finding, StakeholderRole } from "@/types/review";
import { AgentIcon } from "@/components/common/AgentIcon";

const severityClassMap = {
  critical: "border-error/35 bg-error/10 text-error",
  high: "border-tertiary/35 bg-tertiary/10 text-tertiary",
  medium: "border-secondary/35 bg-secondary/10 text-secondary",
  low: "border-white/10 bg-white/5 text-on-surface-variant",
};

interface FindingCardProps {
  finding: Finding;
  role: StakeholderRole;
  onSelect: (findingId: string) => void;
}

export function FindingCard({ finding, role, onSelect }: FindingCardProps) {
  const view = getRoleBasedFindingView(finding, role);
  const agent = agentDefinitions.find((item) => item.id === finding.agentId);

  return (
    <button type="button" className="w-full text-left" onClick={() => onSelect(finding.id)}>
      <Panel className="group transition-all hover:border-primary/20 hover:bg-surface-high">
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={severityClassMap[finding.severity]}>{finding.severity}</Badge>
              <Badge className="border-white/10 bg-white/5 text-on-surface-variant">
                {finding.confidence} confidence
              </Badge>
              {finding.filePath ? (
                <span className="font-mono text-xs text-on-surface-variant">
                  {finding.filePath}
                  {finding.lineStart ? `:${finding.lineStart}` : ""}
                </span>
              ) : null}
            </div>
            {agent ? (
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-on-surface-variant">
                <AgentIcon name={agent.icon} className="size-4" />
                {agent.name}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-xl font-semibold text-on-surface">{view.headline}</h3>
            <p className="text-sm leading-7 text-on-surface-variant">{view.body}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                {view.emphasisLabel}
              </div>
              <p className="mt-2 text-sm leading-6 text-on-surface">{view.emphasisValue}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                {view.secondaryLabel}
              </div>
              <p className="mt-2 text-sm leading-6 text-on-surface">{view.secondaryValue}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-primary/5 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              {view.recommendationLabel}
            </div>
            <p className="mt-2 text-sm leading-6 text-on-surface">{view.recommendation}</p>
          </div>
        </div>
      </Panel>
    </button>
  );
}
