import { Panel } from "@/components/common/Panel";
import { ReviewSummaryList } from "@/components/review-flow/ReviewSummaryList";
import type { ReviewIssueViewModel, ReviewResultViewModel } from "@/models/review.types";

interface Step2SummarySectionProps {
  result?: ReviewResultViewModel;
  reportingIds: string[];
  onReportFault: (issueId: string) => void;
  onContinue: () => void;
}

function countIssues(issues: ReviewIssueViewModel[], severity: ReviewIssueViewModel["severity"]) {
  return issues.filter((issue) => issue.severity === severity).length;
}

export function Step2SummarySection({ result, reportingIds, onReportFault, onContinue }: Step2SummarySectionProps) {
  const issues = result?.issues ?? [];
  const noteComparison = result?.noteComparison;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        {(["critical", "high", "medium", "low"] as const).map((severity) => (
          <Panel key={severity} className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">{severity}</div>
            <div className="font-display text-4xl font-bold text-on-surface">{countIssues(issues, severity)}</div>
          </Panel>
        ))}
      </div>

      <Panel className="space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">Review result summary</div>
        <h2 className="font-display text-3xl font-semibold text-on-surface">Findings overview</h2>
        <p className="max-w-4xl text-sm leading-7 text-on-surface-variant">
          {result?.summaryText ?? "No review summary is available yet."}
        </p>
      </Panel>

      <Panel className="space-y-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">
          Interviewer Note Comparison
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-on-surface-variant">Total notes</div>
            <div className="mt-2 font-display text-3xl font-semibold text-on-surface">{noteComparison?.totalNotes ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-secondary/20 bg-secondary/10 p-4">
            <div className="text-xs text-on-surface-variant">Matched notes</div>
            <div className="mt-2 font-display text-3xl font-semibold text-on-surface">{noteComparison?.matchedNotes ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-tertiary/20 bg-tertiary/10 p-4">
            <div className="text-xs text-on-surface-variant">Unmatched notes</div>
            <div className="mt-2 font-display text-3xl font-semibold text-on-surface">{noteComparison?.unmatchedNotes ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-on-surface-variant">Agent-only issues</div>
            <div className="mt-2 font-display text-3xl font-semibold text-on-surface">{noteComparison?.agentOnlyIssues ?? 0}</div>
          </div>
        </div>
        {noteComparison && noteComparison.totalNotes > 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm text-on-surface-variant">
              {noteComparison.matchedNotes > 0
                ? `${noteComparison.matchedNotes} interviewer note${noteComparison.matchedNotes === 1 ? "" : "s"} align with the agent findings.`
                : "No interviewer notes aligned with the returned agent findings."}
            </div>
            {noteComparison.notes.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {noteComparison.notes.map((note) => (
                  <span
                    key={note.id}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      note.status === "matched"
                        ? "border-secondary/30 bg-secondary/10 text-secondary"
                        : "border-tertiary/30 bg-tertiary/10 text-tertiary"
                    }`}
                  >
                    {note.title}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-sm text-on-surface-variant">
            No interviewer notes were added for this run, so there is nothing to compare yet.
          </div>
        )}
      </Panel>

      <ReviewSummaryList issues={issues} reportingIds={reportingIds} onReportFault={onReportFault} onContinue={onContinue} />
    </div>
  );
}
