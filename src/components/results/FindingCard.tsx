import { Badge } from "@/components/common/Badge";
import { Panel } from "@/components/common/Panel";
import { agentDefinitions } from "@/data/agents";
import { getRoleBasedFindingView } from "@/features/review-results/presenters";
import { DeveloperComment, Finding, StakeholderRole } from "@/types/review";
import { AgentIcon } from "@/components/common/AgentIcon";
import { Button } from "@/components/common/Button";
import { ChevronDown, ChevronUp } from "lucide-react";

const severityClassMap = {
  critical: "border-error/35 bg-error/10 text-error",
  high: "border-tertiary/35 bg-tertiary/10 text-tertiary",
  medium: "border-secondary/35 bg-secondary/10 text-secondary",
  low: "border-white/10 bg-white/5 text-on-surface-variant",
};

interface FindingCardProps {
  finding: Finding;
  role: StakeholderRole;
  expanded: boolean;
  relatedComments: DeveloperComment[];
  onToggle: (findingId: string) => void;
}

const developerStatusCopy = {
  found: "Already found by developer",
  missed: "Missed by developer",
  unknown: "No direct line match",
} as const;

export function FindingCard({ finding, role, expanded, relatedComments, onToggle }: FindingCardProps) {
  const view = getRoleBasedFindingView(finding, role);
  const agent = agentDefinitions.find((item) => item.id === finding.agentId);
  const buttonId = `finding-trigger-${finding.id}`;
  const panelId = `finding-panel-${finding.id}`;

  return (
    <Panel className="group transition-all hover:border-primary/20 hover:bg-surface-high">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={severityClassMap[finding.severity]}>{finding.severity}</Badge>
            <Badge className="border-white/10 bg-white/5 text-on-surface-variant">
              {finding.confidence} confidence
            </Badge>
            <Badge
              className={
                finding.developerFoundStatus === "missed"
                  ? "border-tertiary/35 bg-tertiary/10 text-tertiary"
                  : finding.developerFoundStatus === "found"
                    ? "border-secondary/35 bg-secondary/10 text-secondary"
                    : "border-white/10 bg-white/5 text-on-surface-variant"
              }
            >
              {developerStatusCopy[finding.developerFoundStatus]}
            </Badge>
            {finding.filePath ? (
              <span className="font-mono text-xs text-on-surface-variant">
                {finding.filePath}
                {finding.lineStart ? `:${finding.lineStart}` : ""}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {agent ? (
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-on-surface-variant">
                <AgentIcon name={agent.icon} className="size-4" />
                {agent.name}
              </div>
            ) : null}
            <Button
              id={buttonId}
              variant="ghost"
              size="sm"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => onToggle(finding.id)}
            >
              {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              {expanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl font-semibold text-on-surface">{view.headline}</h3>
        </div>

        {expanded ? (
          <div id={panelId} role="region" aria-labelledby={buttonId} className="space-y-4">
            <p className="text-sm leading-7 text-on-surface-variant">{view.summary}</p>

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

            {view.detailSections.map((section) => (
              <div key={section.label} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                  {section.label}
                </div>
                <p className="mt-2 text-sm leading-6 text-on-surface">{section.content}</p>
              </div>
            ))}

            <div className="rounded-2xl border border-white/10 bg-primary/5 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                {view.recommendationLabel}
              </div>
              <p className="mt-2 text-sm leading-6 text-on-surface">{view.recommendation}</p>
            </div>

            {relatedComments.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                  Linked developer comments
                </div>
                <div className="mt-3 space-y-3">
                  {relatedComments.map((comment) => (
                    <div key={comment.id} className="rounded-2xl border border-white/10 bg-black/15 p-3">
                      <div className="font-medium text-on-surface">{comment.title}</div>
                      <div className="mt-1 text-xs text-on-surface-variant">
                        {comment.filePath}
                        {comment.lineStart ? `:${comment.lineStart}` : ""}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{comment.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 text-xs text-on-surface-variant">
              {finding.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-black/15 px-2.5 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
