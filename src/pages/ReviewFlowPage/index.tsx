import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleAlert } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/common/Panel";
import { EmptyStateBlock } from "@/components/review-flow/EmptyStateBlock";
import { IssueCommentModal } from "@/components/review-flow/IssueCommentModal";
import { LoadingBlock } from "@/components/review-flow/LoadingBlock";
import { ReviewerProfileModal } from "@/components/review-flow/ReviewerProfileModal";
import { ReviewStepHeader } from "@/components/review-flow/ReviewStepHeader";
import { Step1InputSection } from "@/components/review-flow/Step1InputSection";
import { Step2SummarySection } from "@/components/review-flow/Step2SummarySection";
import { Step3MarkerReviewSection } from "@/components/review-flow/Step3MarkerReviewSection";
import { SuggestedLineFaultModal } from "@/components/review-flow/SuggestedLineFaultModal";
import { SurveyModal } from "@/components/review-flow/SurveyModal";
import { useReviewFlow } from "@/hooks/useReviewFlow";
import type { ReviewFlowStep } from "@/models/review.types";
import { cn } from "@/utils/cn";
import { formatDuration } from "@/utils/format";
import { getReviewStepMetricsSnapshot } from "@/utils/reviewTiming";

interface ReviewFlowPageProps {
  reviewRunId?: string | null;
  initialStep?: ReviewFlowStep;
}

function StatusBanner({ tone, message }: { tone: "success" | "warning" | "error"; message: string }) {
  const toneClasses = {
    success: "border-secondary/30 bg-secondary/10 text-secondary",
    warning: "border-tertiary/30 bg-tertiary/10 text-tertiary",
    error: "border-error/30 bg-error/10 text-error",
  } as const;

  const Icon = tone === "success" ? CheckCircle2 : tone === "warning" ? CircleAlert : AlertTriangle;

  return (
    <Panel className={cn("border", toneClasses[tone])}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-5 shrink-0" />
        <div className="text-sm leading-6">{message}</div>
      </div>
    </Panel>
  );
}

