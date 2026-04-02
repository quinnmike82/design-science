import { buildMockReviewResponse, normalizeReviewResponse } from "@/mappers/review.mapper";
import type { ReviewIssueFeedbackState } from "@/models/review-feedback.types";
import type {
  ReviewFlowStep,
  ReviewerAiToolFrequencyOption,
  ReviewerExperienceOption,
  ReviewInputFile,
  ReviewInputState,
  ReviewIssueViewModel,
  ReviewNoteComparisonSummary,
  ReviewPhaseFinding,
  ReviewerReviewFrequencyOption,
  ReviewReviewerProfile,
  ReviewResultViewModel,
  ReviewRunRecord,
  ReviewSeverityCounts,
  ReviewSubmitRequest,
  ReviewStepMetrics,
} from "@/models/review.types";
import type { ReviewSurvey, SurveyReviewApproach, SurveyScore } from "@/models/survey.types";
import { reviewApi } from "@/services/api/reviewApi";
import { loadResults as loadLegacyResults, loadSessions as loadLegacySessions } from "@/services/local/persistence";
import type {
  Artifact as LegacyArtifact,
  DeveloperComment as LegacyDeveloperComment,
  Finding as LegacyFinding,
  ReviewResult as LegacyReviewResult,
  ReviewSession as LegacyReviewSession,
} from "@/types/review";
import { createId } from "@/utils/id";
import {
  activateReviewStepMetrics,
  createEmptyReviewStepMetrics,
  normalizeReviewStepMetrics,
  pauseReviewStepMetrics,
} from "@/utils/reviewTiming";

const REVIEW_RUNS_STORAGE_KEY = "synthetic-architect.review-flow.runs";

const legacyRoleNameMap: Record<LegacyFinding["agentId"], string> = {
  security: "Security Agent",
  architecture: "Architecture Agent",
  logic: "Logic Agent",
  maintainability: "Maintainability Agent",
  testing: "Testing Agent",
  policy: "Policy Agent",
  general: "General Agent",
};

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

function createDefaultReviewerProfile(): ReviewReviewerProfile {
  const now = new Date().toISOString();
  return {
    currentRole: "mid_level_developer",
    programmingExperience: "3_5_years",
    reviewFrequency: "occasionally",
    aiToolUsageFrequency: "sometimes",
    createdAt: now,
    updatedAt: now,
  };
}

function buildSnippetFileName(snippetId: string, language?: string) {
  const extensionMap: Record<string, string> = {
    python: "py",
    typescript: "ts",
    javascript: "js",
    go: "go",
    java: "java",
    kotlin: "kt",
  };

  const extension = extensionMap[(language ?? "").toLowerCase()] ?? "txt";
  return `snippets/${snippetId}.${extension}`;
}

function normalizeLegacyMode(value?: LegacyReviewSession["reviewMode"] | LegacyReviewResult["mode"]) {
  return value === "specialist" ? "multiple_agent" : "mono";
}

function normalizeLegacyNoteMatchStatus(status?: LegacyFinding["developerFoundStatus"]) {
  if (status === "found") {
    return "matched";
  }
  if (status === "missed") {
    return "agent_only";
  }
  return "unknown";
}

function mapLegacyArtifactToSupportingFile(artifact: LegacyArtifact): ReviewInputFile {
  const documentType =
    artifact.type === "fsd" || artifact.type === "testcase" || artifact.type === "notes"
      ? artifact.type
      : "other";

  return {
    id: artifact.id,
    kind: "supporting",
    name: artifact.fileName ?? artifact.name,
    content: artifact.content,
    size: artifact.size ?? artifact.content.length,
    uploadedAt: artifact.uploadedAt,
    documentType,
  };
}

