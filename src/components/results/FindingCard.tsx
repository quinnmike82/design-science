import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AgentIcon } from "@/components/common/AgentIcon";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Panel } from "@/components/common/Panel";
import { Select } from "@/components/common/Select";
import { getAgentDefinition } from "@/data/agents";
import { getRoleBasedFindingView } from "@/features/review-results/presenters";
import { formatLineRange } from "@/utils/format";
import { DeveloperComment, Finding, FindingReport, IssueReportReason, StakeholderRole } from "@/types/review";

const severityClassMap = {
  critical: "border-error/35 bg-error/10 text-error",
  high: "border-tertiary/35 bg-tertiary/10 text-tertiary",
  medium: "border-secondary/35 bg-secondary/10 text-secondary",
  low: "border-white/10 bg-white/5 text-on-surface-variant",
};

const developerStatusCopy = {
  found: "Already found by developer",
  missed: "Missed by developer",
  unknown: "No direct line match",
} as const;

const issueReportReasonOptions: Array<{ value: IssueReportReason; label: string }> = [
  { value: "false_positive", label: "This is not actually an issue" },
  { value: "incorrect_line", label: "The line reference is wrong" },
  { value: "wrong_severity", label: "The severity is off" },
  { value: "not_actionable", label: "The guidance is not actionable" },
  { value: "other", label: "Other feedback" },
];

interface FindingCardProps {
  finding: Finding;
  role: StakeholderRole;
  expanded: boolean;
  relatedComments: DeveloperComment[];
  report?: FindingReport;
  canReport: boolean;
  isReporting: boolean;
  reportDisabledReason?: string;
  onToggle: (findingId: string) => void;
  onSubmitReport: (payload: { reason: IssueReportReason; details: string }) => Promise<void>;
}

function formatSubmittedAt(timestamp: string) {
  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? "saved" : parsed.toLocaleString();
}

export function FindingCard({
  finding,
  role,
  expanded,
  relatedComments,
  report,
  canReport,
  isReporting,
  reportDisabledReason,
  onToggle,
  onSubmitReport,
}: FindingCardProps) {
  const view = getRoleBasedFindingView(finding, role);
  const agent = getAgentDefinition(finding.agentId);
  const buttonId = `finding-trigger-${finding.id}`;
  const panelId = `finding-panel-${finding.id}`;
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<IssueReportReason>(report?.reason ?? "false_positive");
  const [reportDetails, setReportDetails] = useState(report?.details ?? "");

  useEffect(() => {
    setReportReason(report?.reason ?? "false_positive");
    setReportDetails(report?.details ?? "");
  }, [report?.details, report?.reason]);

  const handleToggleReport = () => {
    if (!expanded) {
      onToggle(finding.id);
    }
    setIsReportOpen((current) => !current);
  };

  const handleSubmitReport = async () => {
    try {
      await onSubmitReport({
        reason: reportReason,
        details: reportDetails.trim(),
      });
      setIsReportOpen(false);
    } catch {
      // The parent renders the error state; keep the form open for correction.
    }
  };

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
                {finding.lineStart ? `:${formatLineRange(finding.lineStart, finding.lineEnd)}` : ""}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-on-surface-variant">
              <AgentIcon name={agent.icon} className="size-4" />
              {agent.name}
            </div>
            <Button variant="outline" size="sm" disabled={!canReport} onClick={handleToggleReport}>
              {report ? "Update report" : "Report issue"}
            </Button>
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

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                {view.recommendationLabel}
              </div>
              <p className="mt-2 text-sm leading-6 text-on-surface">{view.recommendation}</p>
            </div>

            {isReportOpen ? (
              <div className="rounded-2xl border border-tertiary/20 bg-tertiary/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-tertiary">
                      Report this AI finding
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
                      Tell us what was wrong with this finding so we can compare model quality and platform usability.
                    </p>
                  </div>
                  {report ? (
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-on-surface-variant">
                      Saved {formatSubmittedAt(report.submittedAt)}
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                  <Select
                    label="What is wrong?"
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value as IssueReportReason)}
                  >
                    {issueReportReasonOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  <label className="flex flex-col gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      Notes
                    </span>
                    <textarea
                      className="min-h-[116px] w-full rounded-2xl border border-white/10 bg-surface/90 px-4 py-3 text-sm leading-6 text-on-surface focus:border-primary/60"
                      value={reportDetails}
                      onChange={(event) => setReportDetails(event.target.value)}
                      placeholder="Optional detail about why this finding was incorrect or unhelpful."
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-on-surface-variant">
                    {canReport ? "You can resubmit this feedback if you want to update it." : reportDisabledReason}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsReportOpen(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" disabled={!canReport || isReporting} onClick={() => void handleSubmitReport()}>
                      {isReporting ? "Saving..." : report ? "Update report" : "Submit report"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

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
                        {comment.lineStart ? `:${formatLineRange(comment.lineStart, comment.lineEnd)}` : ""}
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
