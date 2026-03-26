import { SearchX } from "lucide-react";
import { Finding, StakeholderRole } from "@/types/review";
import { FindingCard } from "@/components/results/FindingCard";
import { EmptyState } from "@/components/common/EmptyState";

interface FindingsListProps {
  findings: Finding[];
  role: StakeholderRole;
  onSelect: (findingId: string) => void;
}

export function FindingsList({ findings, role, onSelect }: FindingsListProps) {
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
      {findings.map((finding) => (
        <FindingCard key={finding.id} finding={finding} role={role} onSelect={onSelect} />
      ))}
    </div>
  );
}
