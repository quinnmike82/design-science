import { apiRequest } from "@/services/api/client";
import type { ReviewSurvey, SurveySubmitRequest, SurveySubmitResult } from "@/models/survey.types";
import { updateStoredReviewRun } from "@/services/review.service";

interface SurveyMutationResult {
  requestStatus: SurveySubmitResult;
  survey: ReviewSurvey;
}

async function postSurveyWithFallback(payload: SurveySubmitRequest) {
  try {
    await apiRequest<unknown>("/review-feedback/survey", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      status: "success",
      message: "Survey submitted.",
    } satisfies SurveySubmitResult;
  } catch {
    // TODO: swap this local-only persistence path for the real survey endpoint when the backend is ready.
    return {
      status: "mocked",
      message: "Survey saved locally while backend support is pending.",
    } satisfies SurveySubmitResult;
  }
}

export async function submitSurvey(request: SurveySubmitRequest): Promise<SurveyMutationResult> {
  const requestStatus = await postSurveyWithFallback(request);
  const survey: ReviewSurvey = {
    findingsQualityScore: request.findingsQualityScore,
    modeFitScore: request.modeFitScore,
    codeReviewClarityScore: request.codeReviewClarityScore,
    trustScore: request.trustScore,
    preferredMode: request.preferredMode,
    comment: request.comment?.trim() || undefined,
    submittedAt: new Date().toISOString(),
  };

  updateStoredReviewRun(request.reviewRunId, (run) => ({
    ...run,
    survey,
  }));

  return {
    requestStatus,
    survey,
  };
}

export const surveyService = {
  submitSurvey,
};
