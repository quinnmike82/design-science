import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/common/Button";
import { EmptyStateBlock } from "@/components/review-flow/EmptyStateBlock";
import { ReviewIssueCard } from "@/components/review-flow/ReviewIssueCard";
import type { ReviewIssueViewModel } from "@/models/review.types";

interface ReviewSummaryListProps {
  issues: ReviewIssueViewModel[];
  reportingIds: string[];
  onReportFault: (issueId: string) => void;
  onContinue: () => void;
}

export function ReviewSummaryList({ issues, reportingIds, onReportFault, onContinue }: ReviewSummaryListProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const allExpanded = useMemo(() => issues.length > 0 && expandedIds.length === issues.length, [expandedIds.length, issues.length]);

  if (issues.length === 0) {
    return (
      <EmptyStateBlock
        title="No issues returned"
        description="The review completed without any findings. You can still proceed to the marker review step if you want to inspect the fallback presentation."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-on-surface-variant">
          {issues.length} issue{issues.length === 1 ? "" : "s"} returned
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedIds(allExpanded ? [] : issues.map((issue) => issue.id))}
          >
            {allExpanded ? "Collapse all" : "Expand all"}
          </Button>
          <Button size="sm" onClick={onContinue}>
            Continue to Marker Review
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      {issues.map((issue) => {
        const expanded = expandedIds.includes(issue.id);
        return (
          <ReviewIssueCard
            key={issue.id}
            issue={issue}
            expanded={expanded}
            reportLoading={reportingIds.includes(issue.id)}
            onToggle={() =>
              setExpandedIds((current) =>
                current.includes(issue.id) ? current.filter((id) => id !== issue.id) : [...current, issue.id],
              )
            }
            onReportFault={() => onReportFault(issue.id)}
          />
        );
      })}
    </div>
  );
}
