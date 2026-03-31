import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Panel } from "@/components/common/Panel";
import { ReportFaultButton } from "@/components/review-flow/ReportFaultButton";
import type { ReviewIssueViewModel } from "@/models/review.types";
import { cn } from "@/utils/cn";

const severityToneMap = {
  critical: "border-error/30 bg-error/10 text-error",
  high: "border-tertiary/30 bg-tertiary/10 text-tertiary",
  medium: "border-secondary/30 bg-secondary/10 text-secondary",
  low: "border-white/15 bg-white/5 text-on-surface-variant",
} as const;

const noteMatchToneMap = {
  matched: "border-secondary/30 bg-secondary/10 text-secondary",
  agent_only: "border-tertiary/30 bg-tertiary/10 text-tertiary",
  unknown: "border-white/10 bg-white/5 text-on-surface-variant",
} as const;

interface ReviewIssueCardProps {
  issue: ReviewIssueViewModel;
  expanded: boolean;
  reportLoading?: boolean;
  onToggle: () => void;
  onReportFault: () => void;
}

export function ReviewIssueCard({
  issue,
  expanded,
  reportLoading,
  onToggle,
  onReportFault,
}: ReviewIssueCardProps) {
  const isReported = Boolean(issue.feedback?.reportedFault);

  return (
    <Panel className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]", severityToneMap[issue.severity])}>
              {issue.severity}
            </span>
            {issue.roleName ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-on-surface-variant">
                {issue.roleName}
              </span>
            ) : null}
            <span className={cn("rounded-full border px-3 py-1 text-xs", noteMatchToneMap[issue.noteMatchStatus])}>
              {issue.noteMatchStatus === "matched"
                ? "Matches Interviewer Note"
                : issue.noteMatchStatus === "agent_only"
                  ? "Agent-Only Issue"
                  : "Note Match Unknown"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-on-surface-variant">
              {issue.locationLabel}
            </span>
          </div>
          <div>
            <h3 className="font-display text-2xl font-semibold text-on-surface">{issue.title}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">{issue.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ReportFaultButton
            loading={reportLoading}
            reported={isReported}
            onClick={onReportFault}
          />
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            {expanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="grid gap-4 border-t border-white/10 pt-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Issue description</div>
            <p className="mt-3 text-sm leading-6 text-on-surface">{issue.description}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Suggested fix summary</div>
            <p className="mt-3 text-sm leading-6 text-on-surface">
              {issue.suggestion ?? "No suggested fix summary was returned for this issue."}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 lg:col-span-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
              Interviewer Note Match
            </div>
            <p className="mt-3 text-sm leading-6 text-on-surface">
              {issue.noteMatchStatus === "matched"
                ? `This agent issue aligns with ${issue.relatedNoteIds.length} interviewer note${issue.relatedNoteIds.length === 1 ? "" : "s"}.`
                : issue.noteMatchStatus === "agent_only"
                  ? "The agent returned this issue without a matching interviewer note."
                  : "The backend result did not include enough location detail to compare this issue against interviewer notes."}
            </p>
            {issue.relatedNoteTitles.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {issue.relatedNoteTitles.map((title) => (
                  <span key={`${issue.id}-${title}`} className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs text-secondary">
                    {title}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
