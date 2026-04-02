import { useMemo, useState } from "react";
import { AlertTriangle, ChevronsDownUp, ChevronsUpDown, MessageSquare } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Panel } from "@/components/common/Panel";
import { Phase3FindingPanel } from "@/components/review-flow/Phase3FindingPanel";
import { WrongResultAction } from "@/components/review-flow/WrongResultAction";
import type { ReviewIssueViewModel, ReviewPhaseFinding } from "@/models/review.types";
import { cn } from "@/utils/cn";

export interface MarkerReviewFileGroup {
  filePath: string;
  sourceFileContent?: string;
  issues: ReviewIssueViewModel[];
}

type SuggestedLineReport = ReviewIssueViewModel["feedback"]["suggestedLineReports"][number];

type FileDiffRow = {
  key: string;
  type: "context" | "removed" | "added";
  text: string;
  oldNumber?: number;
  newNumber?: number;
  issue?: ReviewIssueViewModel;
  lineKey?: string;
  suggestedLineNumber?: number;
  reportedFault?: SuggestedLineReport;
};

interface NormalizedIssueChange {
  issue: ReviewIssueViewModel;
  targetIndex?: number;
  removedLines: string[];
  addedLines: string[];
  usedFrontendGeneratedReplacement: boolean;
}

const severityToneMap = {
  critical: "border-error/30 bg-error/10 text-error",
  high: "border-tertiary/30 bg-tertiary/10 text-tertiary",
  medium: "border-secondary/30 bg-secondary/10 text-secondary",
  low: "border-white/15 bg-white/5 text-on-surface-variant",
} as const;

const faultTypeLabels = {
  incorrect_fix: "Incorrect fix",
  wrong_logic: "Wrong logic",
  unsafe_change: "Unsafe change",
  not_applicable: "Not applicable",
  other: "Other",
} as const;

