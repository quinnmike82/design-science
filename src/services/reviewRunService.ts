import { agentDefinitions } from "@/data/agents";
import { mapApiReviewToResult, mapSnippetSummary, mapSnippetDetail } from "@/features/review-results/mappers";
import { reviewApi } from "@/services/api/reviewApi";
import { loadResults, saveResults } from "@/services/local/persistence";
import { reviewSessionService } from "@/services/reviewSessionService";
import { AgentRunStatus, ReviewResult, ReviewSession } from "@/types/review";

type StatusListener = (statuses: AgentRunStatus[]) => void;

function createIdleStatuses(): AgentRunStatus[] {
  return agentDefinitions.map((agent) => ({
    agentId: agent.id,
    status: "idle",
    progress: 0,
  }));
}

function createCompletedStatuses(timestamp?: string): AgentRunStatus[] {
  return agentDefinitions.map((agent) => ({
    agentId: agent.id,
    status: "completed",
    progress: 100,
    startedAt: timestamp,
    completedAt: timestamp,
  }));
}

function emitQueuedStatuses(listener?: StatusListener) {
  if (!listener) {
    return;
  }

  listener(
    agentDefinitions.map((agent) => ({
      agentId: agent.id,
      status: "queued",
      progress: 10,
    })),
  );
}

function emitRunningStatuses(listener?: StatusListener) {
  if (!listener) {
    return;
  }

  listener(
    agentDefinitions.map((agent, index) => ({
      agentId: agent.id,
      status: index < 3 ? "completed" : "running",
      progress: index < 3 ? 100 : 48,
      startedAt: new Date().toISOString(),
      completedAt: index < 3 ? new Date().toISOString() : undefined,
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
  return results[reviewId] ?? null;
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

  emitQueuedStatuses(listener);

  const experiment = await reviewApi.startExperiment();
  const startedAt = session.reviewStartedAt ? new Date(session.reviewStartedAt) : new Date(session.createdAt);
  const submittedAt = new Date();
  const timeSpentSec = Math.max(1, Math.round((submittedAt.getTime() - startedAt.getTime()) / 1000));

  emitRunningStatuses(listener);

  const evaluation = await reviewApi.evaluateDeveloperReview({
    session_id: experiment.session_id,
    snippet_id: session.snippetId,
    time_spent_sec: timeSpentSec,
    flagged_issues: session.developerComments
      .filter((comment): comment is ReviewSession["developerComments"][number] & { lineStart: number } => Boolean(comment.lineStart))
      .map((comment) => ({
        line: comment.lineStart,
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

  listener?.(createCompletedStatuses(finishedAt));

  return result;
}

async function getAgentStatuses(reviewId: string) {
  const session = await reviewSessionService.getReviewById(reviewId);
  if (!session) {
    return createIdleStatuses();
  }

  if (session.status === "completed") {
    return createCompletedStatuses(session.submittedAt);
  }

  return createIdleStatuses();
}

export const reviewRunService = {
  listAvailableSnippets,
  getSnippetDetail,
  runReview,
  getReviewResult,
  getAgentStatuses,
};
