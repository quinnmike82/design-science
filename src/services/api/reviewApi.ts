import {
  ApiEvaluationResponse,
  ApiExperimentStartRequest,
  ApiExperimentStartResponse,
  ApiIssueReportRequest,
  ApiReviewResponse,
  ApiReviewSubmissionRequest,
  ApiSnippetDetail,
  ApiSnippetListResponse,
  ApiReviewMode,
  ApiSurveySubmissionRequest,
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

async function startExperiment(preferredCondition?: ApiReviewMode) {
  const payload: ApiExperimentStartRequest | undefined = preferredCondition
    ? { preferred_condition: preferredCondition }
    : undefined;
  return apiRequest<ApiExperimentStartResponse>("/api/analytics/start", {
    method: "POST",
    body: payload ? JSON.stringify(payload) : undefined,
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

async function submitSurvey(payload: ApiSurveySubmissionRequest) {
  return apiRequest<{ status: string; message: string }>("/api/analytics/survey", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function reportIssue(payload: ApiIssueReportRequest) {
  return apiRequest<{ status: string; report_id: string }>("/api/feedback/issues", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export const reviewApi = {
  listSnippets,
  getSnippet,
  startExperiment,
  evaluateDeveloperReview,
  reviewSnippet,
  submitSurvey,
  reportIssue,
};
