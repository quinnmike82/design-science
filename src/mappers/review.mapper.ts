import { createId } from "@/utils/id";
import type {
  ReviewInputFile,
  ReviewLineNote,
  ReviewNoteComparisonSummary,
  ReviewIssueSeverity,
  ReviewIssueViewModel,
  ReviewModeOption,
  ReviewResultViewModel,
  ReviewSeverityCounts,
  ReviewSubmitRequest,
} from "@/models/review.types";

interface NormalizeReviewResponseInput {
  reviewRunId: string;
  request: ReviewSubmitRequest;
  response: unknown;
  transportMode: ReviewResultViewModel["transportMode"];
}

type RecordLike = Record<string, unknown>;

const severityOrder: Array<ReviewIssueSeverity> = ["critical", "high", "medium", "low"];

function isRecord(value: unknown): value is RecordLike {
  return typeof value === "object" && value !== null;
}

function toRecord(value: unknown): RecordLike {
  return isRecord(value) ? value : {};
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function pickRecord(source: RecordLike, key: string) {
  const value = source[key];
  return isRecord(value) ? value : undefined;
}

function getNestedRecord(source: RecordLike, key: string) {
  const direct = pickRecord(source, key);
  if (direct) {
    return direct;
  }

  const data = pickRecord(source, "data");
  if (data) {
    const nested = pickRecord(data, key);
    if (nested) {
      return nested;
    }
  }

  const result = pickRecord(source, "result");
  if (result) {
    const nested = pickRecord(result, key);
    if (nested) {
      return nested;
    }
  }

  return undefined;
}

function getCandidateValue(source: RecordLike, keys: string[]): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  const data = pickRecord(source, "data");
  if (data) {
    const nested: unknown = getCandidateValue(data, keys);
    if (nested !== undefined) {
      return nested;
    }
  }

  const result = pickRecord(source, "result");
  if (result) {
    const nested: unknown = getCandidateValue(result, keys);
    if (nested !== undefined) {
      return nested;
    }
  }

  return undefined;
}

function getCandidateString(source: RecordLike, keys: string[]) {
  const value = getCandidateValue(source, keys);
  return toStringValue(value);
}

function getCandidateNumber(source: RecordLike, keys: string[]) {
  const value = getCandidateValue(source, keys);
  return toNumberValue(value);
}

function normalizeSeverity(value: string): ReviewIssueSeverity {
  switch (value.toLowerCase()) {
    case "critical":
    case "blocker":
      return "critical";
    case "high":
    case "major":
      return "high";
    case "low":
    case "minor":
    case "info":
    case "suggestion":
      return "low";
    default:
      return "medium";
  }
}

function normalizeMode(value: ReviewModeOption) {
  return value === "mono" ? "monolithic" : "specialist";
}

function inferSupportingDocumentType(fileName: string): ReviewInputFile["documentType"] {
  const lower = fileName.toLowerCase();
  if (lower.includes("fsd") || lower.includes("spec")) {
    return "fsd";
  }
  if (lower.includes("test")) {
    return "testcase";
  }
  if (lower.includes("note")) {
    return "notes";
  }
  return "other";
}

function getSnippetFromFile(file: ReviewInputFile | undefined, lineNumber?: number) {
  if (!file) {
    return undefined;
  }

  const lines = file.content.split(/\r?\n/);
  if (!lines.length) {
    return undefined;
  }

  const targetIndex = lineNumber && lineNumber > 0 ? Math.min(lineNumber - 1, lines.length - 1) : undefined;
  if (targetIndex === undefined) {
    return lines.find((line) => line.trim().length > 0)?.trim();
  }

  return lines[targetIndex]?.trim() || undefined;
}

function buildLocationLabel(filePath?: string, lineNumber?: number) {
  if (filePath && lineNumber) {
    return `${filePath}:${lineNumber}`;
  }
  if (filePath) {
    return filePath;
  }
  if (lineNumber) {
    return `Line ${lineNumber}`;
  }
  return "Location unavailable";
}

