import { useEffect, useRef, useState } from "react";
import { useIssueFeedback } from "@/hooks/useIssueFeedback";
import { useReviewResults } from "@/hooks/useReviewResults";
import { useReviewSubmission } from "@/hooks/useReviewSubmission";
import { useSurveySubmission } from "@/hooks/useSurveySubmission";
import type { SuggestedLineFaultType } from "@/models/review-feedback.types";
import type {
  ReviewFlowStep,
  ReviewPhaseFinding,
  ReviewInputFile,
  ReviewInputState,
  ReviewIssueViewModel,
  ReviewLineNote,
  ReviewReviewerProfile,
  ReviewSourceSnippetDetail,
  ReviewSourceSnippetSummary,
} from "@/models/review.types";
import type { SurveyFormValues } from "@/models/survey.types";
import { reviewRunService } from "@/services/reviewRunService";
import {
  addPhase3Finding,
  ensureReviewerProfile,
  removePhase3Finding,
  pauseReviewRunStepTracking,
  resumeReviewRunStepTracking,
  setReviewRunCurrentStep,
  updateReviewerProfile as persistReviewerProfile,
  updateReviewInput,
} from "@/services/review.service";
import { createId } from "@/utils/id";

interface FlowNotification {
  tone: "success" | "warning" | "error";
  message: string;
}

interface UseReviewFlowOptions {
  reviewRunId?: string | null;
  initialStep?: ReviewFlowStep;
}

interface SuggestedLineFaultDraft {
  issue: ReviewIssueViewModel;
  lineKey: string;
  lineText: string;
  suggestedLineNumber?: number;
}

function getSafeStep(step?: ReviewFlowStep) {
  return step ?? 1;
}

function inferSupportingDocumentType(fileName: string): ReviewInputFile["documentType"] {
  const lower = fileName.toLowerCase();
  if (lower.includes("fsd") || lower.includes("spec")) {
    return "fsd";
  }
  if (lower.includes("test")) {
    return "testcase";
  }
  if (lower.includes("note")) {
    return "notes";
  }
  return "other";
}

function buildSnippetMainFile(snippet: ReviewSourceSnippetDetail): ReviewInputFile {
  const extensionMap: Record<string, string> = {
    python: "py",
    typescript: "ts",
    javascript: "js",
    go: "go",
    java: "java",
    kotlin: "kt",
  };

  const extension = extensionMap[snippet.language.toLowerCase()] ?? "txt";
  return {
    id: `snippet-file-${snippet.id}`,
    kind: "main",
    name: `snippets/${snippet.id}.${extension}`,
    content: snippet.code,
    size: snippet.code.length,
    uploadedAt: new Date().toISOString(),
  };
}

async function readBrowserFiles(files: FileList | File[], kind: ReviewInputFile["kind"]): Promise<ReviewInputFile[]> {
  const list = Array.from(files);
  const uploadedAt = new Date().toISOString();

  return Promise.all(
    list.map(async (file) => ({
      id: createId(kind === "main" ? "main-file" : "support-file"),
      kind,
      name: file.name,
      content: await file.text(),
      size: file.size,
      uploadedAt,
      documentType: kind === "supporting" ? inferSupportingDocumentType(file.name) : undefined,
    })),
  );
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    window.setTimeout(() => resolve(), 0);
  });
}

