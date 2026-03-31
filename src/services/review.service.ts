import { buildMockReviewResponse, normalizeReviewResponse } from "@/mappers/review.mapper";
import type { ReviewIssueFeedbackState } from "@/models/review-feedback.types";
import type {
  ReviewFlowStep,
  ReviewInputState,
  ReviewIssueViewModel,
  ReviewNoteComparisonSummary,
  ReviewResultViewModel,
  ReviewRunRecord,
  ReviewSeverityCounts,
  ReviewSubmitRequest,
} from "@/models/review.types";
import type { ReviewSurvey, SurveyPreferredMode, SurveyScore } from "@/models/survey.types";
import { reviewApi } from "@/services/api/reviewApi";
import { createId } from "@/utils/id";

const REVIEW_RUNS_STORAGE_KEY = "synthetic-architect.review-flow.runs";

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function createEmptyInputState(): ReviewInputState {
  return {
    reviewMode: undefined,
    selectedSnippetId: "",
    selectedSnippet: undefined,
    mainFiles: [],
    supportingFiles: [],
    developerNotes: [],
    notes: "",
  };
}

function normalizeReviewInputState(input?: Partial<ReviewInputState> | null): ReviewInputState {
  const defaults = createEmptyInputState();
  return {
    ...defaults,
    ...input,
    selectedSnippetId: input?.selectedSnippetId ?? defaults.selectedSnippetId,
    selectedSnippet: input?.selectedSnippet ?? defaults.selectedSnippet,
    mainFiles: Array.isArray(input?.mainFiles) ? input.mainFiles : defaults.mainFiles,
    supportingFiles: Array.isArray(input?.supportingFiles) ? input.supportingFiles : defaults.supportingFiles,
    developerNotes: Array.isArray(input?.developerNotes) ? input.developerNotes : defaults.developerNotes,
    notes: input?.notes ?? defaults.notes,
  };
}

function normalizeSurveyScore(value: unknown, fallback: SurveyScore = 2): SurveyScore {
  return value === 1 || value === 2 || value === 3 ? value : fallback;
}

function normalizeSurveyPreferredMode(value: unknown): SurveyPreferredMode | undefined {
  return value === "mono" || value === "multiple_agent" || value === "no_preference" ? value : undefined;
}

function normalizeReviewSurvey(
  survey?: Partial<ReviewSurvey> | { score?: number; comment?: string } | null,
): ReviewSurvey | undefined {
  if (!survey) {
    return undefined;
  }

  const legacyScore = normalizeSurveyScore((survey as { score?: unknown }).score, 2);
  const submittedAtValue = (survey as Partial<ReviewSurvey>).submittedAt;
  const submittedAt = typeof submittedAtValue === "string" ? submittedAtValue : new Date().toISOString();

  return {
    findingsQualityScore: normalizeSurveyScore(
      (survey as Partial<ReviewSurvey>).findingsQualityScore,
      legacyScore,
    ),
    modeFitScore: normalizeSurveyScore((survey as Partial<ReviewSurvey>).modeFitScore, legacyScore),
    codeReviewClarityScore: normalizeSurveyScore(
      (survey as Partial<ReviewSurvey>).codeReviewClarityScore,
      legacyScore,
    ),
    trustScore: normalizeSurveyScore((survey as Partial<ReviewSurvey>).trustScore, legacyScore),
    preferredMode: normalizeSurveyPreferredMode((survey as Partial<ReviewSurvey>).preferredMode),
    comment:
      typeof survey.comment === "string" && survey.comment.trim().length > 0 ? survey.comment.trim() : undefined,
    submittedAt,
  };
}

function normalizeIssueFeedbackState(feedback?: Partial<ReviewIssueFeedbackState> | null): ReviewIssueFeedbackState {
  return {
    reportedFault: feedback?.reportedFault,
    comments: Array.isArray(feedback?.comments) ? feedback.comments : [],
    wrongResult: feedback?.wrongResult,
    suggestedLineReports: Array.isArray(feedback?.suggestedLineReports) ? feedback.suggestedLineReports : [],
  };
}

function normalizeSeverityCounts(counts?: Partial<ReviewSeverityCounts> | null): ReviewSeverityCounts {
  return {
    critical: counts?.critical ?? 0,
    high: counts?.high ?? 0,
    medium: counts?.medium ?? 0,
    low: counts?.low ?? 0,
  };
}

