import { FindingConfidence, FindingSeverity } from "@/types/review";

export function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateValue));
}

export function formatDateTime(dateValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

const severityRank: Record<FindingSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const confidenceRank: Record<FindingConfidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function compareSeverity(left: FindingSeverity, right: FindingSeverity) {
  return severityRank[right] - severityRank[left];
}

export function compareConfidence(left: FindingConfidence, right: FindingConfidence) {
  return confidenceRank[right] - confidenceRank[left];
}

export function formatBytes(size?: number) {
  if (!size) {
    return "Text";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function titleCase(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (match) => match.toUpperCase())
    .trim();
}
