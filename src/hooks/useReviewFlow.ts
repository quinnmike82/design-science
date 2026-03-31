import { useEffect, useState } from "react";
import { useIssueFeedback } from "@/hooks/useIssueFeedback";
import { useReviewResults } from "@/hooks/useReviewResults";
import { useReviewSubmission } from "@/hooks/useReviewSubmission";
import { useSurveySubmission } from "@/hooks/useSurveySubmission";
import type { SuggestedLineFaultType } from "@/models/review-feedback.types";
import type {
  ReviewFlowStep,
  ReviewInputFile,
  ReviewInputState,
  ReviewIssueViewModel,
  ReviewLineNote,
  ReviewSourceSnippetDetail,
  ReviewSourceSnippetSummary,
} from "@/models/review.types";
import type { SurveyFormValues } from "@/models/survey.types";
import { reviewRunService } from "@/services/reviewRunService";
import { updateReviewInput, updateStoredReviewRun } from "@/services/review.service";
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
  const [snippets, setSnippets] = useState<ReviewSourceSnippetSummary[]>([]);
  const [isSnippetLoading, setIsSnippetLoading] = useState(false);
  const [snippetError, setSnippetError] = useState<string | null>(null);

  useEffect(() => {
    if (!run) {
      return;
    }

    const desiredStep = initialStep && initialStep > 1 && run.result ? initialStep : run.currentStep;
    setCurrentStep(desiredStep);
  }, [initialStep, run]);

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
    const updated = updateStoredReviewRun(run.id, (current) => ({
      ...current,
      currentStep: safeStep,
    }));
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

    const nextRun = await submitReview({
      reviewRunId: run.id,
      reviewMode: run.input.reviewMode,
      snippetId: run.input.selectedSnippetId,
      mainFiles: run.input.mainFiles,
      supportingFiles: run.input.supportingFiles,
      developerNotes: run.input.developerNotes,
      notes: run.input.notes,
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
    reportingIds,
    commentingIds,
    wrongResultIds,
    suggestedLineFaultIds,
    isSubmittingSurvey,
    input: run?.input,
    result: run?.result,
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
  };
}