function buildLegacyNoteComparison(session?: LegacyReviewSession, result?: LegacyReviewResult): ReviewNoteComparisonSummary {
  const comments = session?.developerComments ?? result?.developerComments ?? [];
  const findings = result?.findings ?? [];
  const matchedIssueIdsByComment = new Map<string, string[]>();

  findings.forEach((finding) => {
    finding.relatedCommentIds.forEach((commentId) => {
      matchedIssueIdsByComment.set(commentId, [...(matchedIssueIdsByComment.get(commentId) ?? []), finding.id]);
    });
  });

  const notes = comments.map((comment) => {
    const matchedIssueIds = matchedIssueIdsByComment.get(comment.id) ?? [];
    return {
      id: comment.id,
      title: comment.title,
      description: comment.description,
      filePath: comment.filePath,
      lineStart: comment.lineStart,
      lineEnd: comment.lineEnd,
      status: matchedIssueIds.length > 0 ? "matched" : "unmatched",
      matchedIssueIds,
    } as ReviewNoteComparisonSummary["notes"][number];
  });

  return {
    totalNotes: comments.length,
    matchedNotes: notes.filter((note) => note.status === "matched").length,
    unmatchedNotes: notes.filter((note) => note.status === "unmatched").length,
    agentMatchedIssues: findings.filter((finding) => finding.developerFoundStatus === "found").length,
    agentOnlyIssues: findings.filter((finding) => finding.developerFoundStatus === "missed").length,
    notes,
  };
}

function mapLegacyFindingToIssue(
  finding: LegacyFinding,
  commentsById: Map<string, LegacyDeveloperComment>,
  result?: LegacyReviewResult,
  session?: LegacyReviewSession,
): ReviewIssueViewModel {
  const locationLabel =
    finding.filePath && finding.lineStart ? `${finding.filePath}:${finding.lineStart}` : finding.filePath ?? "Unknown location";
  const report = result?.issueReports?.find((item) => item.findingId === finding.id);

  return {
    id: finding.id,
    title: finding.title,
    severity: finding.severity,
    roleName: legacyRoleNameMap[finding.agentId] ?? finding.agentId,
    filePath: finding.filePath,
    lineNumber: finding.lineStart,
    locationLabel,
    description: finding.technicalDetails || finding.summary,
    suggestion: finding.suggestedFix ?? finding.recommendation,
    originalSnippet: undefined,
    replacementSnippet: undefined,
    sourceFileContent: session?.snippetCode,
    rationale: finding.businessImpact,
    canRenderRichDiff: false,
    noteMatchStatus: normalizeLegacyNoteMatchStatus(finding.developerFoundStatus),
    relatedNoteIds: finding.relatedCommentIds,
    relatedNoteTitles: finding.relatedCommentIds
      .map((commentId) => commentsById.get(commentId)?.title)
      .filter((title): title is string => Boolean(title)),
    feedback: {
      reportedFault: report
        ? {
            reason: report.reason,
            createdAt: report.submittedAt,
            sourceStep: "summary",
          }
        : undefined,
      comments: [],
      wrongResult: undefined,
      suggestedLineReports: [],
    },
    rawMetadata: {
      legacyAgentId: finding.agentId,
      category: finding.category,
      confidence: finding.confidence,
      tags: finding.tags,
      relatedArtifacts: finding.relatedArtifacts,
    },
  };
}

function mapLegacyRun(session: LegacyReviewSession, result?: LegacyReviewResult): ReviewRunRecord {
  const mainFileName = buildSnippetFileName(session.snippetId, session.snippetLanguage);
  const commentsById = new Map(session.developerComments.map((comment) => [comment.id, comment]));
  const issues = (result?.findings ?? []).map((finding) => mapLegacyFindingToIssue(finding, commentsById, result, session));
  const totalActiveSec = session.timeSpentSec ?? result?.metrics.timeSpentSec ?? 0;
  const mode = normalizeLegacyMode(result?.mode ?? session.reviewMode);
  const noteComparison = buildLegacyNoteComparison(session, result);

  return normalizeReviewRun({
    id: session.id,
    status: session.status,
    createdAt: session.createdAt,
    updatedAt: session.submittedAt ?? session.createdAt,
    currentStep: result ? 2 : 1,
    stepMetrics: {
      totalActiveSec,
      stepTimesSec: {
        1: totalActiveSec,
        2: 0,
        3: 0,
      },
    },
    submissionMetadata: {
      apiReviewId: session.backendSessionId ?? result?.sessionId,
      transportMode: result ? "api" : undefined,
      capturedAt: session.submittedAt,
    },
    phase3Findings: [],
    input: {
      reviewMode: mode,
      selectedSnippetId: session.snippetId,
      selectedSnippet: {
        id: session.snippetId,
        label: session.snippetTitle,
        language: session.snippetLanguage,
        context: session.snippetContext,
        numSeededIssues: 0,
        code: session.snippetCode,
      },
      mainFiles: [
        {
          id: `legacy-main-${session.id}`,
          kind: "main",
          name: mainFileName,
          content: session.snippetCode,
          size: session.snippetCode.length,
          uploadedAt: session.createdAt,
        },
      ],
      supportingFiles: session.artifacts.map(mapLegacyArtifactToSupportingFile),
      developerNotes: session.developerComments,
      notes: session.description,
    },
    result: result
      ? {
          reviewRunId: session.id,
          backendReviewId: session.backendSessionId ?? result.sessionId,
          mode,
          transportMode: "api",
          summaryText: result.mergedSummary || result.executiveSummary,
          issues,
          noteComparison,
          severityCounts: result.severityCounts,
          submittedAt: session.submittedAt ?? session.createdAt,
          supportsMultilineSource: false,
          rawResponse: result,
        }
      : undefined,
  });
}

