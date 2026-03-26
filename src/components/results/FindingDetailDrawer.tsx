import { X } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { agentDefinitions } from "@/data/agents";
import { getRoleBasedFindingView } from "@/features/review-results/presenters";
import { Finding, StakeholderRole } from "@/types/review";
import { AgentIcon } from "@/components/common/AgentIcon";

interface FindingDetailDrawerProps {
  finding: Finding | null;
  role: StakeholderRole;
  onClose: () => void;
}

export function FindingDetailDrawer({ finding, role, onClose }: FindingDetailDrawerProps) {
  if (!finding) {
    return null;
  }

  const agent = agentDefinitions.find((item) => item.id === finding.agentId);
  const view = getRoleBasedFindingView(finding, role);

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-full max-w-[560px] overflow-auto border-l border-white/10 bg-background/95 p-5 shadow-panel scrollbar-thin md:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge className="border-white/10 bg-white/5 text-on-surface-variant">{finding.severity}</Badge>
              <Badge className="border-white/10 bg-white/5 text-on-surface-variant">
                {finding.confidence} confidence
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-2xl font-semibold text-on-surface">{finding.title}</h3>
              <p className="text-sm leading-7 text-on-surface-variant">{view.body}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {agent ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex size-10 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                <AgentIcon name={agent.icon} />
              </div>
              <div>
                <div className="font-medium text-on-surface">{agent.name}</div>
                <div className="text-sm text-on-surface-variant">{agent.description}</div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                {view.emphasisLabel}
              </div>
              <p className="mt-2 text-sm leading-7 text-on-surface">{view.emphasisValue}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                {view.secondaryLabel}
              </div>
              <p className="mt-2 text-sm leading-7 text-on-surface">{view.secondaryValue}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              Technical detail
            </div>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">{finding.technicalDetails}</p>
          </div>

          {finding.suggestedDiff ? (
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">Suggested diff</div>
              <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-xs leading-6 text-on-surface-variant">
                {finding.suggestedDiff}
              </pre>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-primary/5 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              {view.recommendationLabel}
            </div>
            <p className="mt-2 text-sm leading-7 text-on-surface">{view.recommendation}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
              Suggested test cases
            </div>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-on-surface">
              {finding.suggestedTestCases.map((testCase) => (
                <li key={testCase}>- {testCase}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
