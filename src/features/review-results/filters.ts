import { Finding, FindingSortOption, ResultsFilters } from "@/types/review";
import { compareConfidence, compareSeverity } from "@/utils/format";

export function filterAndSortFindings(findings: Finding[], filters: ResultsFilters) {
  return findings
    .filter((finding) => filters.agentId === "all" || finding.agentId === filters.agentId)
    .filter((finding) => filters.severity === "all" || finding.severity === filters.severity)
    .sort((left, right) => sortFindings(left, right, filters.sortBy));
}

function sortFindings(left: Finding, right: Finding, sortBy: FindingSortOption) {
  switch (sortBy) {
    case "severity":
      return compareSeverity(left.severity, right.severity);
    case "confidence":
      return compareConfidence(left.confidence, right.confidence);
    case "agent":
      return left.agentId.localeCompare(right.agentId);
    case "filePath":
      return (left.filePath ?? "zzzz").localeCompare(right.filePath ?? "zzzz");
  }
}
