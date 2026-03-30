export type ApiReviewMode = "monolithic" | "specialist";
export type ApiAgentRole = "general" | "security" | "architecture" | "logic" | "mentorship" | "testing" | "policy";
export type ApiSeverity = "critical" | "major" | "minor" | "suggestion";
export type ApiConfidence = "high" | "medium" | "low";

export interface ApiSnippetSummary {
  id: string;
  language: string;
  context: string;
  num_seeded_issues: number;
}

export interface ApiSnippetListResponse {
  snippets: ApiSnippetSummary[];
}

export interface ApiSnippetDetail {
  id: string;
  code: string;
  language: string;
  context: string;
}

export interface ApiReviewFinding {
  id?: string;
  role: ApiAgentRole;
  severity: ApiSeverity;
  confidence: ApiConfidence;
  line?: number | null;
  title: string;
  description: string;
  suggestion?: string;
  evidence?: string;
}

export interface ApiReviewMetadata {
  total_tokens: number;
  latency_ms: number;
  agents_used: string[];
}

export interface ApiReviewResponse {
  review_id: string;
  mode: ApiReviewMode;
  snippet_id: string;
  findings: ApiReviewFinding[];
  summary: string;
  metadata: ApiReviewMetadata;
}

export interface ApiExperimentStartResponse {
  session_id: string;
  condition: ApiReviewMode;
}

export interface ApiFlaggedIssue {
  line: number;
  title: string;
}

export interface ApiReviewSubmissionRequest {
  session_id: string;
  snippet_id: string;
  time_spent_sec: number;
  flagged_issues: ApiFlaggedIssue[];
}

export interface ApiEvaluationResponse {
  recall_score: number;
  false_positive_rate: number;
  true_positives: number;
  false_positives: number;
  total_ground_truth: number;
  message: string;
}
