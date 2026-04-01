import { Button } from "@/components/common/Button";
import { CodeMarkerReviewCard, type MarkerReviewFileGroup } from "@/components/review-flow/CodeMarkerReviewCard";
import { EmptyStateBlock } from "@/components/review-flow/EmptyStateBlock";
import type { ReviewInputFile, ReviewIssueViewModel, ReviewPhaseFinding } from "@/models/review.types";

interface CodeMarkerReviewListProps {
  issues: ReviewIssueViewModel[];
  submittedFiles: ReviewInputFile[];
  phase3Findings: ReviewPhaseFinding[];
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
  onAddPhase3Finding: (finding: Omit<ReviewPhaseFinding, "id" | "createdAt" | "sourcePhase">) => void;
  onRemovePhase3Finding: (findingId: string) => void;
}

function groupIssuesByFile(issues: ReviewIssueViewModel[], submittedFiles: ReviewInputFile[]): MarkerReviewFileGroup[] {
  const groups = new Map<string, MarkerReviewFileGroup>();
  const submittedFileMap = new Map(submittedFiles.map((file) => [file.name, file.content]));

  issues.forEach((issue, index) => {
    const filePath = issue.filePath ?? `Unknown file ${index + 1}`;
    const existing = groups.get(filePath);

    if (existing) {
      existing.issues.push(issue);
      if (!existing.sourceFileContent) {
        existing.sourceFileContent = issue.sourceFileContent ?? submittedFileMap.get(filePath);
      }
      return;
    }

    groups.set(filePath, {
      filePath,
      sourceFileContent: issue.sourceFileContent ?? submittedFileMap.get(filePath),
      issues: [issue],
    });
  });

  return [...groups.values()].sort((left, right) => left.filePath.localeCompare(right.filePath));
}

export function CodeMarkerReviewList({
  issues,
  submittedFiles,
  phase3Findings,
  commentingIds,
  wrongResultIds,
  suggestedLineFaultIds,
  onBackToSummary,
  onOpenSurvey,
  onComment,
  onMarkWrong,
  onReportSuggestedLineFault,
  onAddPhase3Finding,
  onRemovePhase3Finding,
}: CodeMarkerReviewListProps) {
  if (issues.length === 0) {
    return (
      <EmptyStateBlock
        title="No marker review data"
        description="There are no issue details to render yet. Submit a review first, then this phase will show the GitHub-like marker presentation."
      />
    );
  }

  const fileGroups = groupIssuesByFile(issues, submittedFiles);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={onBackToSummary}>
          Back to Summary Phase
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
          phase3Findings={phase3Findings.filter((finding) => finding.filePath === group.filePath)}
          onComment={onComment}
          onMarkWrong={onMarkWrong}
          onReportSuggestedLineFault={onReportSuggestedLineFault}
          onAddPhase3Finding={onAddPhase3Finding}
          onRemovePhase3Finding={onRemovePhase3Finding}
        />
      ))}
    </div>
  );
}