function splitCodeLines(value?: string) {
  if (value === undefined) {
    return [];
  }

  const normalized = value.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  if (lines.length > 1 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines;
}

function looksLikeCodeSnippet(text: string) {
  const trimmed = text.trim();
  return /[=;{}()[\].]/.test(trimmed) || /\b(return|const|let|var|await|throw|if|else|process\.env|new)\b/.test(trimmed);
}

function inferSecretEnvVar(issue: ReviewIssueViewModel, line: string) {
  const signal = `${issue.title} ${issue.suggestion ?? ""} ${line}`.toLowerCase();
  if (signal.includes("jwt")) {
    return "JWT_SECRET";
  }
  if (signal.includes("api") && signal.includes("key")) {
    return "API_KEY";
  }
  if (signal.includes("token")) {
    return "ACCESS_TOKEN";
  }
  return "APP_SECRET";
}

function generateReplacementLine(issue: ReviewIssueViewModel, line: string) {
  const indent = line.match(/^\s*/)?.[0] ?? "";
  const suggestion = issue.suggestion?.trim() ?? "";
  const title = issue.title.trim();

  if (/eval\s*\(/.test(line)) {
    return line.replace(/eval\s*\((.+)\)/, "safeEvaluate($1)");
  }

  if (/res\.redirect\s*\((.+)\)/.test(line)) {
    return line.replace(/res\.redirect\s*\((.+)\)/, "res.redirect(getValidatedRedirectTarget($1))");
  }

  if (/window\.location\s*=/.test(line)) {
    return line.replace(/window\.location\s*=\s*(.+)/, "window.location = getValidatedRedirectTarget($1)");
  }

  if (/\bany\b/.test(line)) {
    return line.replace(/\bany\b/g, "SpecificType");
  }

  if (/(jwt|secret|api[_-]?key|token)/i.test(`${title} ${suggestion} ${line}`)) {
    const quotedAssignment = line.match(/^(\s*[\w$.]+\s*=\s*)(['"`]).+\2(.*)$/);
    if (quotedAssignment) {
      return `${quotedAssignment[1]}process.env.${inferSecretEnvVar(issue, line)} ?? ""${quotedAssignment[3]}`;
    }
  }

  if (/TODO|FIXME/.test(line)) {
    return `${indent}// Follow-up moved to tracked review task`;
  }

  const replaceMatch = suggestion.match(/replace\s+`([^`]+)`\s+with\s+`([^`]+)`/i);
  if (replaceMatch && line.includes(replaceMatch[1])) {
    return line.split(replaceMatch[1]).join(replaceMatch[2]);
  }

  if (suggestion) {
    if (looksLikeCodeSnippet(suggestion)) {
      return `${indent}${suggestion.replace(/\.$/, "")}`;
    }
    return `${indent}// FE-generated fix: ${suggestion}`;
  }

  return `${indent}// FE-generated fix for ${title}`;
}

function generateReplacementLines(issue: ReviewIssueViewModel) {
  const originalLines = splitCodeLines(issue.originalSnippet);

  if (originalLines.length > 0) {
    return originalLines.map((line) => generateReplacementLine(issue, line));
  }

  if (issue.suggestion?.trim()) {
    return looksLikeCodeSnippet(issue.suggestion)
      ? [issue.suggestion.replace(/\.$/, "")]
      : [`// FE-generated fix: ${issue.suggestion.trim()}`];
  }

  return [`// FE-generated fix for ${issue.title}`];
}

function getSafeFeedback(issue: ReviewIssueViewModel) {
  return {
    reportedFault: issue.feedback?.reportedFault,
    comments: Array.isArray(issue.feedback?.comments) ? issue.feedback.comments : [],
    wrongResult: issue.feedback?.wrongResult,
    suggestedLineReports: Array.isArray(issue.feedback?.suggestedLineReports)
      ? issue.feedback.suggestedLineReports
      : [],
  };
}

function resolveTargetIndex(issue: ReviewIssueViewModel, sourceLines: string[]) {
  if (issue.lineNumber && issue.lineNumber > 0 && issue.lineNumber <= sourceLines.length) {
    return issue.lineNumber - 1;
  }

  const firstOriginalLine = splitCodeLines(issue.originalSnippet)[0]?.trim();
  if (!firstOriginalLine) {
    return undefined;
  }

  const matchedIndex = sourceLines.findIndex((line) => line.trim() === firstOriginalLine);
  return matchedIndex >= 0 ? matchedIndex : undefined;
}

type VisibleDiffRow =
  | { type: "row"; row: FileDiffRow }
  | {
      type: "collapsed-context";
      key: string;
      hiddenCount: number;
      startLine?: number;
      endLine?: number;
    };

function isCollapsibleContextRow(row: FileDiffRow) {
  return row.type === "context" && row.oldNumber !== undefined && row.newNumber !== undefined;
}

function buildVisibleRows(rows: FileDiffRow[], showUnchangedLines: boolean): VisibleDiffRow[] {
  if (showUnchangedLines) {
    return rows.map((row) => ({
      type: "row",
      row,
    }));
  }

  const visibleRows: VisibleDiffRow[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (!isCollapsibleContextRow(row)) {
      visibleRows.push({
        type: "row",
        row,
      });
      continue;
    }

    const startIndex = index;
    while (index + 1 < rows.length && isCollapsibleContextRow(rows[index + 1])) {
      index += 1;
    }

    const hiddenRows = rows.slice(startIndex, index + 1);
    visibleRows.push({
      type: "collapsed-context",
      key: `collapsed-${hiddenRows[0].key}`,
      hiddenCount: hiddenRows.length,
      startLine: hiddenRows[0].newNumber,
      endLine: hiddenRows[hiddenRows.length - 1].newNumber,
    });
  }

  return visibleRows;
}

function getCollapsedContextKeys(rows: FileDiffRow[]) {
  const keys: string[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (!isCollapsibleContextRow(row)) {
      continue;
    }

    const startIndex = index;
    while (index + 1 < rows.length && isCollapsibleContextRow(rows[index + 1])) {
      index += 1;
    }

    const hiddenRows = rows.slice(startIndex, index + 1);
    keys.push(`collapsed-${hiddenRows[0].key}`);
  }

  return keys;
}

function buildVisibleRowsWithExpandedSections(rows: FileDiffRow[], expandedContextKeys: string[]): VisibleDiffRow[] {
  const expandedKeys = new Set(expandedContextKeys);
  const visibleRows: VisibleDiffRow[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (!isCollapsibleContextRow(row)) {
      visibleRows.push({
        type: "row",
        row,
      });
      continue;
    }

    const startIndex = index;
    while (index + 1 < rows.length && isCollapsibleContextRow(rows[index + 1])) {
      index += 1;
    }

    const hiddenRows = rows.slice(startIndex, index + 1);
    const collapsedKey = `collapsed-${hiddenRows[0].key}`;

    if (expandedKeys.has(collapsedKey)) {
      hiddenRows.forEach((hiddenRow) => {
        visibleRows.push({
          type: "row",
          row: hiddenRow,
        });
      });
      continue;
    }

    visibleRows.push({
      type: "collapsed-context",
      key: collapsedKey,
      hiddenCount: hiddenRows.length,
      startLine: hiddenRows[0].newNumber,
      endLine: hiddenRows[hiddenRows.length - 1].newNumber,
    });
  }

  return visibleRows;
}

function normalizeIssueChanges(group: MarkerReviewFileGroup, sourceLines: string[]) {
  return group.issues
    .map<NormalizedIssueChange>((issue) => {
      const replacementLines = splitCodeLines(issue.replacementSnippet);
      const addedLines = replacementLines.length > 0 ? replacementLines : generateReplacementLines(issue);
      return {
        issue,
        targetIndex: resolveTargetIndex(issue, sourceLines),
        removedLines: splitCodeLines(issue.originalSnippet),
        addedLines,
        usedFrontendGeneratedReplacement: replacementLines.length === 0,
      };
    })
    .sort((left, right) => {
      const leftValue = left.targetIndex ?? Number.MAX_SAFE_INTEGER;
      const rightValue = right.targetIndex ?? Number.MAX_SAFE_INTEGER;
      return leftValue - rightValue;
    });
}

function buildFileDiffRows(group: MarkerReviewFileGroup) {
  const sourceLines = splitCodeLines(group.sourceFileContent ?? group.issues.find((issue) => issue.sourceFileContent)?.sourceFileContent);
  const changes = normalizeIssueChanges(group, sourceLines);
  const resolvedChanges = changes.filter((change) => change.targetIndex !== undefined);
  const unresolvedChanges = changes.filter((change) => change.targetIndex === undefined);
  const rows: FileDiffRow[] = [];
  const targetGroups = new Map<number, NormalizedIssueChange[]>();

  resolvedChanges.forEach((change) => {
    const key = change.targetIndex!;
    const bucket = targetGroups.get(key);
    if (bucket) {
      bucket.push(change);
    } else {
      targetGroups.set(key, [change]);
    }
  });

  if (sourceLines.length === 0) {
    changes.forEach((change, changeIndex) => {
      const feedback = getSafeFeedback(change.issue);
      const removedLines = change.removedLines.length > 0 ? change.removedLines : ["// Source preview unavailable"];
      removedLines.forEach((line, lineIndex) => {
        rows.push({
          key: `unmapped-removed-${changeIndex + 1}-${lineIndex + 1}`,
          type: "removed",
          text: line,
          oldNumber: change.issue.lineNumber ? change.issue.lineNumber + lineIndex : undefined,
        });
      });

      change.addedLines.forEach((line, addedIndex) => {
        const lineKey = `${change.issue.id}-fallback-added-${addedIndex + 1}`;
        rows.push({
          key: `unmapped-added-${change.issue.id}-${addedIndex + 1}`,
          type: "added",
          text: line,
          newNumber: change.issue.lineNumber ? change.issue.lineNumber + addedIndex : undefined,
          issue: change.issue,
          lineKey,
          suggestedLineNumber: change.issue.lineNumber ? change.issue.lineNumber + addedIndex : undefined,
          reportedFault: feedback.suggestedLineReports.find((report) => report.lineKey === lineKey),
        });
      });
    });

    return {
      rows,
      usedFrontendGeneratedReplacement: changes.some((change) => change.usedFrontendGeneratedReplacement),
      unresolvedChangesCount: unresolvedChanges.length,
      sourceAvailable: false,
    };
  }

  let sourceIndex = 0;
  let oldNumber = 1;
  let newNumber = 1;
  const sortedTargetIndexes = [...targetGroups.keys()].sort((left, right) => left - right);

  sortedTargetIndexes.forEach((targetIndex) => {
    while (sourceIndex < targetIndex) {
      rows.push({
        key: `context-${sourceIndex + 1}`,
        type: "context",
        text: sourceLines[sourceIndex],
        oldNumber,
        newNumber,
      });
      sourceIndex += 1;
      oldNumber += 1;
      newNumber += 1;
    }

    const groupChanges = targetGroups.get(targetIndex) ?? [];
    const removedLineCount = Math.max(
      1,
      ...groupChanges.map((change) => Math.max(1, change.removedLines.length || 1)),
    );

    for (let removedIndex = 0; removedIndex < removedLineCount; removedIndex += 1) {
      rows.push({
        key: `removed-${targetIndex + 1}-${removedIndex + 1}`,
        type: "removed",
        text:
          sourceLines[sourceIndex + removedIndex] ??
          groupChanges[0]?.removedLines[removedIndex] ??
          "",
        oldNumber,
      });
      oldNumber += 1;
    }

    sourceIndex += removedLineCount;

    groupChanges.forEach((change) => {
      const feedback = getSafeFeedback(change.issue);
      change.addedLines.forEach((line, addedIndex) => {
        const suggestedLineNumber = newNumber;
        const lineKey = `${targetIndex + 1}-added-${change.issue.id}-${addedIndex + 1}`;
        rows.push({
          key: `added-${change.issue.id}-${targetIndex + 1}-${addedIndex + 1}`,
          type: "added",
          text: line,
          newNumber,
          issue: change.issue,
          lineKey,
          suggestedLineNumber,
          reportedFault: feedback.suggestedLineReports.find((report) => report.lineKey === lineKey),
        });
        newNumber += 1;
      });
    });
  });

  while (sourceIndex < sourceLines.length) {
    rows.push({
      key: `context-${sourceIndex + 1}`,
      type: "context",
      text: sourceLines[sourceIndex],
      oldNumber,
      newNumber,
    });
    sourceIndex += 1;
    oldNumber += 1;
    newNumber += 1;
  }

  if (unresolvedChanges.length > 0) {
    rows.push({
      key: "unresolved-divider",
      type: "context",
      text: "// Additional unmapped review suggestions",
    });

    unresolvedChanges.forEach((change, changeIndex) => {
      const feedback = getSafeFeedback(change.issue);
      const removedLines = change.removedLines.length > 0 ? change.removedLines : ["// Original line could not be mapped"];

      removedLines.forEach((line, lineIndex) => {
        rows.push({
          key: `unresolved-removed-${change.issue.id}-${lineIndex + 1}`,
          type: "removed",
          text: line,
          oldNumber: change.issue.lineNumber ? change.issue.lineNumber + lineIndex : undefined,
        });
      });

      change.addedLines.forEach((line, addedIndex) => {
        const lineKey = `unresolved-added-${change.issue.id}-${addedIndex + 1}`;
        rows.push({
          key: `unresolved-added-${change.issue.id}-${addedIndex + 1}`,
          type: "added",
          text: line,
          issue: change.issue,
          lineKey,
          suggestedLineNumber: change.issue.lineNumber ? change.issue.lineNumber + addedIndex : undefined,
          reportedFault: feedback.suggestedLineReports.find((report) => report.lineKey === lineKey),
        });
      });

      if (changeIndex < unresolvedChanges.length - 1) {
        rows.push({
          key: `unresolved-gap-${change.issue.id}`,
          type: "context",
          text: "// ---",
        });
      }
    });
  }

  return {
    rows,
    usedFrontendGeneratedReplacement: changes.some((change) => change.usedFrontendGeneratedReplacement),
    unresolvedChangesCount: unresolvedChanges.length,
    sourceAvailable: true,
  };
}

function getPhase3FindingSelectableLine(row: FileDiffRow) {
  if (row.type === "added") {
    return undefined;
  }

  return row.oldNumber ?? row.newNumber;
}

interface CodeMarkerReviewCardProps {
  group: MarkerReviewFileGroup;
  phase3Findings: ReviewPhaseFinding[];
  commentingIds: string[];
  wrongResultIds: string[];
  suggestedLineFaultIds: string[];
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

export function CodeMarkerReviewCard({
  group,
  phase3Findings,
  commentingIds,
  wrongResultIds,
  suggestedLineFaultIds,
  onComment,
  onMarkWrong,
  onReportSuggestedLineFault,
  onAddPhase3Finding,
  onRemovePhase3Finding,
}: CodeMarkerReviewCardProps) {
  const diff = buildFileDiffRows(group);
  const issueCountLabel = `${group.issues.length} flagged change${group.issues.length === 1 ? "" : "s"}`;
  const collapsedContextKeys = useMemo(() => getCollapsedContextKeys(diff.rows), [diff.rows]);
  const [expandedContextKeys, setExpandedContextKeys] = useState<string[]>([]);
  const [phase3FindingSelectionStart, setPhase3FindingSelectionStart] = useState<number | undefined>();
  const [phase3FindingSelectionEnd, setPhase3FindingSelectionEnd] = useState<number | undefined>();
  const [isPhase3FindingRangeSelecting, setIsPhase3FindingRangeSelecting] = useState(false);
  const allContextSectionsExpanded =
    collapsedContextKeys.length > 0 && collapsedContextKeys.every((key) => expandedContextKeys.includes(key));
  const visibleRows = useMemo(
    () =>
      allContextSectionsExpanded
        ? buildVisibleRows(diff.rows, true)
        : buildVisibleRowsWithExpandedSections(diff.rows, expandedContextKeys),
    [allContextSectionsExpanded, diff.rows, expandedContextKeys],
  );
  const hasCollapsedContext = visibleRows.some((row) => row.type === "collapsed-context");
  const canSelectPhase3FindingLines = diff.rows.some((row) => getPhase3FindingSelectableLine(row) !== undefined);
  const selectedPhase3FindingRange = useMemo(() => {
    if (!phase3FindingSelectionStart) {
      return undefined;
    }

    const end = phase3FindingSelectionEnd ?? phase3FindingSelectionStart;
    return {
      start: Math.min(phase3FindingSelectionStart, end),
      end: Math.max(phase3FindingSelectionStart, end),
    };
  }, [phase3FindingSelectionEnd, phase3FindingSelectionStart]);

  const clearPhase3FindingSelection = () => {
    setPhase3FindingSelectionStart(undefined);
    setPhase3FindingSelectionEnd(undefined);
    setIsPhase3FindingRangeSelecting(false);
  };

  const handleSelectPhase3FindingLine = (lineNumber: number) => {
    if (!phase3FindingSelectionStart || !isPhase3FindingRangeSelecting) {
      setPhase3FindingSelectionStart(lineNumber);
      setPhase3FindingSelectionEnd(lineNumber);
      setIsPhase3FindingRangeSelecting(true);
      return;
    }

    setPhase3FindingSelectionEnd(lineNumber);
    setIsPhase3FindingRangeSelecting(false);
  };

  const handlePreviewPhase3FindingLine = (lineNumber: number) => {
    if (!phase3FindingSelectionStart || !isPhase3FindingRangeSelecting) {
      return;
    }

    setPhase3FindingSelectionEnd(lineNumber);
  };

  const handleAddPhase3Finding = (finding: Omit<ReviewPhaseFinding, "id" | "createdAt" | "sourcePhase">) => {
    onAddPhase3Finding(finding);
    clearPhase3FindingSelection();
  };

  return (
    <Panel className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
            Phase 3 · Step 2
          </div>
          <h3 className="mt-2 font-display text-2xl font-semibold text-on-surface">File-level marker review</h3>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            All highlighted changes for this file are merged into one review box so the reviewer can read the full code
            once and flag faulty suggestions only where needed. File: {group.filePath}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-on-surface-variant">
            {issueCountLabel}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedContextKeys(allContextSectionsExpanded ? [] : collapsedContextKeys)}
          >
            {allContextSectionsExpanded ? <ChevronsDownUp className="size-4" /> : <ChevronsUpDown className="size-4" />}
            {allContextSectionsExpanded ? "Collapse Unchanged Lines" : "Expand Unchanged Lines"}
          </Button>
          {diff.unresolvedChangesCount > 0 ? (
            <span className="rounded-full border border-tertiary/25 bg-tertiary/10 px-3 py-1 text-xs text-tertiary">
              {diff.unresolvedChangesCount} unmapped
            </span>
          ) : null}
        </div>
      </div>

      <section
        aria-label={`Combined file review for ${group.filePath}`}
        className="rounded-3xl border border-white/10 bg-surface-low/80"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
              Combined File Review
            </div>
            <p className="mt-1 text-sm text-on-surface-variant">
              Red rows show the current code being replaced. Green rows show the review suggestion inserted back into
              the same file view.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-on-surface-variant">
            {group.filePath}
          </div>
        </div>

        <div className="grid xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <div className="min-w-0 overflow-x-auto">
            <div className="min-w-[980px]">
            <div className="grid grid-cols-[72px_72px_minmax(0,1fr)_260px] border-b border-white/10 bg-black/20 text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
              <div className="px-3 py-3 text-right">Old</div>
              <div className="px-3 py-3 text-right">New</div>
              <div className="px-4 py-3">Code</div>
              <div className="px-4 py-3">Reviewer Action</div>
            </div>

              {visibleRows.map((visibleRow) => {
              if (visibleRow.type === "collapsed-context") {
                return (
                  <div
                    key={visibleRow.key}
                    className="grid grid-cols-[72px_72px_minmax(0,1fr)_260px] border-b border-white/5 bg-white/5 text-xs text-on-surface-variant"
                  >
                    <div className="col-span-4 px-4 py-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-medium hover:border-white/20 hover:text-on-surface"
                        onClick={() =>
                          setExpandedContextKeys((current) =>
                            current.includes(visibleRow.key) ? current : [...current, visibleRow.key],
                          )
                        }
                      >
                        <ChevronsUpDown className="size-4" />
                        {`Show ${visibleRow.hiddenCount} unchanged line${visibleRow.hiddenCount === 1 ? "" : "s"}${
                          visibleRow.startLine && visibleRow.endLine
                            ? ` (${visibleRow.startLine}-${visibleRow.endLine})`
                            : ""
                        }`}
                      </button>
                    </div>
                  </div>
                );
              }

              const row = visibleRow.row;
              const isReported = Boolean(row.reportedFault);
              const loadingId = row.issue && row.lineKey ? `${row.issue.id}:${row.lineKey}` : "";
              const isLoading = row.issue && row.lineKey ? suggestedLineFaultIds.includes(loadingId) : false;
              const selectableLineNumber = getPhase3FindingSelectableLine(row);
              const selectionColumn = row.type === "removed" ? "old" : "new";
              const isPhase3FindingSelected =
                selectableLineNumber !== undefined && selectedPhase3FindingRange
                  ? selectableLineNumber >= selectedPhase3FindingRange.start &&
                    selectableLineNumber <= selectedPhase3FindingRange.end
                  : false;

              return (
                <div
                  key={row.key}
                  className={cn(
                    "grid grid-cols-[72px_72px_minmax(0,1fr)_260px] border-b border-white/5 font-mono text-xs leading-6",
                    row.type === "removed" && "bg-error/10 text-[#ffd4dc]",
                    row.type === "added" && "bg-emerald-500/10 text-emerald-100",
                    row.type === "context" && "bg-transparent text-on-surface",
                    isPhase3FindingSelected && "ring-1 ring-inset ring-primary/40",
                  )}
                >
                  <div className="px-3 py-2 text-right text-on-surface-variant/80">
                    {selectionColumn === "old" && selectableLineNumber !== undefined ? (
                      <button
                        type="button"
                        aria-label={`Select phase 3 line ${selectableLineNumber}`}
                        className={cn(
                          "rounded px-1 transition-colors hover:text-on-surface",
                          isPhase3FindingSelected ? "text-primary" : "text-on-surface-variant/80",
                        )}
                        onClick={() => handleSelectPhase3FindingLine(selectableLineNumber)}
                        onMouseEnter={() => handlePreviewPhase3FindingLine(selectableLineNumber)}
                      >
                        {row.oldNumber ?? selectableLineNumber}
                      </button>
                    ) : (
                      row.oldNumber ?? ""
                    )}
                  </div>
                  <div className="px-3 py-2 text-right text-on-surface-variant/80">
                    {selectionColumn === "new" && selectableLineNumber !== undefined ? (
                      <button
                        type="button"
                        aria-label={`Select phase 3 line ${selectableLineNumber}`}
                        className={cn(
                          "rounded px-1 transition-colors hover:text-on-surface",
                          isPhase3FindingSelected ? "text-primary" : "text-on-surface-variant/80",
                        )}
                        onClick={() => handleSelectPhase3FindingLine(selectableLineNumber)}
                        onMouseEnter={() => handlePreviewPhase3FindingLine(selectableLineNumber)}
                      >
                        {row.newNumber ?? selectableLineNumber}
                      </button>
                    ) : (
                      row.newNumber ?? ""
                    )}
                  </div>
                  <div className="px-4 py-2">
                    {selectableLineNumber !== undefined ? (
                      <button
                        type="button"
                        aria-label={`Anchor phase 3 line ${selectableLineNumber} from code`}
                        className={cn(
                          "block w-full rounded px-1 py-0.5 text-left transition-colors hover:bg-white/5",
                          isPhase3FindingSelected && "bg-primary/10",
                        )}
                        onClick={() => handleSelectPhase3FindingLine(selectableLineNumber)}
                        onMouseEnter={() => handlePreviewPhase3FindingLine(selectableLineNumber)}
                      >
                        <code className="block select-text whitespace-pre-wrap break-words">
                          {row.type === "removed" ? "- " : row.type === "added" ? "+ " : "  "}
                          {row.text || " "}
                        </code>
                      </button>
                    ) : (
                      <code className="block select-text whitespace-pre-wrap break-words">
                        {row.type === "removed" ? "- " : row.type === "added" ? "+ " : "  "}
                        {row.text || " "}
                      </code>
                    )}
                  </div>
                  <div className="flex items-center justify-end px-4 py-2">
                    {row.type === "added" && row.issue && row.lineKey ? (
                      <div className="flex w-full items-center justify-between gap-3">
                        <div className="text-[11px] leading-5 text-emerald-100/90">{row.issue.title}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoading || isReported}
                          className={cn(
                            "shrink-0 border",
                            isReported
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                              : "border-emerald-400/20 bg-black/20 text-emerald-100 hover:bg-emerald-500/10",
                          )}
                          aria-label={
                            isReported
                              ? `Fault reported for suggested line ${row.suggestedLineNumber ?? "unknown"}`
                              : `Report fault for suggested line ${row.suggestedLineNumber ?? "unknown"}`
                          }
                          onClick={() =>
                            onReportSuggestedLineFault(
                              row.issue!,
                              row.lineKey!,
                              row.text,
                              row.suggestedLineNumber,
                            )
                          }
                        >
                          <AlertTriangle className="size-4" />
                          {isLoading ? "Saving..." : isReported ? "Fault Reported" : "Report Fault"}
                        </Button>
                      </div>
                    ) : row.type === "removed" ? (
                      <span className="text-[11px] text-on-surface-variant/70">Current line removed</span>
                    ) : (
                      <span className="text-[11px] text-on-surface-variant/70" />
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          </div>

          <aside className="border-t border-white/10 bg-black/10 xl:border-l xl:border-t-0">
            <div className="p-4 xl:sticky xl:top-6">
              <Phase3FindingPanel
                filePath={group.filePath}
                canSelectLines={canSelectPhase3FindingLines}
                findings={phase3Findings}
                isRangeSelecting={isPhase3FindingRangeSelecting}
                selectedRange={selectedPhase3FindingRange}
                onAddFinding={handleAddPhase3Finding}
                onRemoveFinding={onRemovePhase3Finding}
                onClearSelection={clearPhase3FindingSelection}
              />
            </div>
          </aside>
        </div>
      </section>

      {!diff.sourceAvailable || diff.unresolvedChangesCount > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-on-surface-variant">
          {!diff.sourceAvailable
            ? "The backend did not provide the source file contents, so the review is rendered with the best available before/after rows."
            : "Some suggestions could not be mapped to an exact source line, so they were appended at the bottom of the same file review box."}
        </div>
      ) : null}

      {!allContextSectionsExpanded && hasCollapsedContext ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-on-surface-variant">
          Unchanged lines are collapsed by default to keep the review focused on modified rows. Use
          {" "}
          <span className="font-medium text-on-surface">Expand Unchanged Lines</span>
          {" "}
          to inspect the full file.
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
            Phase 3 · Step 3
          </div>
          <div className="text-xs text-on-surface-variant">
            Compact actions only. Issue descriptions stay in the summary phase.
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {group.issues
            .slice()
            .sort((left, right) => (left.lineNumber ?? Number.MAX_SAFE_INTEGER) - (right.lineNumber ?? Number.MAX_SAFE_INTEGER))
            .map((issue) => {
              const feedback = getSafeFeedback(issue);
              return (
                <div
                  key={issue.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-surface-low/70 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
                          severityToneMap[issue.severity],
                        )}
                      >
                        {issue.severity}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-on-surface-variant">
                        {issue.locationLabel}
                      </span>
                      {issue.roleName ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-on-surface-variant">
                          {issue.roleName}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm font-medium text-on-surface">{issue.title}</div>
                    {feedback.comments.length > 0 ? (
                      <div className="text-xs text-on-surface-variant">
                        {feedback.comments.length} saved comment{feedback.comments.length === 1 ? "" : "s"}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={commentingIds.includes(issue.id)}
                      onClick={() => onComment(issue)}
                    >
                      <MessageSquare className="size-4" />
                      {commentingIds.includes(issue.id) ? "Saving..." : "Comment"}
                    </Button>
                    <WrongResultAction
                      marked={Boolean(feedback.wrongResult)}
                      loading={wrongResultIds.includes(issue.id)}
                      onClick={() => onMarkWrong(issue)}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {group.issues.some((issue) => getSafeFeedback(issue).suggestedLineReports.length > 0) ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100">
              Phase 3 Step 4
            </div>
            <div className="font-medium text-on-surface">Reported Faulty Suggested Lines</div>
          </div>
          <div className="mt-3 space-y-3">
            {group.issues.flatMap((issue) =>
              getSafeFeedback(issue).suggestedLineReports.map((report) => (
                <div key={report.id} className="rounded-2xl border border-emerald-500/15 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-on-surface">
                      {issue.title}
                    </span>
                    {report.suggestedLineNumber ? (
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
                        Suggested line {report.suggestedLineNumber}
                      </span>
                    ) : null}
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-on-surface">
                      {faultTypeLabels[report.faultType]}
                    </span>
                  </div>
                  <pre className="mt-3 rounded-2xl border border-white/10 bg-surface-low/80 px-4 py-3 font-mono text-xs leading-6 text-on-surface whitespace-pre-wrap break-words">
                    <code>{report.lineText}</code>
                  </pre>
                  {report.commentText ? (
                    <p className="mt-3 text-sm leading-6 text-on-surface">{report.commentText}</p>
                  ) : null}
                </div>
              )),
            )}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
