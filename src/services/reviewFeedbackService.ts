import { reviewApi } from "@/services/api/reviewApi";
import { loadResults, saveResults } from "@/services/local/persistence";
import { FindingReport, IssueReportReason, ReviewCondition, ReviewResult, ReviewSurvey } from "@/types/review";

function updateStoredResult(reviewId: string, updater: (result: ReviewResult) => ReviewResult) {
  const results = loadResults();
  const current = results[reviewId];
  if (!current) {
    throw new Error(`Review result ${reviewId} was not found.`);
  }

  const updated = updater(current);
  saveResults({
    ...results,
    [reviewId]: updated,
  });
  return updated;
}

async function reportFinding(input: {
  reviewId: string;
  sessionId: string;
  snippetId: string;
  findingId: string;
  findingTitle: string;
  agentId: string;
  reviewMode: ReviewCondition;
  reason: IssueReportReason;
  details: string;
}) {
  await reviewApi.reportIssue({
    session_id: input.sessionId,
    review_id: input.reviewId,
    snippet_id: input.snippetId,
    finding_id: input.findingId,
    finding_title: input.findingTitle,
    agent_id: input.agentId,
    review_mode: input.reviewMode,
    reason: input.reason,
    details: input.details,
  });

  return updateStoredResult(input.reviewId, (result) => {
    const nextReport: FindingReport = {
      findingId: input.findingId,
      reason: input.reason,
      details: input.details,
      submittedAt: new Date().toISOString(),
    };

    return {
      ...result,
      issueReports: [
        ...(result.issueReports ?? []).filter((report) => report.findingId !== input.findingId),
        nextReport,
      ],
    };
  });
}

async function submitSurvey(reviewId: string, sessionId: string, survey: Omit<ReviewSurvey, "submittedAt">) {
  await reviewApi.submitSurvey({
    session_id: sessionId,
    tlx_mental: survey.tlxMental,
    tlx_physical: survey.tlxPhysical,
    tlx_temporal: survey.tlxTemporal,
    tlx_performance: survey.tlxPerformance,
    tlx_effort: survey.tlxEffort,
    tlx_frustration: survey.tlxFrustration,
    trust_score: survey.trustScore,
    method_helpfulness: survey.methodHelpfulness,
    method_clarity: survey.methodClarity,
    method_actionability: survey.methodActionability,
    platform_usability: survey.platformUsability,
    platform_speed: survey.platformSpeed,
    platform_design: survey.platformDesign,
    preferred_mode: survey.preferredMode,
    feedback_comment: survey.feedbackComment,
  });

  return updateStoredResult(reviewId, (result) => ({
    ...result,
    survey: {
      ...survey,
      submittedAt: new Date().toISOString(),
    },
  }));
}

export const reviewFeedbackService = {
  reportFinding,
  submitSurvey,
};
