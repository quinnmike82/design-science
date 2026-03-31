export type StakeholderRole = "DEV" | "BA" | "QA" | "PM";

export type ReviewStatus = "draft" | "running" | "completed" | "failed";

export type ArtifactType = "codeChange" | "fsd" | "testcase" | "notes" | "other";

export type ProjectType =
  | "Frontend App"
  | "Backend Service"
  | "Platform"
  | "Library"
  | "Monolith"
  | "Microservice";

export type LanguageOption =
  | "TypeScript"
  | "JavaScript"
  | "Python"
  | "Go"
  | "Java"
  | "Kotlin";

export type ReviewMode = "monolithic" | "specialist";
export type ReviewCondition = "monolithic" | "specialist";
export type SurveyRating = 1 | 2 | 3 | 4 | 5;
export type IssueReportReason = "false_positive" | "incorrect_line" | "wrong_severity" | "not_actionable" | "other";

export interface Artifact {
  id: string;
  type: ArtifactType;
  name: string;
  content: string;
  fileName?: string;
  size?: number;
  uploadedAt: string;
}

export interface SnippetSummary {
  id: string;
  label: string;
  language: string;
  context: string;
  numSeededIssues: number;
}

export interface SnippetDetail extends SnippetSummary {
  code: string;
}

export type FindingSeverity = "critical" | "high" | "medium" | "low";
export type FindingConfidence = "high" | "medium" | "low";

export interface DeveloperComment {
  id: string;
  title: string;
  description: string;
  filePath: string;
  lineStart?: number;
  lineEnd?: number;
  severityGuess?: FindingSeverity | "unknown";
  createdAt: string;
}

export interface ReviewSession {
  id: string;
  backendSessionId?: string;
  title: string;
  description: string;
  projectType: ProjectType;
  language: LanguageOption;
  stakeholderRole: StakeholderRole;
  createdAt: string;
  status: ReviewStatus;
  artifacts: Artifact[];
  snippetId: string;
  snippetTitle: string;
  snippetContext: string;
  snippetLanguage: string;
  snippetCode: string;
  developerComments: DeveloperComment[];
  reviewStartedAt?: string;
  submittedAt?: string;
  timeSpentSec?: number;
  reviewMode: ReviewMode;
  analyticsCondition?: ReviewCondition;
}

export type AgentIconName = "shield" | "network" | "brain" | "sparkles" | "flask" | "scale";
export type AgentId = "security" | "architecture" | "logic" | "maintainability" | "testing" | "policy" | "general";

export interface AgentDefinition {
  id: AgentId;
  name: string;
  category: string;
  description: string;
  icon: AgentIconName;
  colorToken: "primary" | "secondary" | "tertiary" | "error" | "cyan";
}

export interface AgentRunStatus {
  agentId: AgentId;
  status: "idle" | "queued" | "running" | "completed" | "failed";
  progress: number;
  startedAt?: string;
  completedAt?: string;
}

export type DeveloperFindingStatus = "found" | "missed" | "unknown";

export interface Finding {
  id: string;
  agentId: AgentId;
  severity: FindingSeverity;
  confidence: FindingConfidence;
  category: string;
  title: string;
  summary: string;
  technicalDetails: string;
  businessImpact: string;
  qaImpact: string;
  pmSummary: string;
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
  recommendation: string;
  suggestedFix?: string;
  evidence?: string;
  suggestedTestCases: string[];
  tags: string[];
  relatedArtifacts: string[];
  affectedFeature?: string;
  developerFoundStatus: DeveloperFindingStatus;
  relatedCommentIds: string[];
}

export interface AgentSummary {
  agentId: AgentId;
  headline: string;
  summary: string;
  focusAreas: string[];
  findingCount: number;
  highestSeverity: FindingSeverity;
}

export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ReviewMetrics {
  recallScore?: number;
  falsePositiveRate?: number;
  truePositives?: number;
  falsePositives?: number;
  totalGroundTruth?: number;
  timeSpentSec?: number;
  latencyMs?: number;
  deltaScore?: number;
  condition?: ReviewCondition;
}

export interface ReviewCoaching {
  caught: DeveloperComment[];
  missed: Finding[];
  falsePositives: DeveloperComment[];
  summary: string;
  evaluatorMessage?: string;
}

export interface FindingReport {
  findingId: string;
  reason: IssueReportReason;
  details: string;
  submittedAt: string;
}

export interface ReviewSurvey {
  tlxMental: SurveyRating;
  tlxPhysical: SurveyRating;
  tlxTemporal: SurveyRating;
  tlxPerformance: SurveyRating;
  tlxEffort: SurveyRating;
  tlxFrustration: SurveyRating;
  trustScore: SurveyRating;
  methodHelpfulness: SurveyRating;
  methodClarity: SurveyRating;
  methodActionability: SurveyRating;
  platformUsability: SurveyRating;
  platformSpeed: SurveyRating;
  platformDesign: SurveyRating;
  preferredMode?: ReviewCondition | "no_preference";
  feedbackComment?: string;
  submittedAt: string;
}

export interface ReviewResult {
  reviewId: string;
  sessionId?: string;
  mode: ReviewMode;
  executiveSummary: string;
  mergedSummary: string;
  releaseRecommendation: "Hold Release" | "Proceed with Caution" | "Ready with Follow-up";
  estimatedFixEffort: string;
  overallRisk: "Severe" | "Elevated" | "Moderate" | "Contained";
  severityCounts: SeverityCounts;
  findings: Finding[];
  agentSummaries: AgentSummary[];
  metrics: ReviewMetrics;
  recommendedActions: string[];
  developerComments: DeveloperComment[];
  coaching: ReviewCoaching;
  issueReports: FindingReport[];
  survey?: ReviewSurvey;
}

export interface CreateReviewSessionPayload {
  title: string;
  description: string;
  projectType: ProjectType;
  language: LanguageOption;
  stakeholderRole: StakeholderRole;
  snippetId: string;
  snippetTitle: string;
  snippetContext: string;
  snippetLanguage: string;
  snippetCode: string;
  reviewMode?: ReviewMode;
  artifacts?: Artifact[];
  developerComments?: DeveloperComment[];
  reviewStartedAt?: string;
}

export type UpdateReviewSessionPayload = Partial<
  Pick<
    ReviewSession,
    | "title"
    | "description"
    | "projectType"
    | "language"
    | "stakeholderRole"
    | "status"
    | "snippetId"
    | "snippetTitle"
    | "snippetContext"
    | "snippetLanguage"
    | "snippetCode"
    | "developerComments"
    | "reviewStartedAt"
    | "submittedAt"
    | "timeSpentSec"
    | "reviewMode"
    | "analyticsCondition"
    | "backendSessionId"
  >
> & {
  artifacts?: Artifact[];
};

export interface RoleFindingSection {
  label: string;
  content: string;
}

export interface RoleBasedFindingView {
  headline: string;
  summary: string;
  emphasisLabel: string;
  emphasisValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  recommendationLabel: string;
  recommendation: string;
  detailSections: RoleFindingSection[];
}

export interface RoleBasedSummary {
  eyebrow: string;
  title: string;
  description: string;
  callout: string;
}

export type FindingSortOption = "severity" | "confidence" | "agent" | "filePath" | "line" | "missedFirst";

export interface ResultsFilters {
  agentId: "all" | AgentId;
  severity: "all" | FindingSeverity;
  filePath: "all" | string;
  developerFoundStatus: "all" | DeveloperFindingStatus;
  sortBy: FindingSortOption;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}
