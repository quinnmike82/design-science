import type { ReviewIssueFeedbackState } from "@/models/review-feedback.types";
import type { ReviewSurvey } from "@/models/survey.types";
import type { DeveloperComment, SnippetDetail, SnippetSummary } from "@/types/review";

export type ReviewFlowStep = 1 | 2 | 3;
export type ReviewModeOption = "mono" | "multiple_agent";
export type ReviewRunStatus = "draft" | "running" | "completed" | "failed";
export type ReviewTransportMode = "api" | "mock-fallback";
export type ReviewFileKind = "main" | "supporting";
export type SupportingDocumentType = "fsd" | "testcase" | "notes" | "other";
export type ReviewIssueSeverity = "critical" | "high" | "medium" | "low";
export type ReviewLineNote = DeveloperComment;
export type ReviewSourceSnippetSummary = SnippetSummary;
export type ReviewSourceSnippetDetail = SnippetDetail;
export type ReviewNoteMatchStatus = "matched" | "agent_only" | "unknown";

export interface ReviewInputFile {
  id: string;
  kind: ReviewFileKind;
  name: string;
  content: string;
  size: number;
  uploadedAt: string;
  documentType?: SupportingDocumentType;
}

export interface ReviewInputState {
  reviewMode?: ReviewModeOption;
  selectedSnippetId: string;
  selectedSnippet?: ReviewSourceSnippetDetail;
  mainFiles: ReviewInputFile[];
  supportingFiles: ReviewInputFile[];
  developerNotes: ReviewLineNote[];
  notes: string;
}

export interface ReviewSubmitRequest {
  reviewRunId?: string;
  reviewMode: ReviewModeOption;
  snippetId: string;
  mainFiles: ReviewInputFile[];
  supportingFiles: ReviewInputFile[];
  developerNotes: ReviewLineNote[];
  notes?: string;
}

export interface ReviewSubmitApiRequest {
  review_mode: "monolithic" | "specialist";
  source_files: Array<{
    file_name: string;
    content: string;
  }>;
  supporting_files: Array<{
    file_name: string;
    content: string;
    document_type: SupportingDocumentType;
  }>;
  notes?: string;
  context?: string;
}

export interface ReviewIssueViewModel {
  id: string;
  title: string;
  severity: ReviewIssueSeverity;
  roleName?: string;
  filePath?: string;
  lineNumber?: number;
  locationLabel: string;
  description: string;
  suggestion?: string;
  originalSnippet?: string;
  replacementSnippet?: string;
  sourceFileContent?: string;
  rationale?: string;
  canRenderRichDiff: boolean;
  noteMatchStatus: ReviewNoteMatchStatus;
  relatedNoteIds: string[];
  relatedNoteTitles: string[];
  feedback: ReviewIssueFeedbackState;
  rawMetadata: Record<string, unknown>;
}

export interface ReviewComparedNoteView {
  id: string;
  title: string;
  description: string;
  filePath: string;
  lineStart?: number;
  lineEnd?: number;
  status: "matched" | "unmatched";
  matchedIssueIds: string[];
}

export interface ReviewNoteComparisonSummary {
  totalNotes: number;
  matchedNotes: number;
  unmatchedNotes: number;
  agentMatchedIssues: number;
  agentOnlyIssues: number;
  notes: ReviewComparedNoteView[];
}

export interface ReviewSeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ReviewResultViewModel {
  reviewRunId: string;
  backendReviewId?: string;
  mode: ReviewModeOption;
  transportMode: ReviewTransportMode;
  summaryText: string;
  issues: ReviewIssueViewModel[];
  noteComparison: ReviewNoteComparisonSummary;
  severityCounts: ReviewSeverityCounts;
  submittedAt: string;
  supportsMultilineSource: boolean;
  rawResponse: unknown;
}

export interface ReviewRunRecord {
  id: string;
  status: ReviewRunStatus;
  createdAt: string;
  updatedAt: string;
  currentStep: ReviewFlowStep;
  input: ReviewInputState;
  result?: ReviewResultViewModel;
  survey?: ReviewSurvey;
  lastError?: string;
}