function createEmptyNoteComparison(): ReviewNoteComparisonSummary {
  return {
    totalNotes: 0,
    matchedNotes: 0,
    unmatchedNotes: 0,
    agentMatchedIssues: 0,
    agentOnlyIssues: 0,
    notes: [],
  };
}

function normalizeNoteComparison(
  comparison?: ReviewNoteComparisonSummary | null,
): ReviewNoteComparisonSummary {
  const defaults = createEmptyNoteComparison();
  return {
    ...defaults,
    ...comparison,
    notes: Array.isArray(comparison?.notes)
      ? comparison.notes.map((note) => ({
          ...note,
          matchedIssueIds: Array.isArray(note.matchedIssueIds) ? note.matchedIssueIds : [],
        }))
      : defaults.notes,
  };
}

function normalizeReviewIssue(issue: ReviewIssueViewModel): ReviewIssueViewModel {
  return {
    ...issue,
    relatedNoteIds: Array.isArray(issue.relatedNoteIds) ? issue.relatedNoteIds : [],
    relatedNoteTitles: Array.isArray(issue.relatedNoteTitles) ? issue.relatedNoteTitles : [],
    feedback: normalizeIssueFeedbackState(issue.feedback),
    rawMetadata:
      issue.rawMetadata && typeof issue.rawMetadata === "object" ? issue.rawMetadata : {},
  };
}

function normalizeReviewResult(result?: ReviewResultViewModel | null): ReviewResultViewModel | undefined {
  if (!result) {
    return undefined;
  }

  return {
    ...result,
    issues: Array.isArray(result.issues) ? result.issues.map(normalizeReviewIssue) : [],
    noteComparison: normalizeNoteComparison(result.noteComparison),
    severityCounts: normalizeSeverityCounts(result.severityCounts),
  };
}

function normalizeReviewRun(run: Partial<ReviewRunRecord>): ReviewRunRecord {
  const now = new Date().toISOString();
  return {
    id: run.id ?? createId("review-run"),
    status: run.status ?? "draft",
    createdAt: run.createdAt ?? now,
    updatedAt: run.updatedAt ?? run.createdAt ?? now,
    currentStep: run.currentStep ?? 1,
    input: normalizeReviewInputState(run.input),
    result: normalizeReviewResult(run.result),
    survey: normalizeReviewSurvey(run.survey),
    lastError: run.lastError,
  };
}

function readStoredRuns() {
  if (!hasStorage()) {
    return [] as ReviewRunRecord[];
  }

  try {
    const raw = window.localStorage.getItem(REVIEW_RUNS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Array<Partial<ReviewRunRecord>>) : [];
    return parsed.map(normalizeReviewRun);
  } catch {
    return [];
  }
}

function writeStoredRuns(runs: ReviewRunRecord[]) {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.setItem(REVIEW_RUNS_STORAGE_KEY, JSON.stringify(runs));
}

