import { SearchX } from "lucide-react";
import { Button } from "@/components/common/Button";
import { DeveloperComment, Finding, StakeholderRole } from "@/types/review";
import { FindingCard } from "@/components/results/FindingCard";
import { EmptyState } from "@/components/common/EmptyState";

interface FindingsListProps {
  findings: Finding[];
  role: StakeholderRole;
  developerComments: DeveloperComment[];
  expandedIds: string[];
  onToggle: (findingId: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export function FindingsList({
  findings,
  role,
  developerComments,
  expandedIds,
  onToggle,
  onExpandAll,
  onCollapseAll,
}: FindingsListProps) {
  if (findings.length === 0) {
    return (
      <EmptyState
        icon={<SearchX className="size-6" />}
        title="No findings match the current filters"
        description="Adjust the selected agent, severity, or sort configuration to bring more findings back into view."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
            Detailed findings
          </div>
          <div className="mt-1 text-sm text-on-surface-variant">
            {findings.length} finding{findings.length === 1 ? "" : "s"} after filtering
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={onExpandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={onCollapseAll}>
            Collapse All
          </Button>
        </div>
      </div>
      {findings.map((finding) => (
        <FindingCard
          key={finding.id}
          finding={finding}
          role={role}
          expanded={expandedIds.includes(finding.id)}
          relatedComments={developerComments.filter((comment) => finding.relatedCommentIds.includes(comment.id))}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