function readLegacyRuns() {
  if (!hasStorage()) {
    return [] as ReviewRunRecord[];
  }

  try {
    const sessions = loadLegacySessions();
    const results = loadLegacyResults();

    return sessions.map((session) => mapLegacyRun(session, results[session.id]));
  } catch {
    return [];
  }
}

function normalizeReviewStepMetricsState(metrics?: Partial<ReviewStepMetrics> | null) {
  return normalizeReviewStepMetrics(metrics);
}

function normalizeReviewerProfile(profile?: Partial<ReviewReviewerProfile> | null): ReviewReviewerProfile | undefined {
  if (!profile) {
    return undefined;
  }

  const defaults = createDefaultReviewerProfile();
  const normalizedCurrentRole = (() => {
    switch (profile.currentRole ?? (profile as { role?: string }).role) {
      case "student":
      case "junior_developer":
      case "mid_level_developer":
      case "senior_developer":
      case "tech_lead_manager":
      case "other":
        return profile.currentRole ?? (profile as { role?: ReviewReviewerProfile["currentRole"] }).role!;
      case "DEV":
        return "mid_level_developer";
      case "PM":
        return "tech_lead_manager";
      case "BA":
      case "QA":
        return "other";
      default:
        return defaults.currentRole;
    }
  })();
  const normalizedProgrammingExperience = (() => {
    const explicitValue = profile.programmingExperience;
    if (
      explicitValue === "less_than_1_year" ||
      explicitValue === "1_3_years" ||
      explicitValue === "3_5_years" ||
      explicitValue === "more_than_5_years"
    ) {
      return explicitValue;
    }

    const legacyYears = (profile as { yearsOfExperience?: number }).yearsOfExperience;
    if (typeof legacyYears !== "number" || !Number.isFinite(legacyYears)) {
      return defaults.programmingExperience;
    }
    if (legacyYears < 1) {
      return "less_than_1_year";
    }
    if (legacyYears <= 3) {
      return "1_3_years";
    }
    if (legacyYears <= 5) {
      return "3_5_years";
    }
    return "more_than_5_years";
  })();
  const normalizedReviewFrequency: ReviewerReviewFrequencyOption =
    profile.reviewFrequency === "rarely" ||
    profile.reviewFrequency === "occasionally" ||
    profile.reviewFrequency === "frequently"
      ? profile.reviewFrequency
      : defaults.reviewFrequency;
  const normalizedAiToolUsageFrequency: ReviewerAiToolFrequencyOption =
    profile.aiToolUsageFrequency === "rarely" ||
    profile.aiToolUsageFrequency === "sometimes" ||
    profile.aiToolUsageFrequency === "frequently"
      ? profile.aiToolUsageFrequency
      : defaults.aiToolUsageFrequency;

  return {
    ...defaults,
    ...profile,
    currentRole: normalizedCurrentRole,
    programmingExperience: normalizedProgrammingExperience as ReviewerExperienceOption,
    codeReviewFamiliarityScore:
      profile.codeReviewFamiliarityScore === 1 ||
      profile.codeReviewFamiliarityScore === 2 ||
      profile.codeReviewFamiliarityScore === 3
        ? profile.codeReviewFamiliarityScore
        : undefined,
    reviewFrequency: normalizedReviewFrequency,
    aiToolUsageFrequency: normalizedAiToolUsageFrequency,
    createdAt:
      typeof profile.createdAt === "string" && profile.createdAt.trim().length > 0
        ? profile.createdAt
        : defaults.createdAt,
    updatedAt:
      typeof profile.updatedAt === "string" && profile.updatedAt.trim().length > 0
        ? profile.updatedAt
        : defaults.updatedAt,
  };
}

