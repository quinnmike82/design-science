import { Panel } from "@/components/common/Panel";
import { agentDefinitions } from "@/data/agents";
import { stakeholderRoleConfig } from "@/features/stakeholder-role/roleConfig";
import { ReviewResult, StakeholderRole } from "@/types/review";
import { AgentIcon } from "@/components/common/AgentIcon";

interface RoleAwareSummaryPanelProps {
  result: ReviewResult;
  role: StakeholderRole;
}

export function RoleAwareSummaryPanel({ result, role }: RoleAwareSummaryPanelProps) {
  const roleConfig = stakeholderRoleConfig[role];

  return (
    <Panel className="space-y-5">
      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
          Perspective summary
        </div>
        <h3 className="font-display text-xl font-semibold text-on-surface">{roleConfig.label}</h3>
        <p className="text-sm leading-7 text-on-surface-variant">{roleConfig.helpText}</p>
      </div>
      <div className="space-y-3">
        {result.agentSummaries.map((summary) => {
          const agent = agentDefinitions.find((item) => item.id === summary.agentId);
          return (
            <div key={summary.agentId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex size-9 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <AgentIcon name={agent?.icon ?? "shield"} className="size-4" />
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="font-medium text-on-surface">{agent?.name ?? summary.agentId}</div>
                    <div className="text-sm text-on-surface-variant">{summary.headline}</div>
                  </div>
                  <p className="text-sm leading-6 text-on-surface">{summary.summary}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-on-surface-variant">
                    {summary.focusAreas.map((item) => (
                      <span key={item} className="rounded-full border border-white/10 bg-black/15 px-2.5 py-1">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
