import { getReviewAgentDefinitions } from "@/data/agents";
import { mapApiReviewToResult, mapSnippetSummary, mapSnippetDetail } from "@/features/review-results/mappers";
import { reviewApi } from "@/services/api/reviewApi";
import { loadResults, saveResults } from "@/services/local/persistence";
import { reviewSessionService } from "@/services/reviewSessionService";
import { AgentRunStatus, ReviewMode, ReviewResult, ReviewSession } from "@/types/review";

type StatusListener = (statuses: AgentRunStatus[]) => void;

function createIdleStatuses(mode: ReviewMode): AgentRunStatus[] {
  return getReviewAgentDefinitions(mode).map((agent) => ({
    agentId: agent.id,
    status: "idle",
    progress: 0,
  }));
}

function createCompletedStatuses(mode: ReviewMode, timestamp?: string): AgentRunStatus[] {
  return getReviewAgentDefinitions(mode).map((agent) => ({
    agentId: agent.id,
    status: "completed",
    progress: 100,
    startedAt: timestamp,
    completedAt: timestamp,
  }));
}

function emitQueuedStatuses(mode: ReviewMode, listener?: StatusListener) {
  if (!listener) {
    return;
  }

  listener(
    getReviewAgentDefinitions(mode).map((agent) => ({
      agentId: agent.id,
      status: "queued",
      progress: 10,
    })),
  );
}

function emitRunningStatuses(mode: ReviewMode, listener?: StatusListener) {
  if (!listener) {
    return;
  }

  const agents = getReviewAgentDefinitions(mode);
  listener(
    agents.map((agent, index) => ({
      agentId: agent.id,
      status: mode === "monolithic" ? "running" : index < 3 ? "completed" : "running",
      progress: mode === "monolithic" ? 64 : index < 3 ? 100 : 48,
      startedAt: new Date().toISOString(),
      completedAt: mode === "monolithic" ? undefined : index < 3 ? new Date().toISOString() : undefined,
    })),
  );
}

async function listAvailableSnippets() {
  const response = await reviewApi.listSnippets();
  return response.snippets.map(mapSnippetSummary);
}

async function getSnippetDetail(snippetId: string) {
  return mapSnippetDetail(await reviewApi.getSnippet(snippetId));
}

async function getReviewResult(reviewId: string) {
  const results = loadResults();
  const result = results[reviewId];
  if (!result) {
    return null;
  }

  return {
    ...result,
    issueReports: result.issueReports ?? [],
    developerComments: result.developerComments ?? [],
  };
}

async function runReview(reviewId: string, listener?: StatusListener): Promise<ReviewResult> {
  const session = await reviewSessionService.getReviewById(reviewId);
  if (!session) {
    throw new Error(`Review session ${reviewId} was not found.`);
  }

  await reviewSessionService.updateReviewSession(reviewId, {
    status: "running",
    reviewStartedAt: session.reviewStartedAt ?? new Date().toISOString(),
  });

  emitQueuedStatuses(session.reviewMode, listener);

  const experiment = await reviewApi.startExperiment(session.reviewMode);
  const startedAt = session.reviewStartedAt ? new Date(session.reviewStartedAt) : new Date(session.createdAt);
  const submittedAt = new Date();
  const timeSpentSec = Math.max(1, Math.round((submittedAt.getTime() - startedAt.getTime()) / 1000));

  emitRunningStatuses(session.reviewMode, listener);

  const evaluation = await reviewApi.evaluateDeveloperReview({
    session_id: experiment.session_id,
    snippet_id: session.snippetId,
    time_spent_sec: timeSpentSec,
    flagged_issues: session.developerComments
      .filter((comment): comment is ReviewSession["developerComments"][number] & { lineStart: number } => Boolean(comment.lineStart))
      .map((comment) => ({
        line: comment.lineStart,
        line_start: comment.lineStart,
        line_end: comment.lineEnd ?? comment.lineStart,
        title: comment.title,
      })),
  });

  const apiReview = await reviewApi.reviewSnippet({
    snippetId: session.snippetId,
    context: session.description || session.snippetContext,
    mode: session.reviewMode,
  });

  const result = mapApiReviewToResult({
    reviewId,
    sessionId: experiment.session_id,
    snippetId: session.snippetId,
    snippetLanguage: session.snippetLanguage,
    apiReview,
    evaluation,
    developerComments: session.developerComments,
    analyticsCondition: experiment.condition,
  });

  result.metrics.timeSpentSec = timeSpentSec;

  const existingResults = loadResults();
  saveResults({
    ...existingResults,
    [reviewId]: result,
  });

  const finishedAt = new Date().toISOString();
  await reviewSessionService.updateReviewSession(reviewId, {
    backendSessionId: experiment.session_id,
    analyticsCondition: experiment.condition,
    status: "completed",
    submittedAt: finishedAt,
    timeSpentSec,
  });

  listener?.(createCompletedStatuses(session.reviewMode, finishedAt));

  return result;
}

async function getAgentStatuses(reviewId: string) {
  const session = await reviewSessionService.getReviewById(reviewId);
  if (!session) {
    return createIdleStatuses("specialist");
  }

  if (session.status === "completed") {
    return createCompletedStatuses(session.reviewMode, session.submittedAt);
  }

  return createIdleStatuses(session.reviewMode);
}

export const reviewRunService = {
  listAvailableSnippets,
  getSnippetDetail,
  runReview,
  getReviewResult,
  getAgentStatuses,
};
