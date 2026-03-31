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

export interface ApiExperimentStartRequest {
  preferred_condition?: ApiReviewMode;
}

export interface ApiFlaggedIssue {
  line?: number;
  line_start?: number;
  line_end?: number;
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

export interface ApiSurveySubmissionRequest {
  session_id: string;
  tlx_mental: number;
  tlx_physical: number;
  tlx_temporal: number;
  tlx_performance: number;
  tlx_effort: number;
  tlx_frustration: number;
  trust_score: number;
  method_helpfulness: number;
  method_clarity: number;
  method_actionability: number;
  platform_usability: number;
  platform_speed: number;
  platform_design: number;
  preferred_mode?: string;
  feedback_comment?: string;
}

export interface ApiIssueReportRequest {
  session_id: string;
  review_id: string;
  snippet_id: string;
  finding_id: string;
  finding_title: string;
  agent_id: string;
  review_mode: ApiReviewMode;
  reason: string;
  details?: string;
}