export function ReviewFlowPage({ reviewRunId, initialStep = 1 }: ReviewFlowPageProps) {
  const [timingNow, setTimingNow] = useState(() => Date.now());
  const {
    run,
    snippets,
    isSnippetLoading,
    snippetError,
    currentStep,
    isLoading,
    loadError,
    isSubmitting,
    submitError,
    feedbackError,
    surveyError,
    notification,
    selectedCommentIssue,
    selectedWrongResultIssue,
    selectedSuggestedLineFault,
    isSurveyModalOpen,
    isReviewerProfileModalOpen,
    reportingIds,
    commentingIds,
    wrongResultIds,
    suggestedLineFaultIds,
    isSubmittingSurvey,
    input,
    result,
    reviewerProfile,
    phase3Findings,
    survey,
    reloadSnippets,
    selectSnippet,
    addSupportingFiles,
    removeSupportingFile,
    addDeveloperNote,
    removeDeveloperNote,
    updateReviewMode,
    updateNotes,
    goToStep,
    submitCurrentReview,
    reportFault,
    openCommentModal,
    closeCommentModal,
    submitComment,
    openWrongResultModal,
    closeWrongResultModal,
    submitWrongResult,
    openSuggestedLineFaultModal,
    closeSuggestedLineFaultModal,
    submitSuggestedLineFault,
    openSurveyModal,
    closeSurveyModal,
    submitSurvey,
    openReviewerProfileModal,
    closeReviewerProfileModal,
    updateReviewerProfile,
    addPhase3Finding,
    removePhase3Finding,
  } = useReviewFlow({
    reviewRunId,
    initialStep,
  });

  useEffect(() => {
    if (!run?.stepMetrics.activeStep || !run.stepMetrics.activeStepEnteredAt) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimingNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [run?.stepMetrics.activeStep, run?.stepMetrics.activeStepEnteredAt]);

  const timingSnapshot = useMemo(
    () => getReviewStepMetricsSnapshot(run?.stepMetrics, new Date(timingNow).toISOString()),
    [run?.stepMetrics, timingNow],
  );

  if (isLoading) {
    return (
      <AppShell withSidebar>
        <div className="mx-auto max-w-[1400px]">
          <LoadingBlock
            title="Loading review flow"
            description="Preparing the current review run, persisted input, and any available result data."
          />
        </div>
      </AppShell>
    );
  }

  if (!run) {
    return (
      <AppShell withSidebar>
        <div className="mx-auto max-w-[1400px] space-y-6">
          {loadError ? <StatusBanner tone="error" message={loadError} /> : null}
          <EmptyStateBlock
            title="No review run available"
            description="Create or open a review run first, then the 3-phase review flow will become available."
          />
        </div>
      </AppShell>
    );
  }

  const maxAccessibleStep: ReviewFlowStep = result ? 3 : 1;
  const activeError = loadError ?? submitError ?? feedbackError ?? surveyError;

  return (
    <AppShell withSidebar>
      <div className="mx-auto max-w-[1400px] space-y-8">
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary">Code review workflow</div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface">Three-phase review flow</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-on-surface-variant">
                Move through the input, summary, and marker review phases, then capture extra reviewer feedback and reporting metadata in the same frontend flow.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-on-surface-variant">
                Run ID: {run.id}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-on-surface-variant">
                Status: {run.status}
              </span>
              <span className="rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1 text-secondary">
                Time spent: {formatDuration(timingSnapshot.totalActiveSec)}
              </span>
              {result ? (
                <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-primary">
                  {result.transportMode === "api" ? "Backend result" : "Mock-safe fallback"}
                </span>
              ) : null}
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-on-surface-variant transition-colors hover:border-white/20 hover:text-on-surface"
                onClick={openReviewerProfileModal}
              >
                Reviewer Profile
              </button>
            </div>
          </div>
        </div>

        <ReviewStepHeader
          currentStep={currentStep}
          maxAccessibleStep={maxAccessibleStep}
          stepTimesSec={timingSnapshot.stepTimesSec}
          onStepChange={goToStep}
        />

        {activeError ? <StatusBanner tone="error" message={activeError} /> : null}
        {notification ? <StatusBanner tone={notification.tone} message={notification.message} /> : null}

        {currentStep === 1 ? (
          <Step1InputSection
            input={input}
            snippets={snippets}
            isSnippetLoading={isSnippetLoading}
            snippetError={snippetError}
            submitting={isSubmitting}
            onReviewModeChange={updateReviewMode}
            onSnippetChange={selectSnippet}
            onReloadSnippets={reloadSnippets}
            onAddDeveloperNote={addDeveloperNote}
            onRemoveDeveloperNote={removeDeveloperNote}
            onSupportingFilesSelected={addSupportingFiles}
            onRemoveSupportingFile={removeSupportingFile}
            onNotesChange={updateNotes}
            onSubmit={submitCurrentReview}
          />
        ) : null}

        {currentStep === 2 ? (
          <Step2SummarySection
            result={result}
            reportingIds={reportingIds}
            onReportFault={reportFault}
            onContinue={() => goToStep(3)}
          />
        ) : null}

        {currentStep === 3 ? (
          <Step3MarkerReviewSection
            result={result}
            submittedFiles={input?.mainFiles}
            phase3Findings={phase3Findings}
            commentingIds={commentingIds}
            wrongResultIds={wrongResultIds}
            suggestedLineFaultIds={suggestedLineFaultIds}
            onBackToSummary={() => goToStep(2)}
            onOpenSurvey={openSurveyModal}
            onOpenComment={openCommentModal}
            onOpenWrongResult={openWrongResultModal}
            onOpenSuggestedLineFault={openSuggestedLineFaultModal}
            onAddPhase3Finding={addPhase3Finding}
            onRemovePhase3Finding={removePhase3Finding}
          />
        ) : null}
      </div>

      <IssueCommentModal
        open={Boolean(selectedCommentIssue)}
        title={selectedCommentIssue ? `Comment on ${selectedCommentIssue.title}` : "Comment"}
        description="Add comment feedback for this review result."
        confirmLabel="Save Comment"
        loading={selectedCommentIssue ? commentingIds.includes(selectedCommentIssue.id) : false}
        onClose={closeCommentModal}
        onSubmit={submitComment}
      />

      <IssueCommentModal
        open={Boolean(selectedWrongResultIssue)}
        title={selectedWrongResultIssue ? `Mark ${selectedWrongResultIssue.title} as wrong` : "Mark wrong result"}
        description="Optionally explain why this review result is wrong before saving the structured feedback."
        confirmLabel="Save Wrong Result"
        loading={selectedWrongResultIssue ? wrongResultIds.includes(selectedWrongResultIssue.id) : false}
        onClose={closeWrongResultModal}
        onSubmit={submitWrongResult}
      />

      <SuggestedLineFaultModal
        open={Boolean(selectedSuggestedLineFault)}
        title={
          selectedSuggestedLineFault
            ? `Report faulty suggestion in ${selectedSuggestedLineFault.issue.title}`
            : "Report faulty suggested line"
        }
        linePreview={selectedSuggestedLineFault?.lineText ?? ""}
        loading={
          selectedSuggestedLineFault
            ? suggestedLineFaultIds.includes(
                `${selectedSuggestedLineFault.issue.id}:${selectedSuggestedLineFault.lineKey}`,
              )
            : false
        }
        onClose={closeSuggestedLineFaultModal}
        onSubmit={submitSuggestedLineFault}
      />

      <SurveyModal
        open={isSurveyModalOpen}
        loading={isSubmittingSurvey}
        reviewMode={input?.reviewMode}
        initialSurvey={survey}
        onClose={closeSurveyModal}
        onSubmit={submitSurvey}
      />

      <ReviewerProfileModal
        open={isReviewerProfileModalOpen}
        loading={isSubmitting}
        profile={reviewerProfile}
        onClose={closeReviewerProfileModal}
        onChange={updateReviewerProfile}
      />
    </AppShell>
  );
}
