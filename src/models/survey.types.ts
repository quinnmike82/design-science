export type SurveyScore = 1 | 2 | 3;
export type SurveyReviewApproach = "mono" | "multiple_agent";

export interface ReviewSurvey {
  reviewApproachUsed: SurveyReviewApproach;
  feedbackClarityScore: SurveyScore;
  issueRelevanceScore: SurveyScore;
  feedbackUsefulnessScore: SurveyScore;
  trustScore: SurveyScore;
  overallSatisfactionScore: SurveyScore;
  comment?: string;
  submittedAt: string;
}

export interface SurveyFormValues {
  reviewApproachUsed: SurveyReviewApproach;
  feedbackClarityScore: SurveyScore;
  issueRelevanceScore: SurveyScore;
  feedbackUsefulnessScore: SurveyScore;
  trustScore: SurveyScore;
  overallSatisfactionScore: SurveyScore;
  comment?: string;
}

export interface SurveySubmitRequest extends SurveyFormValues {
  reviewRunId: string;
}

export interface SurveySubmitResult {
  status: "success" | "mocked";
  message: string;
}
