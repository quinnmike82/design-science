import { Panel } from "@/components/common/Panel";
import { CodeMarkerReviewList } from "@/components/review-flow/CodeMarkerReviewList";
import type { ReviewIssueViewModel, ReviewResultViewModel } from "@/models/review.types";

interface Step3MarkerReviewSectionProps {
  result?: ReviewResultViewModel;
  commentingIds: string[];
  wrongResultIds: string[];
  suggestedLineFaultIds: string[];
  onBackToSummary: () => void;
  onOpenSurvey: () => void;
  onOpenComment: (issue: ReviewIssueViewModel) => void;
  onOpenWrongResult: (issue: ReviewIssueViewModel) => void;
  onOpenSuggestedLineFault: (
    issue: ReviewIssueViewModel,
    lineKey: string,
    lineText: string,
    suggestedLineNumber?: number,
  ) => void;
}

export function Step3MarkerReviewSection({
  result,
  commentingIds,
  wrongResultIds,
  suggestedLineFaultIds,
  onBackToSummary,
  onOpenSurvey,
  onOpenComment,
  onOpenWrongResult,
  onOpenSuggestedLineFault,
}: Step3MarkerReviewSectionProps) {
  return (
    <div className="space-y-6">
      <Panel className="space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">Code marker / replacement review</div>
        <h2 className="font-display text-3xl font-semibold text-on-surface">GitHub-like review detail</h2>
        <p className="max-w-4xl text-sm leading-7 text-on-surface-variant">
          Step 3 now combines all flagged line changes back into the original file view, so reviewers can scan the code once, inspect the red and green rows, and only report faulty suggestions where needed.
        </p>
      </Panel>

      <CodeMarkerReviewList
        issues={result?.issues ?? []}
        commentingIds={commentingIds}
        wrongResultIds={wrongResultIds}
        suggestedLineFaultIds={suggestedLineFaultIds}
        onBackToSummary={onBackToSummary}
        onOpenSurvey={onOpenSurvey}
        onComment={onOpenComment}
        onMarkWrong={onOpenWrongResult}
        onReportSuggestedLineFault={onOpenSuggestedLineFault}
      />
    </div>
  );
}
