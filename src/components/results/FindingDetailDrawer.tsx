import { Finding, StakeholderRole } from "@/types/review";

interface FindingDetailDrawerProps {
  finding: Finding | null;
  role: StakeholderRole;
  onClose: () => void;
}

export function FindingDetailDrawer({ finding }: FindingDetailDrawerProps) {
  return finding ? null : null;
}