function normalizeSubmissionMetadata(run: Partial<ReviewRunRecord>) {
  const metadata = run.submissionMetadata;
  if (!metadata) {
    return undefined;
  }

  return {
    apiReviewId:
      typeof metadata.apiReviewId === "string" && metadata.apiReviewId.trim().length > 0
        ? metadata.apiReviewId
        : undefined,
    transportMode: metadata.transportMode === "api" || metadata.transportMode === "mock-fallback"
      ? metadata.transportMode
      : undefined,
    capturedAt:
      typeof metadata.capturedAt === "string" && metadata.capturedAt.trim().length > 0
        ? metadata.capturedAt
        : undefined,
  };
}

function normalizePhase3Findings(findings?: Partial<ReviewPhaseFinding>[] | null): ReviewPhaseFinding[] {
  return Array.isArray(findings)
    ? findings
        .filter((finding): finding is Partial<ReviewPhaseFinding> => Boolean(finding))
        .map((finding) => ({
          id: typeof finding.id === "string" && finding.id.trim().length > 0 ? finding.id : createId("phase3-finding"),
          title: typeof finding.title === "string" ? finding.title : "",
          description: typeof finding.description === "string" ? finding.description : "",
          filePath: typeof finding.filePath === "string" ? finding.filePath : "Unknown file",
          lineStart: typeof finding.lineStart === "number" ? finding.lineStart : undefined,
          lineEnd: typeof finding.lineEnd === "number" ? finding.lineEnd : undefined,
          severityGuess: finding.severityGuess,
          createdAt:
            typeof finding.createdAt === "string" && finding.createdAt.trim().length > 0
              ? finding.createdAt
              : new Date().toISOString(),
          sourcePhase: 3,
        }))
    : [];
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

function normalizeSurveyReviewApproach(value: unknown): SurveyReviewApproach | undefined {
  return value === "mono" || value === "multiple_agent" ? value : undefined;
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
    reviewApproachUsed:
      normalizeSurveyReviewApproach((survey as Partial<ReviewSurvey>).reviewApproachUsed) ??
      normalizeSurveyReviewApproach((survey as { preferredMode?: unknown }).preferredMode) ??
      "mono",
    feedbackClarityScore: normalizeSurveyScore(
      (survey as Partial<ReviewSurvey>).feedbackClarityScore ??
        (survey as { codeReviewClarityScore?: unknown }).codeReviewClarityScore,
      legacyScore,
    ),
    issueRelevanceScore: normalizeSurveyScore(
      (survey as Partial<ReviewSurvey>).issueRelevanceScore ??
        (survey as { findingsQualityScore?: unknown }).findingsQualityScore,
      legacyScore,
    ),
    feedbackUsefulnessScore: normalizeSurveyScore(
      (survey as Partial<ReviewSurvey>).feedbackUsefulnessScore ??
        (survey as { modeFitScore?: unknown }).modeFitScore,
      legacyScore,
    ),
    trustScore: normalizeSurveyScore((survey as Partial<ReviewSurvey>).trustScore, legacyScore),
    overallSatisfactionScore: normalizeSurveyScore(
      (survey as Partial<ReviewSurvey>).overallSatisfactionScore ??
        (survey as { modeFitScore?: unknown }).modeFitScore,
      legacyScore,
    ),
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
    stepMetrics: normalizeReviewStepMetricsState(run.stepMetrics),
    reviewerProfile: normalizeReviewerProfile(run.reviewerProfile),
    submissionMetadata: normalizeSubmissionMetadata(run),
    phase3Findings: normalizePhase3Findings(run.phase3Findings),
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
    const merged = new Map<string, ReviewRunRecord>();

    readLegacyRuns().forEach((run) => {
      merged.set(run.id, run);
    });
    parsed.map(normalizeReviewRun).forEach((run) => {
      merged.set(run.id, run);
    });

    return [...merged.values()];
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
    stepMetrics: createEmptyReviewStepMetrics(),
    phase3Findings: [],
    input: createEmptyInputState(),
  });
}

