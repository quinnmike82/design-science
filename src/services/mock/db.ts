import { agentDefinitions } from "@/data/agents";
import { reviewResultsSeed } from "@/data/results";
import { reviewSessionsSeed } from "@/data/reviews";
import { AgentRunStatus, ReviewResult, ReviewSession } from "@/types/review";
import { clone } from "@/services/mock/helpers";

function createIdleStatuses() {
  return agentDefinitions.map<AgentRunStatus>((agent) => ({
    agentId: agent.id,
    status: "idle",
    progress: 0,
  }));
}

function createCompletedStatuses() {
  return agentDefinitions.map<AgentRunStatus>((agent, index) => ({
    agentId: agent.id,
    status: "completed",
    progress: 100,
    startedAt: new Date(Date.now() - (index + 1) * 60000).toISOString(),
    completedAt: new Date(Date.now() - index * 42000).toISOString(),
  }));
}

const reviewMap = new Map<string, ReviewSession>(reviewSessionsSeed.map((review) => [review.id, clone(review)]));
const resultMap = new Map<string, ReviewResult>(reviewResultsSeed.map((result) => [result.reviewId, clone(result)]));
const statusMap = new Map<string, AgentRunStatus[]>(
  reviewSessionsSeed.map((review) => [
    review.id,
    review.status === "completed" ? createCompletedStatuses() : createIdleStatuses(),
  ]),
);

export const mockDb = {
  agents: agentDefinitions,
  reviews: reviewMap,
  results: resultMap,
  statuses: statusMap,
};
