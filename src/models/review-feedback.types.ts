export type ReviewFeedbackSourceStep = "summary" | "marker_review";
export type SuggestedLineFaultType = "incorrect_fix" | "wrong_logic" | "unsafe_change" | "not_applicable" | "other";

export interface ReviewIssueComment {
  id: string;
  commentText: string;
  createdAt: string;
  sourceStep: Extract<ReviewFeedbackSourceStep, "marker_review">;
}

export interface ReviewIssueFaultReport {
  reason?: string;
  createdAt: string;
  sourceStep: ReviewFeedbackSourceStep;
}

export interface ReviewIssueWrongResult {
  isWrong: true;
  note?: string;
  createdAt: string;
  sourceStep: Extract<ReviewFeedbackSourceStep, "marker_review">;
}

export interface ReviewSuggestedLineFaultReport {
  id: string;
  lineKey: string;
  lineText: string;
  suggestedLineNumber?: number;
  faultType: SuggestedLineFaultType;
  commentText?: string;
  createdAt: string;
  sourceStep: Extract<ReviewFeedbackSourceStep, "marker_review">;
}

export interface ReviewIssueFeedbackState {
  reportedFault?: ReviewIssueFaultReport;
  comments: ReviewIssueComment[];
  wrongResult?: ReviewIssueWrongResult;
  suggestedLineReports: ReviewSuggestedLineFaultReport[];
}

export interface ReportFaultRequest {
  reviewRunId: string;
  issueId: string;
  sourceStep: Extract<ReviewFeedbackSourceStep, "summary">;
  reason?: string;
}

export interface IssueCommentRequest {
  reviewRunId: string;
  issueId: string;
  commentText: string;
  sourceStep: Extract<ReviewFeedbackSourceStep, "marker_review">;
}

export interface MarkWrongResultRequest {
  reviewRunId: string;
  issueId: string;
  isWrong: true;
  sourceStep: Extract<ReviewFeedbackSourceStep, "marker_review">;
  note?: string;
}

export interface SuggestedLineFaultRequest {
  reviewRunId: string;
  issueId: string;
  lineKey: string;
  lineText: string;
  suggestedLineNumber?: number;
  faultType: SuggestedLineFaultType;
  commentText?: string;
  sourceStep: Extract<ReviewFeedbackSourceStep, "marker_review">;
}

export interface FeedbackActionResult {
  status: "success" | "mocked";
  message: string;
}