function saveRun(run: Partial<ReviewRunRecord>) {
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
  return (
    readStoredRuns().find(
      (run) =>
        run.id === reviewRunId ||
        run.submissionMetadata?.apiReviewId === reviewRunId ||
        run.result?.backendReviewId === reviewRunId,
    ) ?? null
  );
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

export function setReviewRunCurrentStep(reviewRunId: string, step: ReviewFlowStep) {
  return updateStoredReviewRun(reviewRunId, (run) => ({
    ...run,
    currentStep: step,
    stepMetrics: activateReviewStepMetrics(run.stepMetrics, step),
  }));
}

export function ensureReviewerProfile(reviewRunId: string) {
  return updateStoredReviewRun(reviewRunId, (run) => ({
    ...run,
    reviewerProfile: run.reviewerProfile ?? createDefaultReviewerProfile(),
  }));
}

export function updateReviewerProfile(reviewRunId: string, input: Partial<ReviewReviewerProfile>) {
  return updateStoredReviewRun(reviewRunId, (run) => {
    const baseProfile = run.reviewerProfile ?? createDefaultReviewerProfile();
    return {
      ...run,
      reviewerProfile: normalizeReviewerProfile({
        ...baseProfile,
        ...input,
        createdAt: baseProfile.createdAt,
        updatedAt: new Date().toISOString(),
      }),
    };
  });
}

export function addPhase3Finding(
  reviewRunId: string,
  finding: Omit<ReviewPhaseFinding, "id" | "createdAt" | "sourcePhase">,
) {
  return updateStoredReviewRun(reviewRunId, (run) => ({
    ...run,
    phase3Findings: [
      ...run.phase3Findings,
      {
        ...finding,
        id: createId("phase3-finding"),
        createdAt: new Date().toISOString(),
        sourcePhase: 3,
      },
    ],
  }));
}

export function removePhase3Finding(reviewRunId: string, findingId: string) {
  return updateStoredReviewRun(reviewRunId, (run) => ({
    ...run,
    phase3Findings: run.phase3Findings.filter((finding) => finding.id !== findingId),
  }));
}

export function resumeReviewRunStepTracking(reviewRunId: string, step: ReviewFlowStep) {
  return updateStoredReviewRun(reviewRunId, (run) => {
    const stepMetrics = normalizeReviewStepMetricsState(run.stepMetrics);
    const alreadyTrackingCurrentStep =
      stepMetrics.activeStep === step && Boolean(stepMetrics.activeStepEnteredAt);

    return alreadyTrackingCurrentStep
      ? {
          ...run,
          stepMetrics,
        }
      : {
          ...run,
          stepMetrics: activateReviewStepMetrics(stepMetrics, step),
        };
  });
}

export function pauseReviewRunStepTracking(reviewRunId: string) {
  return updateStoredReviewRun(reviewRunId, (run) => ({
    ...run,
    stepMetrics: pauseReviewStepMetrics(run.stepMetrics),
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
    submissionMetadata: undefined,
    phase3Findings: [],
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
    const latestRun = getReviewRun(reviewRunId) ?? baseRun;

    return saveRun({
      ...latestRun,
      status: "completed",
      currentStep: 2,
      input: {
        reviewMode: request.reviewMode,
        selectedSnippetId: request.snippetId,
        selectedSnippet: latestRun.input.selectedSnippet,
        mainFiles: request.mainFiles,
        supportingFiles: request.supportingFiles,
        developerNotes: request.developerNotes,
        notes: request.notes ?? "",
      },
      result,
      submissionMetadata: {
        apiReviewId: result.transportMode === "api" ? result.backendReviewId : undefined,
        transportMode: result.transportMode,
        capturedAt: new Date().toISOString(),
      },
      survey: latestRun.survey,
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
    const latestRun = getReviewRun(reviewRunId) ?? baseRun;

    return saveRun({
      ...latestRun,
      status: "completed",
      currentStep: 2,
      input: {
        reviewMode: request.reviewMode,
        selectedSnippetId: request.snippetId,
        selectedSnippet: latestRun.input.selectedSnippet,
        mainFiles: request.mainFiles,
        supportingFiles: request.supportingFiles,
        developerNotes: request.developerNotes,
        notes: request.notes ?? "",
      },
      result,
      submissionMetadata: {
        apiReviewId: undefined,
        transportMode: result.transportMode,
        capturedAt: new Date().toISOString(),
      },
      survey: latestRun.survey,
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
  ensureReviewerProfile,
  updateReviewerProfile,
  addPhase3Finding,
  removePhase3Finding,
  submitReview,
};
