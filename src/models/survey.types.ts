export type SurveyScore = 1 | 2 | 3;
export type SurveyPreferredMode = "mono" | "multiple_agent" | "no_preference";

export interface ReviewSurvey {
  findingsQualityScore: SurveyScore;
  modeFitScore: SurveyScore;
  codeReviewClarityScore: SurveyScore;
  trustScore: SurveyScore;
  preferredMode?: SurveyPreferredMode;
  comment?: string;
  submittedAt: string;
}

export interface SurveyFormValues {
  findingsQualityScore: SurveyScore;
  modeFitScore: SurveyScore;
  codeReviewClarityScore: SurveyScore;
  trustScore: SurveyScore;
  preferredMode?: SurveyPreferredMode;
  comment?: string;
}

export interface SurveySubmitRequest extends SurveyFormValues {
  reviewRunId: string;
}

export interface SurveySubmitResult {
  status: "success" | "mocked";
  message: string;
}
