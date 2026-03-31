import { useState } from "react";
import type {
  IssueCommentRequest,
  MarkWrongResultRequest,
  ReportFaultRequest,
  SuggestedLineFaultRequest,
} from "@/models/review-feedback.types";
import type { ReviewRunRecord } from "@/models/review.types";
import { reviewFeedbackService } from "@/services/review-feedback.service";
import { getReviewRun } from "@/services/review.service";

function toggleLoadingId(list: string[], id: string, active: boolean) {
  if (active) {
    return list.includes(id) ? list : [...list, id];
  }
  return list.filter((item) => item !== id);
}

export function useIssueFeedback(onRunUpdated: (run: ReviewRunRecord) => void) {
  const [reportingIds, setReportingIds] = useState<string[]>([]);
  const [commentingIds, setCommentingIds] = useState<string[]>([]);
  const [wrongResultIds, setWrongResultIds] = useState<string[]>([]);
  const [suggestedLineFaultIds, setSuggestedLineFaultIds] = useState<string[]>([]);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const syncUpdatedRun = (reviewRunId: string) => {
    const updatedRun = getReviewRun(reviewRunId);
    if (updatedRun) {
      onRunUpdated(updatedRun);
    }
  };

  const handleReportFault = async (request: ReportFaultRequest) => {
    setFeedbackError(null);
    setReportingIds((current) => toggleLoadingId(current, request.issueId, true));
    try {
      const response = await reviewFeedbackService.reportFault(request);
      syncUpdatedRun(response.runId);
      return response.requestStatus;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to report the issue.";
      setFeedbackError(message);
      throw error;
    } finally {
      setReportingIds((current) => toggleLoadingId(current, request.issueId, false));
    }
  };

  const handleComment = async (request: IssueCommentRequest) => {
    setFeedbackError(null);
    setCommentingIds((current) => toggleLoadingId(current, request.issueId, true));
    try {
      const response = await reviewFeedbackService.commentOnIssue(request);
      syncUpdatedRun(response.runId);
      return response.requestStatus;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save the comment.";
      setFeedbackError(message);
      throw error;
    } finally {
      setCommentingIds((current) => toggleLoadingId(current, request.issueId, false));
    }
  };

  const handleMarkWrong = async (request: MarkWrongResultRequest) => {
    setFeedbackError(null);
    setWrongResultIds((current) => toggleLoadingId(current, request.issueId, true));
    try {
      const response = await reviewFeedbackService.markWrongResult(request);
      syncUpdatedRun(response.runId);
      return response.requestStatus;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to mark the result.";
      setFeedbackError(message);
      throw error;
    } finally {
      setWrongResultIds((current) => toggleLoadingId(current, request.issueId, false));
    }
  };

  const handleSuggestedLineFault = async (request: SuggestedLineFaultRequest) => {
    const loadingId = `${request.issueId}:${request.lineKey}`;
    setFeedbackError(null);
    setSuggestedLineFaultIds((current) => toggleLoadingId(current, loadingId, true));
    try {
      const response = await reviewFeedbackService.reportSuggestedLineFault(request);
      syncUpdatedRun(response.runId);
      return response.requestStatus;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to report the suggested line fault.";
      setFeedbackError(message);
      throw error;
    } finally {
      setSuggestedLineFaultIds((current) => toggleLoadingId(current, loadingId, false));
    }
  };

  return {
    feedbackError,
    reportingIds,
    commentingIds,
    wrongResultIds,
    suggestedLineFaultIds,
    reportFault: handleReportFault,
    commentOnIssue: handleComment,
    markWrongResult: handleMarkWrong,
    reportSuggestedLineFault: handleSuggestedLineFault,
  };
}
