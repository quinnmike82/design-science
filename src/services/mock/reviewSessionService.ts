import { defaultReviewDraft } from "@/features/review-session/defaultSession";
import {
  CreateReviewSessionPayload,
  ReviewSession,
  UpdateReviewSessionPayload,
} from "@/types/review";
import { mockDb } from "@/services/mock/db";
import { clone, createId, sleep } from "@/services/mock/helpers";

async function listReviews() {
  if (mockDb.reviews.size === 0) {
    await createReviewSession(defaultReviewDraft);
  }

  await sleep(180);
  return Array.from(mockDb.reviews.values())
    .map((review) => clone(review))
    .sort((left, right) => (left.createdAt < right.createdAt ? 1 : -1));
}

async function getReviewById(reviewId: string) {
  await sleep(120);
  const review = mockDb.reviews.get(reviewId);
  return review ? clone(review) : null;
}

async function createReviewSession(payload: CreateReviewSessionPayload) {
  await sleep(200);
  const review: ReviewSession = {
    id: createId("review"),
    createdAt: new Date().toISOString(),
    status: "draft",
    artifacts: payload.artifacts ?? [],
    ...payload,
  };
  mockDb.reviews.set(review.id, review);
  mockDb.statuses.set(
    review.id,
    mockDb.agents.map((agent) => ({ agentId: agent.id, status: "idle", progress: 0 })),
  );
  return clone(review);
}

async function updateReviewSession(reviewId: string, payload: UpdateReviewSessionPayload) {
  await sleep(160);
  const current = mockDb.reviews.get(reviewId);
  if (!current) {
    throw new Error(`Review session ${reviewId} was not found.`);
  }

  const updated = {
    ...current,
    ...payload,
    artifacts: payload.artifacts ?? current.artifacts,
  };

  mockDb.reviews.set(reviewId, updated);
  return clone(updated);
}

export const reviewSessionService = {
  listReviews,
  getReviewById,
  createReviewSession,
  updateReviewSession,
};