function sortRuns(runs: ReviewRunRecord[]) {
  return [...runs].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function buildDraftRun(): ReviewRunRecord {
  const now = new Date().toISOString();
  return normalizeReviewRun({
    id: createId("review-run"),
    status: "draft",
    createdAt: now,
    updatedAt: now,
    currentStep: 1,
    input: createEmptyInputState(),
  });
}

function saveRun(run: ReviewRunRecord) {
  const current = readStoredRuns();
  const normalizedRun = normalizeReviewRun(run);
  const next = current.some((item) => item.id === run.id)
    ? current.map((item) => (item.id === run.id ? normalizedRun : item))
    : [normalizedRun, ...current];

  writeStoredRuns(sortRuns(next));
  return normalizedRun;
}

async function submitToBackend(request: ReviewSubmitRequest) {
  return reviewApi.reviewSnippet({
    snippetId: request.snippetId,
    context: request.notes?.trim() || undefined,
    mode: request.reviewMode === "mono" ? "monolithic" : "specialist",
  });
}

export function updateStoredReviewRun(reviewRunId: string, updater: (run: ReviewRunRecord) => ReviewRunRecord) {
  const current = getReviewRun(reviewRunId);
  if (!current) {
    throw new Error(`Review run ${reviewRunId} was not found.`);
  }

  const updated = updater(current);
  return saveRun({
    ...normalizeReviewRun(updated),
    updatedAt: new Date().toISOString(),
  });
}

export function listReviewRuns() {
  return sortRuns(readStoredRuns());
}

export function getReviewRun(reviewRunId: string) {
  return readStoredRuns().find((run) => run.id === reviewRunId) ?? null;
}

export function getLatestReviewRun() {
  return listReviewRuns()[0] ?? null;
}

export function createReviewDraft() {
  return saveRun(buildDraftRun());
}

export function getOrCreateLatestReviewRun() {
  return getLatestReviewRun() ?? createReviewDraft();
}

export function updateReviewInput(reviewRunId: string, input: Partial<ReviewInputState>, currentStep?: ReviewFlowStep) {
  return updateStoredReviewRun(reviewRunId, (run) => ({
    ...run,
    currentStep: currentStep ?? run.currentStep,
    input: {
      ...run.input,
      ...input,
      selectedSnippetId: input.selectedSnippetId ?? run.input.selectedSnippetId,
      selectedSnippet: input.selectedSnippet ?? run.input.selectedSnippet,
      mainFiles: input.mainFiles ?? run.input.mainFiles,
      supportingFiles: input.supportingFiles ?? run.input.supportingFiles,
      developerNotes: input.developerNotes ?? run.input.developerNotes,
      notes: input.notes ?? run.input.notes,
      reviewMode: input.reviewMode ?? run.input.reviewMode,
    },
  }));
}

export async function submitReview(request: ReviewSubmitRequest) {
  if (!request.reviewMode) {
    throw new Error("Review mode is required.");
  }
  if (!request.snippetId) {
    throw new Error("A backend snippet is required.");
  }
  if (request.mainFiles.length === 0) {
    throw new Error("A backend snippet source is required.");
  }

  const reviewRunId = request.reviewRunId ?? createId("review-run");
  const baseRun =
    getReviewRun(reviewRunId) ??
    saveRun({
      id: reviewRunId,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentStep: 1,
      input: createEmptyInputState(),
    });

  saveRun({
    ...baseRun,
    status: "running",
    currentStep: 2,
    input: {
      reviewMode: request.reviewMode,
      selectedSnippetId: request.snippetId,
      selectedSnippet: baseRun.input.selectedSnippet,
      mainFiles: request.mainFiles,
      supportingFiles: request.supportingFiles,
      developerNotes: request.developerNotes,
      notes: request.notes ?? "",
    },
    lastError: undefined,
    updatedAt: new Date().toISOString(),
  });

  try {
    const response = await submitToBackend(request);
    const result = normalizeReviewResponse({
      reviewRunId,
      request,
      response,
      transportMode: "api",
    });

    return saveRun({
      ...baseRun,
      status: "completed",
      currentStep: 2,
      input: {
        reviewMode: request.reviewMode,
        selectedSnippetId: request.snippetId,
        selectedSnippet: baseRun.input.selectedSnippet,
        mainFiles: request.mainFiles,
        supportingFiles: request.supportingFiles,
        developerNotes: request.developerNotes,
        notes: request.notes ?? "",
      },
      result,
      survey: baseRun.survey,
      updatedAt: new Date().toISOString(),
      lastError: undefined,
    });
  } catch {
    const fallback = buildMockReviewResponse(request);
    const result = normalizeReviewResponse({
      reviewRunId,
      request,
      response: fallback,
      transportMode: "mock-fallback",
    });

    return saveRun({
      ...baseRun,
      status: "completed",
      currentStep: 2,
      input: {
        reviewMode: request.reviewMode,
        selectedSnippetId: request.snippetId,
        selectedSnippet: baseRun.input.selectedSnippet,
        mainFiles: request.mainFiles,
        supportingFiles: request.supportingFiles,
        developerNotes: request.developerNotes,
        notes: request.notes ?? "",
      },
      result,
      survey: baseRun.survey,
      updatedAt: new Date().toISOString(),
      lastError: undefined,
    });
  }
}

export const reviewService = {
  listReviewRuns,
  getReviewRun,
  getLatestReviewRun,
  getOrCreateLatestReviewRun,
  createReviewDraft,
  updateReviewInput,
  submitReview,
};
