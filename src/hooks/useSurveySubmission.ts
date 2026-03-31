import { useState } from "react";
import type { ReviewRunRecord } from "@/models/review.types";
import type { SurveySubmitRequest } from "@/models/survey.types";
import { getReviewRun } from "@/services/review.service";
import { surveyService } from "@/services/survey.service";

export function useSurveySubmission(onRunUpdated: (run: ReviewRunRecord) => void) {
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);
  const [surveyError, setSurveyError] = useState<string | null>(null);

  const submitReviewSurvey = async (request: SurveySubmitRequest) => {
    setSurveyError(null);
    setIsSubmittingSurvey(true);
    try {
      const response = await surveyService.submitSurvey(request);
      const updatedRun = getReviewRun(request.reviewRunId);
      if (updatedRun) {
        onRunUpdated(updatedRun);
      }
      return response.requestStatus;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit the survey.";
      setSurveyError(message);
      throw error;
    } finally {
      setIsSubmittingSurvey(false);
    }
  };

  return {
    isSubmittingSurvey,
    surveyError,
    submitSurvey: submitReviewSurvey,
  };
}
