import { apiRequest } from "@/services/api/client";
import type {
  FeedbackActionResult,
  IssueCommentRequest,
  MarkWrongResultRequest,
  ReportFaultRequest,
  SuggestedLineFaultRequest,
} from "@/models/review-feedback.types";
import { updateStoredReviewRun } from "@/services/review.service";
import { createId } from "@/utils/id";

interface ReviewFeedbackMutationResult {
  requestStatus: FeedbackActionResult;
  runId: string;
}

async function postWithMockFallback(path: string, payload: object) {
  try {
    await apiRequest<unknown>(path, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      status: "success",
      message: "Saved successfully.",
    } satisfies FeedbackActionResult;
  } catch {
    // TODO: remove the mock-success fallback once the backend feedback endpoints are available everywhere.
    return {
      status: "mocked",
      message: "Saved locally while backend feedback endpoints are unavailable.",
    } satisfies FeedbackActionResult;
  }
}

export async function reportFault(request: ReportFaultRequest): Promise<ReviewFeedbackMutationResult> {
  const requestStatus = await postWithMockFallback("/review-feedback/report-fault", {
    reviewRunId: request.reviewRunId,
    issueId: request.issueId,
    sourceStep: request.sourceStep,
    reason: request.reason,
  });

  updateStoredReviewRun(request.reviewRunId, (run) => ({
    ...run,
    result: run.result
      ? {
          ...run.result,
          issues: run.result.issues.map((issue) =>
            issue.id === request.issueId
              ? {
                  ...issue,
                  feedback: {
                    ...issue.feedback,
                    reportedFault: {
                      createdAt: new Date().toISOString(),
                      reason: request.reason,
                      sourceStep: request.sourceStep,
                    },
                  },
                }
              : issue,
          ),
        }
      : run.result,
  }));

  return {
    requestStatus,
    runId: request.reviewRunId,
  };
}

export async function commentOnIssue(request: IssueCommentRequest): Promise<ReviewFeedbackMutationResult> {
  const requestStatus = await postWithMockFallback("/review-feedback/comment", {
    reviewRunId: request.reviewRunId,
    issueId: request.issueId,
    sourceStep: request.sourceStep,
    commentText: request.commentText,
  });

  updateStoredReviewRun(request.reviewRunId, (run) => ({
    ...run,
    result: run.result
      ? {
          ...run.result,
          issues: run.result.issues.map((issue) =>
            issue.id === request.issueId
              ? {
                  ...issue,
                  feedback: {
                    ...issue.feedback,
                    comments: [
                      ...issue.feedback.comments,
                      {
                        id: createId("issue-comment"),
                        commentText: request.commentText,
                        createdAt: new Date().toISOString(),
                        sourceStep: request.sourceStep,
                      },
                    ],
                  },
                }
              : issue,
          ),
        }
      : run.result,
  }));

  return {
    requestStatus,
    runId: request.reviewRunId,
  };
}

export async function markWrongResult(request: MarkWrongResultRequest): Promise<ReviewFeedbackMutationResult> {
  const requestStatus = await postWithMockFallback("/review-feedback/mark-wrong", {
    reviewRunId: request.reviewRunId,
    issueId: request.issueId,
    sourceStep: request.sourceStep,
    isWrong: request.isWrong,
    note: request.note,
  });

  updateStoredReviewRun(request.reviewRunId, (run) => ({
    ...run,
    result: run.result
      ? {
          ...run.result,
          issues: run.result.issues.map((issue) =>
            issue.id === request.issueId
              ? {
                  ...issue,
                  feedback: {
                    ...issue.feedback,
                    wrongResult: {
                      isWrong: true,
                      note: request.note,
                      createdAt: new Date().toISOString(),
                      sourceStep: request.sourceStep,
                    },
                  },
                }
              : issue,
          ),
        }
      : run.result,
  }));

  return {
    requestStatus,
    runId: request.reviewRunId,
  };
}

export async function reportSuggestedLineFault(
  request: SuggestedLineFaultRequest,
): Promise<ReviewFeedbackMutationResult> {
  const requestStatus = await postWithMockFallback("/review-feedback/suggested-line-fault", {
    reviewRunId: request.reviewRunId,
    issueId: request.issueId,
    lineKey: request.lineKey,
    lineText: request.lineText,
    suggestedLineNumber: request.suggestedLineNumber,
    faultType: request.faultType,
    commentText: request.commentText,
    sourceStep: request.sourceStep,
  });

  updateStoredReviewRun(request.reviewRunId, (run) => ({
    ...run,
    result: run.result
      ? {
          ...run.result,
          issues: run.result.issues.map((issue) =>
            issue.id === request.issueId
              ? {
                  ...issue,
                  feedback: {
                    ...issue.feedback,
                    suggestedLineReports: [
                      ...issue.feedback.suggestedLineReports.filter((report) => report.lineKey !== request.lineKey),
                      {
                        id: createId("line-fault"),
                        lineKey: request.lineKey,
                        lineText: request.lineText,
                        suggestedLineNumber: request.suggestedLineNumber,
                        faultType: request.faultType,
                        commentText: request.commentText?.trim() || undefined,
                        createdAt: new Date().toISOString(),
                        sourceStep: request.sourceStep,
                      },
                    ],
                  },
                }
              : issue,
          ),
        }
      : run.result,
  }));

  return {
    requestStatus,
    runId: request.reviewRunId,
  };
}

export const reviewFeedbackService = {
  reportFault,
  commentOnIssue,
  markWrongResult,
  reportSuggestedLineFault,
};
