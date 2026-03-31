import { Button } from "@/components/common/Button";
import { CodeMarkerReviewCard, type MarkerReviewFileGroup } from "@/components/review-flow/CodeMarkerReviewCard";
import { EmptyStateBlock } from "@/components/review-flow/EmptyStateBlock";
import type { ReviewIssueViewModel } from "@/models/review.types";

interface CodeMarkerReviewListProps {
  issues: ReviewIssueViewModel[];
  commentingIds: string[];
  wrongResultIds: string[];
  suggestedLineFaultIds: string[];
  onBackToSummary: () => void;
  onOpenSurvey: () => void;
  onComment: (issue: ReviewIssueViewModel) => void;
  onMarkWrong: (issue: ReviewIssueViewModel) => void;
  onReportSuggestedLineFault: (
    issue: ReviewIssueViewModel,
    lineKey: string,
    lineText: string,
    suggestedLineNumber?: number,
  ) => void;
}

function groupIssuesByFile(issues: ReviewIssueViewModel[]): MarkerReviewFileGroup[] {
  const groups = new Map<string, MarkerReviewFileGroup>();

  issues.forEach((issue, index) => {
    const filePath = issue.filePath ?? `Unknown file ${index + 1}`;
    const existing = groups.get(filePath);

    if (existing) {
      existing.issues.push(issue);
      if (!existing.sourceFileContent && issue.sourceFileContent) {
        existing.sourceFileContent = issue.sourceFileContent;
      }
      return;
    }

    groups.set(filePath, {
      filePath,
      sourceFileContent: issue.sourceFileContent,
      issues: [issue],
    });
  });

  return [...groups.values()].sort((left, right) => left.filePath.localeCompare(right.filePath));
}

export function CodeMarkerReviewList({
  issues,
  commentingIds,
  wrongResultIds,
  suggestedLineFaultIds,
  onBackToSummary,
  onOpenSurvey,
  onComment,
  onMarkWrong,
  onReportSuggestedLineFault,
}: CodeMarkerReviewListProps) {
  if (issues.length === 0) {
    return (
      <EmptyStateBlock
        title="No marker review data"
        description="There are no issue details to render yet. Submit a review first, then this step will show the GitHub-like marker presentation."
      />
    );
  }

  const fileGroups = groupIssuesByFile(issues);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={onBackToSummary}>
          Back to Summary
        </Button>
        <Button size="sm" onClick={onOpenSurvey}>
          Open Survey
        </Button>
      </div>

      {fileGroups.map((group) => (
        <CodeMarkerReviewCard
          key={group.filePath}
          group={group}
          commentingIds={commentingIds}
          wrongResultIds={wrongResultIds}
          suggestedLineFaultIds={suggestedLineFaultIds}
          onComment={onComment}
          onMarkWrong={onMarkWrong}
          onReportSuggestedLineFault={onReportSuggestedLineFault}
        />
      ))}
    </div>
  );
}
