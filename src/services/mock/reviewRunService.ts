import { mockDb } from "@/services/mock/db";
import { clone, sleep } from "@/services/mock/helpers";
import { AgentRunStatus, ReviewResult } from "@/types/review";

type StatusListener = (statuses: AgentRunStatus[]) => void;

function writeStatuses(reviewId: string, statuses: AgentRunStatus[]) {
  mockDb.statuses.set(reviewId, statuses);
  return clone(statuses);
}

async function getAgentStatuses(reviewId: string) {
  await sleep(120);
  return clone(mockDb.statuses.get(reviewId) ?? []);
}

async function getReviewResult(reviewId: string) {
  await sleep(180);
  const result = mockDb.results.get(reviewId);
  return result ? clone(result) : null;
}

async function runReview(reviewId: string, listener?: StatusListener): Promise<ReviewResult> {
  const review = mockDb.reviews.get(reviewId);
  const result = mockDb.results.get(reviewId);

  if (!review || !result) {
    throw new Error(`Mock review data for ${reviewId} is incomplete.`);
  }

  review.status = "running";
  mockDb.reviews.set(reviewId, review);

  const initial = mockDb.agents.map<AgentRunStatus>((agent) => ({
    agentId: agent.id,
    status: "queued",
    progress: 6,
  }));

  listener?.(writeStatuses(reviewId, initial));
  await sleep(360);

  for (let index = 0; index < initial.length; index += 1) {
    const runningStatuses = clone(mockDb.statuses.get(reviewId) ?? initial);

    runningStatuses[index] = {
      ...runningStatuses[index],
      status: "running",
      progress: 32,
      startedAt: new Date().toISOString(),
    };
    listener?.(writeStatuses(reviewId, runningStatuses));
    await sleep(320);

    runningStatuses[index] = {
      ...runningStatuses[index],
      status: "running",
      progress: 74,
      startedAt: runningStatuses[index].startedAt,
    };
    listener?.(writeStatuses(reviewId, runningStatuses));
    await sleep(280);

    runningStatuses[index] = {
      ...runningStatuses[index],
      status: "completed",
      progress: 100,
      startedAt: runningStatuses[index].startedAt,
      completedAt: new Date().toISOString(),
    };
    listener?.(writeStatuses(reviewId, runningStatuses));
    await sleep(180);
  }

  review.status = "completed";
  mockDb.reviews.set(reviewId, review);

  return clone(result);
}

export const reviewRunService = {
  runReview,
  getReviewResult,
  getAgentStatuses,
};