export function useReviewFlow({ reviewRunId, initialStep }: UseReviewFlowOptions) {
  const { run, isLoading, error, setRun } = useReviewResults(reviewRunId);
  const { isSubmitting, submitError, submitReview } = useReviewSubmission();
  const {
    feedbackError,
    reportingIds,
    commentingIds,
    wrongResultIds,
    suggestedLineFaultIds,
    reportFault,
    commentOnIssue,
    markWrongResult,
    reportSuggestedLineFault,
  } = useIssueFeedback(setRun);
  const { isSubmittingSurvey, surveyError, submitSurvey } = useSurveySubmission(setRun);

  const [currentStep, setCurrentStep] = useState<ReviewFlowStep>(getSafeStep(initialStep));
  const [notification, setNotification] = useState<FlowNotification | null>(null);
  const [selectedCommentIssue, setSelectedCommentIssue] = useState<ReviewIssueViewModel | null>(null);
  const [selectedWrongResultIssue, setSelectedWrongResultIssue] = useState<ReviewIssueViewModel | null>(null);
  const [selectedSuggestedLineFault, setSelectedSuggestedLineFault] = useState<SuggestedLineFaultDraft | null>(null);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [isReviewerProfileModalOpen, setIsReviewerProfileModalOpen] = useState(false);
  const [snippets, setSnippets] = useState<ReviewSourceSnippetSummary[]>([]);
  const [isSnippetLoading, setIsSnippetLoading] = useState(false);
  const [snippetError, setSnippetError] = useState<string | null>(null);
  const initializedRunIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!run) {
      return;
    }

    const shouldApplyInitialStep = initializedRunIdRef.current !== run.id;
    initializedRunIdRef.current = run.id;

    const desiredStep =
      shouldApplyInitialStep && initialStep && initialStep > 1 && run.result ? initialStep : run.currentStep;
    setCurrentStep(desiredStep);
  }, [initialStep, run?.currentStep, run?.id, run?.result]);

  useEffect(() => {
    if (!run) {
      return;
    }

    if (isSubmitting) {
      return;
    }

    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }

    const isAlreadyTrackingCurrentStep =
      run.stepMetrics.activeStep === currentStep && Boolean(run.stepMetrics.activeStepEnteredAt);

    if (isAlreadyTrackingCurrentStep) {
      return;
    }

    setRun(resumeReviewRunStepTracking(run.id, currentStep));
  }, [currentStep, isSubmitting, run, setRun]);

  useEffect(() => {
    if (!run || typeof document === "undefined") {
      return;
    }

    const handleVisibilityChange = () => {
      const updatedRun =
        document.visibilityState === "visible" && !isSubmitting
          ? resumeReviewRunStepTracking(run.id, currentStep)
          : pauseReviewRunStepTracking(run.id);
      setRun(updatedRun);
    };

    const handleBeforeUnload = () => {
      pauseReviewRunStepTracking(run.id);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentStep, isSubmitting, run?.id, setRun]);

  useEffect(() => {
    if (!run) {
      return;
    }

    return () => {
      pauseReviewRunStepTracking(run.id);
    };
  }, [run?.id]);

  const updateInputState = (input: Partial<ReviewInputState>) => {
    if (!run) {
      return;
    }
    const updated = updateReviewInput(run.id, input, currentStep);
    setRun(updated);
  };

  const persistSnippetSelection = (snippet: ReviewSourceSnippetDetail) => {
    if (!run) {
      return;
    }

    const updated = updateReviewInput(
      run.id,
      {
        selectedSnippetId: snippet.id,
        selectedSnippet: snippet,
        mainFiles: [buildSnippetMainFile(snippet)],
      },
      run.currentStep,
    );
    setRun(updated);
  };

  const loadSnippets = async () => {
    if (!run) {
      return;
    }

    setIsSnippetLoading(true);
    setSnippetError(null);
    try {
      const available = await reviewRunService.listAvailableSnippets();
      setSnippets(available);

      const targetSnippetId = run.input.selectedSnippetId || available[0]?.id;
      const needsDetail =
        Boolean(targetSnippetId) &&
        (!run.input.selectedSnippet || run.input.selectedSnippet.id !== targetSnippetId);

      if (targetSnippetId && needsDetail) {
        const detail = await reviewRunService.getSnippetDetail(targetSnippetId);
        persistSnippetSelection(detail);
      }
    } catch (loadError) {
      setSnippetError(loadError instanceof Error ? loadError.message : "Failed to load backend snippets.");
    } finally {
      setIsSnippetLoading(false);
    }
  };

  useEffect(() => {
    if (!run) {
      return;
    }

    void loadSnippets();
  }, [run?.id]);

  const handleStepChange = (step: ReviewFlowStep) => {
    if (!run) {
      return;
    }

    const maxStep = run.result ? 3 : 1;
    const safeStep = step > maxStep ? maxStep : step;
    const updated = setReviewRunCurrentStep(run.id, safeStep);
    setRun(updated);
    setCurrentStep(safeStep);
  };

  const handleAddSupportingFiles = async (files: FileList | File[]) => {
    if (!run || files.length === 0) {
      return;
    }

    const nextFiles = await readBrowserFiles(files, "supporting");
    updateInputState({
      supportingFiles: [...run.input.supportingFiles, ...nextFiles],
    });
  };

  const handleRemoveSupportingFile = (fileId: string) => {
    if (!run) {
      return;
    }

    updateInputState({
      supportingFiles: run.input.supportingFiles.filter((file) => file.id !== fileId),
    });
  };

  const handleSnippetChange = async (snippetId: string) => {
    if (!run || !snippetId || snippetId === run.input.selectedSnippetId) {
      return;
    }

    setIsSnippetLoading(true);
    setSnippetError(null);
    try {
      const detail = await reviewRunService.getSnippetDetail(snippetId);
      persistSnippetSelection(detail);
    } catch (loadError) {
      setSnippetError(loadError instanceof Error ? loadError.message : "Failed to load the selected snippet.");
    } finally {
      setIsSnippetLoading(false);
    }
  };

  const handleAddDeveloperNote = (note: Omit<ReviewLineNote, "id" | "createdAt">) => {
    if (!run) {
      return;
    }

    updateInputState({
      developerNotes: [
        ...run.input.developerNotes,
        {
          ...note,
          id: createId("developer-note"),
          createdAt: new Date().toISOString(),
        },
      ],
    });
  };

  const handleRemoveDeveloperNote = (noteId: string) => {
    if (!run) {
      return;
    }

    updateInputState({
      developerNotes: run.input.developerNotes.filter((note) => note.id !== noteId),
    });
  };

  const handleSubmit = async () => {
    if (!run || !run.input.reviewMode || !run.input.selectedSnippetId) {
      return;
    }

    const reviewRunWithProfile = ensureReviewerProfile(run.id);
    setRun(reviewRunWithProfile);
    setIsReviewerProfileModalOpen(true);
    await waitForNextPaint();
    setRun(pauseReviewRunStepTracking(reviewRunWithProfile.id));

    try {
      const nextRun = await submitReview({
        reviewRunId: reviewRunWithProfile.id,
        reviewMode: reviewRunWithProfile.input.reviewMode!,
        snippetId: reviewRunWithProfile.input.selectedSnippetId,
        mainFiles: reviewRunWithProfile.input.mainFiles,
        supportingFiles: reviewRunWithProfile.input.supportingFiles,
        developerNotes: reviewRunWithProfile.input.developerNotes,
        notes: reviewRunWithProfile.input.notes,
      });

      setRun(nextRun);
      setCurrentStep(2);
      setNotification(
        nextRun.result?.transportMode === "mock-fallback"
          ? {
              tone: "warning",
              message: "Backend review failed, so the summary was generated with the local fallback mapper.",
            }
          : {
              tone: "success",
              message: "Review submitted successfully.",
            },
      );
    } finally {
      // Keep the profile modal open until the reviewer dismisses it so fast API responses
      // do not interrupt data entry or discard the chance to capture reviewer context.
    }
  };

  const handleReportFault = async (issueId: string, reason?: string) => {
    if (!run) {
      return;
    }

    const response = await reportFault({
      reviewRunId: run.id,
      issueId,
      sourceStep: "summary",
      reason,
    });
    setNotification({
      tone: response.status === "mocked" ? "warning" : "success",
      message: response.message,
    });
  };

  const handleSubmitComment = async (commentText: string) => {
    if (!run || !selectedCommentIssue) {
      return;
    }

    const response = await commentOnIssue({
      reviewRunId: run.id,
      issueId: selectedCommentIssue.id,
      commentText,
      sourceStep: "marker_review",
    });
    setSelectedCommentIssue(null);
    setNotification({
      tone: response.status === "mocked" ? "warning" : "success",
      message: response.message,
    });
  };

  const handleSubmitWrongResult = async (note?: string) => {
    if (!run || !selectedWrongResultIssue) {
      return;
    }

    const response = await markWrongResult({
      reviewRunId: run.id,
      issueId: selectedWrongResultIssue.id,
      isWrong: true,
      note,
      sourceStep: "marker_review",
    });
    setSelectedWrongResultIssue(null);
    setNotification({
      tone: response.status === "mocked" ? "warning" : "success",
      message: response.message,
    });
  };

  const handleSubmitSurvey = async (surveyValues: SurveyFormValues) => {
    if (!run) {
      return;
    }

    const response = await submitSurvey({
      reviewRunId: run.id,
      ...surveyValues,
    });
    setIsSurveyModalOpen(false);
    setNotification({
      tone: response.status === "mocked" ? "warning" : "success",
      message: response.message,
    });
  };

  const handleSubmitSuggestedLineFault = async (faultType: SuggestedLineFaultType, commentText?: string) => {
    if (!run || !selectedSuggestedLineFault) {
      return;
    }

    const response = await reportSuggestedLineFault({
      reviewRunId: run.id,
      issueId: selectedSuggestedLineFault.issue.id,
      lineKey: selectedSuggestedLineFault.lineKey,
      lineText: selectedSuggestedLineFault.lineText,
      suggestedLineNumber: selectedSuggestedLineFault.suggestedLineNumber,
      faultType,
      commentText,
      sourceStep: "marker_review",
    });

    setSelectedSuggestedLineFault(null);
    setNotification({
      tone: response.status === "mocked" ? "warning" : "success",
      message: response.message,
    });
  };

  const handleUpdateReviewerProfile = (input: Partial<ReviewReviewerProfile>) => {
    if (!run) {
      return;
    }

    setRun(persistReviewerProfile(run.id, input));
  };

  const handleAddPhase3Finding = (finding: Omit<ReviewPhaseFinding, "id" | "createdAt" | "sourcePhase">) => {
    if (!run) {
      return;
    }

    setRun(addPhase3Finding(run.id, finding));
    setNotification({
      tone: "success",
      message: "The extra reviewer bug was saved locally.",
    });
  };

  const handleRemovePhase3Finding = (findingId: string) => {
    if (!run) {
      return;
    }

    setRun(removePhase3Finding(run.id, findingId));
  };

  return {
    run,
    snippets,
    isSnippetLoading,
    snippetError,
    currentStep,
    isLoading,
    loadError: error,
    isSubmitting,
    submitError,
    feedbackError,
    surveyError,
    notification,
    setNotification,
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
    input: run?.input,
    result: run?.result,
    reviewerProfile: run?.reviewerProfile,
    phase3Findings: run?.phase3Findings ?? [],
    survey: run?.survey,
    reloadSnippets: loadSnippets,
    selectSnippet: handleSnippetChange,
    addSupportingFiles: handleAddSupportingFiles,
    removeSupportingFile: handleRemoveSupportingFile,
    addDeveloperNote: handleAddDeveloperNote,
    removeDeveloperNote: handleRemoveDeveloperNote,
    updateReviewMode: (reviewMode: NonNullable<ReviewInputState["reviewMode"]>) => updateInputState({ reviewMode }),
    updateNotes: (notes: string) => updateInputState({ notes }),
    goToStep: handleStepChange,
    submitCurrentReview: handleSubmit,
    reportFault: handleReportFault,
    openCommentModal: setSelectedCommentIssue,
    closeCommentModal: () => setSelectedCommentIssue(null),
    submitComment: handleSubmitComment,
    openWrongResultModal: setSelectedWrongResultIssue,
    closeWrongResultModal: () => setSelectedWrongResultIssue(null),
    submitWrongResult: handleSubmitWrongResult,
    openSuggestedLineFaultModal: (issue: ReviewIssueViewModel, lineKey: string, lineText: string, suggestedLineNumber?: number) =>
      setSelectedSuggestedLineFault({
        issue,
        lineKey,
        lineText,
        suggestedLineNumber,
      }),
    closeSuggestedLineFaultModal: () => setSelectedSuggestedLineFault(null),
    submitSuggestedLineFault: handleSubmitSuggestedLineFault,
    openSurveyModal: () => setIsSurveyModalOpen(true),
    closeSurveyModal: () => setIsSurveyModalOpen(false),
    submitSurvey: handleSubmitSurvey,
    openReviewerProfileModal: () => {
      if (!run) {
        return;
      }
      setRun(ensureReviewerProfile(run.id));
      setIsReviewerProfileModalOpen(true);
    },
    closeReviewerProfileModal: () => {
      setIsReviewerProfileModalOpen(false);
    },
    updateReviewerProfile: handleUpdateReviewerProfile,
    addPhase3Finding: handleAddPhase3Finding,
    removePhase3Finding: handleRemovePhase3Finding,
  };
}