function buildEmptyFeedback() {
  return {
    comments: [],
    suggestedLineReports: [],
  };
}

function rangesOverlap(
  leftStart: number,
  leftEnd: number,
  rightStart: number,
  rightEnd: number,
  buffer = 2,
) {
  return leftStart - buffer <= rightEnd && leftEnd + buffer >= rightStart;
}

function notesMatchIssue(issue: ReviewIssueViewModel, note: ReviewLineNote) {
  const issuePath = issue.filePath;
  const notePath = note.filePath;
  if (issuePath && notePath && issuePath !== notePath) {
    return false;
  }

  if (!issue.lineNumber || !note.lineStart) {
    return false;
  }

  return rangesOverlap(note.lineStart, note.lineEnd ?? note.lineStart, issue.lineNumber, issue.lineNumber);
}

function buildSeverityCounts(issues: ReviewIssueViewModel[]): ReviewSeverityCounts {
  return issues.reduce<ReviewSeverityCounts>(
    (acc, issue) => {
      acc[issue.severity] += 1;
      return acc;
    },
    {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
  );
}

function buildSummaryText(mode: ReviewModeOption, issues: ReviewIssueViewModel[]) {
  if (issues.length === 0) {
    return "No issues were returned for this review run.";
  }

  const counts = buildSeverityCounts(issues);
  const countParts = severityOrder
    .filter((severity) => counts[severity] > 0)
    .map((severity) => `${counts[severity]} ${severity}`);

  const modeLabel = mode === "mono" ? "Mono review" : "Multiple-agent review";
  return `${modeLabel} surfaced ${issues.length} issue${issues.length === 1 ? "" : "s"} (${countParts.join(", ")}).`;
}

function flattenIssueArray(response: RecordLike) {
  const topLevelCandidates = [
    response.findings,
    response.issues,
    response.results,
    pickRecord(response, "data")?.issues,
    pickRecord(response, "data")?.findings,
    pickRecord(response, "result")?.issues,
    pickRecord(response, "result")?.findings,
  ];

  for (const candidate of topLevelCandidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function resolveFilePath(issue: RecordLike, files: ReviewInputFile[]) {
  const directPath =
    getCandidateString(issue, ["filePath", "file_path", "file", "path", "filename"]) || undefined;

  if (directPath) {
    return directPath;
  }

  return files[0]?.name;
}

function resolveLineNumber(issue: RecordLike) {
  const location = getNestedRecord(issue, "location");
  if (location) {
    return getCandidateNumber(location, ["line", "lineNumber", "line_number", "startLine", "start_line"]);
  }

  return getCandidateNumber(issue, ["line", "lineNumber", "line_number", "startLine", "start_line"]);
}

function resolveIssueId(issue: RecordLike, index: number) {
  const directId = getCandidateString(issue, ["id", "issue_id", "finding_id"]);
  return directId || `issue-${index + 1}`;
}

function resolveRoleName(issue: RecordLike, mode: ReviewModeOption) {
  if (mode === "mono") {
    return undefined;
  }

  return (
    getCandidateString(issue, ["roleName", "role_name", "role", "agentName", "agent_name", "agent"]) ||
    "Unassigned agent"
  );
}

function buildReplacementSnippet(issue: RecordLike) {
  const replacement = getCandidateString(issue, [
    "replacementSnippet",
    "replacement_snippet",
    "replacement",
    "suggestedCode",
    "suggested_code",
    "patch",
  ]);
  return replacement || undefined;
}

function buildSuggestion(issue: RecordLike, replacementSnippet?: string) {
  const suggestion = getCandidateString(issue, [
    "suggestion",
    "suggestedFix",
    "suggested_fix",
    "fixSummary",
    "fix_summary",
  ]);

  return suggestion || replacementSnippet;
}

function mapIssue(
  issue: RecordLike,
  index: number,
  mode: ReviewModeOption,
  files: ReviewInputFile[],
): ReviewIssueViewModel {
  const title = getCandidateString(issue, ["title", "name"]) || `Issue ${index + 1}`;
  const severity = normalizeSeverity(getCandidateString(issue, ["severity", "level", "priority"]) || "medium");
  const filePath = resolveFilePath(issue, files);
  const lineNumber = resolveLineNumber(issue);
  const file = files.find((item) => item.name === filePath) ?? files[0];
  const originalSnippet =
    getCandidateString(issue, ["originalSnippet", "original_snippet", "sourceSnippet", "source_snippet"]) ||
    getSnippetFromFile(file, lineNumber);
  const replacementSnippet = buildReplacementSnippet(issue);
  const suggestion = buildSuggestion(issue, replacementSnippet);
  const rationale =
    getCandidateString(issue, ["rationale", "explanation", "reason", "details", "analysis"]) || undefined;
  const description =
    getCandidateString(issue, ["description", "summary", "message", "details"]) ||
    "The reviewer flagged this result, but the backend response did not include a full description.";

  return {
    id: resolveIssueId(issue, index),
    title,
    severity,
    roleName: resolveRoleName(issue, mode),
    filePath,
    lineNumber,
    locationLabel: buildLocationLabel(filePath, lineNumber),
    description,
    suggestion,
    originalSnippet: originalSnippet || undefined,
    replacementSnippet,
    sourceFileContent: file?.content,
    rationale,
    canRenderRichDiff: Boolean(
      originalSnippet &&
        replacementSnippet &&
        (originalSnippet.includes("\n") || replacementSnippet.includes("\n")),
    ),
    noteMatchStatus: "unknown",
    relatedNoteIds: [],
    relatedNoteTitles: [],
    feedback: buildEmptyFeedback(),
    rawMetadata: issue,
  };
}

function resolveResponseSummary(response: RecordLike, issues: ReviewIssueViewModel[], mode: ReviewModeOption) {
  const explicitSummary =
    getCandidateString(response, ["summary", "overallSummary", "overall_summary", "executive_summary", "message"]) ||
    getCandidateString(getNestedRecord(response, "metadata") ?? {}, ["summary"]);

  return explicitSummary || buildSummaryText(mode, issues);
}

function issueFromLinePattern(params: {
  file: ReviewInputFile;
  line: string;
  lineNumber: number;
  mode: ReviewModeOption;
  title: string;
  severity: ReviewIssueSeverity;
  roleName?: string;
  description: string;
  suggestion: string;
  replacementSnippet?: string;
}) {
  return {
    id: createId("issue"),
    title: params.title,
    severity: params.severity,
    roleName: params.mode === "multiple_agent" ? params.roleName : undefined,
    filePath: params.file.name,
    lineNumber: params.lineNumber,
    locationLabel: buildLocationLabel(params.file.name, params.lineNumber),
    description: params.description,
    suggestion: params.suggestion,
    originalSnippet: params.line.trim(),
    replacementSnippet: params.replacementSnippet,
    sourceFileContent: params.file.content,
    rationale: "Generated by the local fallback mapper because the backend result was unavailable or incomplete.",
    canRenderRichDiff: false,
    noteMatchStatus: "unknown",
    relatedNoteIds: [],
    relatedNoteTitles: [],
    feedback: buildEmptyFeedback(),
    rawMetadata: {
      generatedFrom: "mock-fallback",
    },
  } satisfies ReviewIssueViewModel;
}

function createMockIssues(request: ReviewSubmitRequest) {
  const issues: ReviewIssueViewModel[] = [];

  for (const file of request.mainFiles) {
    const lines = file.content.split(/\r?\n/);
    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      if (issues.length >= 6) {
        return;
      }

      if (/eval\s*\(/.test(line)) {
        issues.push(
          issueFromLinePattern({
            file,
            line,
            lineNumber,
            mode: request.reviewMode,
            title: "Unsafe dynamic evaluation detected",
            severity: "critical",
            roleName: "Security Agent",
            description: "Dynamic evaluation creates a high-risk execution path and should be removed or isolated.",
            suggestion: "Replace dynamic evaluation with explicit parsing or a safe lookup table.",
            replacementSnippet: "// Replace eval with a deterministic parser or allow-listed dispatch",
          }),
        );
        return;
      }

      if (/redirect|window\.location|res\.redirect/i.test(line)) {
        issues.push(
          issueFromLinePattern({
            file,
            line,
            lineNumber,
            mode: request.reviewMode,
            title: "Redirect handling should be validated",
            severity: "high",
            roleName: "Security Agent",
            description:
              "Redirect-style logic was detected. Validate the target and fail closed when the destination cannot be trusted.",
            suggestion: "Validate the redirect target before applying it and add a safe fallback route.",
            replacementSnippet: "// Validate the target first, then redirect to a safe default on failure",
          }),
        );
        return;
      }

      if (/\bany\b/.test(line)) {
        issues.push(
          issueFromLinePattern({
            file,
            line,
            lineNumber,
            mode: request.reviewMode,
            title: "Broad typing reduces review confidence",
            severity: "medium",
            roleName: "Maintainability Agent",
            description: "The fallback review detected `any`, which makes behavior harder to validate and refactor safely.",
            suggestion: "Replace `any` with a narrower domain type or validated interface.",
            replacementSnippet: line.replace(/\bany\b/g, "SpecificType"),
          }),
        );
        return;
      }

      if (/TODO|FIXME/.test(line)) {
        issues.push(
          issueFromLinePattern({
            file,
            line,
            lineNumber,
            mode: request.reviewMode,
            title: "Outstanding review note left in submitted code",
            severity: "low",
            roleName: "Testing Agent",
            description: "A TODO/FIXME marker suggests the change may still rely on unresolved follow-up work.",
            suggestion: "Convert the note into a tracked task or complete the missing behavior before approval.",
          }),
        );
      }
    });
  }

  if (issues.length > 0) {
    return issues;
  }

  const fallbackFile = request.mainFiles[0];
  const fallbackSnippet = getSnippetFromFile(fallbackFile);
  const fallbackIssue: ReviewIssueViewModel = {
    id: createId("issue"),
    title: "Manual review follow-up recommended",
    severity: "medium",
    roleName: request.reviewMode === "multiple_agent" ? "Architecture Agent" : undefined,
    filePath: fallbackFile?.name,
    lineNumber: 1,
    locationLabel: buildLocationLabel(fallbackFile?.name, 1),
    description:
      "The backend response was unavailable, so the frontend generated a safe fallback issue to keep the review workflow usable.",
    suggestion: "Inspect the submitted change set and confirm the implementation matches the intended behavior.",
    originalSnippet: fallbackSnippet,
    replacementSnippet: undefined,
    sourceFileContent: fallbackFile?.content,
    rationale: "Fallback issue generated locally so the user can continue through summary and marker review steps.",
    canRenderRichDiff: false,
    noteMatchStatus: "unknown",
    relatedNoteIds: [],
    relatedNoteTitles: [],
    feedback: buildEmptyFeedback(),
    rawMetadata: {
      generatedFrom: "mock-fallback",
    },
  };

  return [fallbackIssue];
}

function attachNoteComparison(
  issues: ReviewIssueViewModel[],
  notes: ReviewLineNote[],
): { issues: ReviewIssueViewModel[]; summary: ReviewNoteComparisonSummary } {
  if (notes.length === 0) {
    return {
      issues: issues.map((issue) => ({
        ...issue,
        noteMatchStatus: issue.lineNumber ? "agent_only" : "unknown",
        relatedNoteIds: [],
        relatedNoteTitles: [],
      })),
      summary: {
        totalNotes: 0,
        matchedNotes: 0,
        unmatchedNotes: 0,
        agentMatchedIssues: 0,
        agentOnlyIssues: issues.filter((issue) => issue.lineNumber).length,
        notes: [],
      },
    };
  }

  const comparedIssues = issues.map((issue) => {
    const relatedNotes = notes.filter((note) => notesMatchIssue(issue, note));
    const nextIssue: ReviewIssueViewModel = {
      ...issue,
      noteMatchStatus: relatedNotes.length > 0 ? "matched" : issue.lineNumber ? "agent_only" : "unknown",
      relatedNoteIds: relatedNotes.map((note) => note.id),
      relatedNoteTitles: relatedNotes.map((note) => note.title),
    };
    return nextIssue;
  });

  const noteViews = notes.map((note) => {
    const matchedIssueIds = comparedIssues.filter((issue) => issue.relatedNoteIds.includes(note.id)).map((issue) => issue.id);
    return {
      id: note.id,
      title: note.title,
      description: note.description,
      filePath: note.filePath,
      lineStart: note.lineStart,
      lineEnd: note.lineEnd,
      status: matchedIssueIds.length > 0 ? "matched" : "unmatched",
      matchedIssueIds,
    } as const;
  });

  return {
    issues: comparedIssues,
    summary: {
      totalNotes: notes.length,
      matchedNotes: noteViews.filter((note) => note.status === "matched").length,
      unmatchedNotes: noteViews.filter((note) => note.status === "unmatched").length,
      agentMatchedIssues: comparedIssues.filter((issue) => issue.noteMatchStatus === "matched").length,
      agentOnlyIssues: comparedIssues.filter((issue) => issue.noteMatchStatus === "agent_only").length,
      notes: noteViews,
    },
  };
}

export function toApiReviewMode(mode: ReviewModeOption): "monolithic" | "specialist" {
  return normalizeMode(mode);
}

export function toApiSubmitPayload(request: ReviewSubmitRequest) {
  return {
    review_mode: toApiReviewMode(request.reviewMode),
    source_files: request.mainFiles.map((file) => ({
      file_name: file.name,
      content: file.content,
    })),
    supporting_files: request.supportingFiles.map((file) => ({
      file_name: file.name,
      content: file.content,
      document_type: file.documentType ?? inferSupportingDocumentType(file.name),
    })),
    notes: request.notes?.trim() || undefined,
    context: request.notes?.trim() || undefined,
  };
}

export function normalizeReviewResponse({
  reviewRunId,
  request,
  response,
  transportMode,
}: NormalizeReviewResponseInput): ReviewResultViewModel {
  const responseRecord = toRecord(response);
  const issues = flattenIssueArray(responseRecord)
    .filter(isRecord)
    .map((issue, index) => mapIssue(issue, index, request.reviewMode, request.mainFiles));
  const safeIssues = issues.length > 0 ? issues : createMockIssues(request);
  const noteComparison = attachNoteComparison(safeIssues, request.developerNotes);
  const submittedAt = new Date().toISOString();

  return {
    reviewRunId,
    backendReviewId:
      getCandidateString(responseRecord, ["review_id", "reviewId", "id"]) || undefined,
    mode: request.reviewMode,
    transportMode,
    summaryText: resolveResponseSummary(responseRecord, noteComparison.issues, request.reviewMode),
    issues: noteComparison.issues,
    noteComparison: noteComparison.summary,
    severityCounts: buildSeverityCounts(noteComparison.issues),
    submittedAt,
    supportsMultilineSource: noteComparison.issues.some((issue) => issue.canRenderRichDiff),
    rawResponse: response,
  };
}

export function buildMockReviewResponse(request: ReviewSubmitRequest) {
  return {
    review_id: createId("backend-review"),
    mode: toApiReviewMode(request.reviewMode),
    summary: buildSummaryText(request.reviewMode, createMockIssues(request)),
    issues: createMockIssues(request).map((issue) => ({
      id: issue.id,
      title: issue.title,
      severity: issue.severity,
      role_name: issue.roleName,
      file_path: issue.filePath,
      line_number: issue.lineNumber,
      description: issue.description,
      suggested_fix: issue.suggestion,
      replacement_snippet: issue.replacementSnippet,
      rationale: issue.rationale,
    })),
  };
}
