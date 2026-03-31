import { reviewApi } from "@/services/api/reviewApi";
import { loadResults, loadSessions, saveResults, saveSessions } from "@/services/local/persistence";
import { createId } from "@/utils/id";
import {
  CreateReviewSessionPayload,
  ReviewSession,
  ReviewStatus,
  UpdateReviewSessionPayload,
} from "@/types/review";
import { mapSnippetDetail, mapSnippetSummary, normalizeLanguage } from "@/features/review-results/mappers";

function sortSessions(sessions: ReviewSession[]) {
  return [...sessions].sort((left, right) => (left.createdAt < right.createdAt ? 1 : -1));
}

async function createBootstrapSession() {
  const snippetList = await reviewApi.listSnippets();
  const firstSnippet = snippetList.snippets.find((item) => item.id === "snippet_01") ?? snippetList.snippets[0];

  if (!firstSnippet) {
    return [];
  }

  const detail = mapSnippetDetail(await reviewApi.getSnippet(firstSnippet.id));
  const summary = mapSnippetSummary(firstSnippet);

  const session: ReviewSession = {
    id: createId("review"),
    title: `Developer Coaching for ${summary.id}`,
    description: detail.context || "Review the seeded snippet, submit your own findings, then compare them against the AI coaching response.",
    projectType: "Backend Service",
    language: normalizeLanguage(detail.language),
    stakeholderRole: "DEV",
    createdAt: new Date().toISOString(),
    status: "draft",
    artifacts: [],
    snippetId: detail.id,
    snippetTitle: detail.label,
    snippetContext: detail.context,
    snippetLanguage: detail.language,
    snippetCode: detail.code,
    developerComments: [],
    reviewStartedAt: new Date().toISOString(),
    reviewMode: "specialist",
  };

  saveSessions([session]);
  saveResults({});
  return [session];
}

async function listReviews() {
  const existing = sortSessions(loadSessions());
  if (existing.length > 0) {
    return existing;
  }

  return createBootstrapSession();
}

async function getReviewById(reviewId: string) {
  const sessions = loadSessions();
  const match = sessions.find((session) => session.id === reviewId) ?? null;
  return match;
}

async function createReviewSession(payload: CreateReviewSessionPayload) {
  const sessions = loadSessions();
  const session: ReviewSession = {
    id: createId("review"),
    createdAt: new Date().toISOString(),
    status: "draft",
    artifacts: payload.artifacts ?? [],
    developerComments: payload.developerComments ?? [],
    reviewMode: payload.reviewMode ?? "specialist",
    reviewStartedAt: payload.reviewStartedAt ?? new Date().toISOString(),
    ...payload,
  };

  saveSessions(sortSessions([session, ...sessions]));
  return session;
}

async function createFreshReviewSession(source?: ReviewSession) {
  let template = source;

  if (!template) {
    const existing = sortSessions(loadSessions());
    if (existing.length > 0) {
      template = existing[0];
    } else {
      template = (await createBootstrapSession())[0];
    }
  }

  if (!template) {
    throw new Error("A review template could not be created.");
  }

  return createReviewSession({
    title: template.title,
    description: template.description,
    projectType: template.projectType,
    language: template.language,
    stakeholderRole: template.stakeholderRole,
    snippetId: template.snippetId,
    snippetTitle: template.snippetTitle,
    snippetContext: template.snippetContext,
    snippetLanguage: template.snippetLanguage,
    snippetCode: template.snippetCode,
    reviewMode: template.reviewMode,
    artifacts: [],
    developerComments: [],
    reviewStartedAt: new Date().toISOString(),
  });
}

async function updateReviewSession(reviewId: string, payload: UpdateReviewSessionPayload) {
  const sessions = loadSessions();
  const current = sessions.find((session) => session.id === reviewId);

  if (!current) {
    throw new Error(`Review session ${reviewId} was not found.`);
  }

  const updated: ReviewSession = {
    ...current,
    ...payload,
    status: (payload.status as ReviewStatus | undefined) ?? current.status,
    artifacts: payload.artifacts ?? current.artifacts,
    developerComments: payload.developerComments ?? current.developerComments,
  };

  saveSessions(sortSessions(sessions.map((session) => (session.id === reviewId ? updated : session))));
  return updated;
}

export const reviewSessionService = {
  listReviews,
  getReviewById,
  createReviewSession,
  createFreshReviewSession,
  updateReviewSession,
};
