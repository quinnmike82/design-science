import {
  ApiEvaluationResponse,
  ApiExperimentStartResponse,
  ApiReviewResponse,
  ApiReviewSubmissionRequest,
  ApiSnippetDetail,
  ApiSnippetListResponse,
  ApiReviewMode,
} from "@/types/api";
import { apiRequest } from "@/services/api/client";

export interface ReviewSnippetInput {
  snippetId: string;
  context?: string;
  mode: ApiReviewMode;
}

async function listSnippets() {
  return apiRequest<ApiSnippetListResponse>("/snippets");
}

async function getSnippet(snippetId: string) {
  return apiRequest<ApiSnippetDetail>(`/snippets/${snippetId}`);
}

async function startExperiment() {
  return apiRequest<ApiExperimentStartResponse>("/api/analytics/start", {
    method: "POST",
  });
}

async function evaluateDeveloperReview(payload: ApiReviewSubmissionRequest) {
  return apiRequest<ApiEvaluationResponse>("/api/analytics/evaluate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function reviewSnippet({ snippetId, context, mode }: ReviewSnippetInput) {
  const endpoint = mode === "monolithic" ? "/review/monolithic" : "/review/specialist";
  return apiRequest<ApiReviewResponse>(endpoint, {
    method: "POST",
    body: JSON.stringify({
      snippet_id: snippetId,
      context,
    }),
  });
}

export const reviewApi = {
  listSnippets,
  getSnippet,
  startExperiment,
  evaluateDeveloperReview,
  reviewSnippet,
};
