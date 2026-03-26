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

export interface Artifact {
  id: string;
  type: ArtifactType;
  name: string;
  content: string;
  fileName?: string;
  size?: number;
  uploadedAt: string;
}

export interface ReviewSession {
  id: string;
  title: string;
  description: string;
  projectType: ProjectType;
  language: LanguageOption;
  stakeholderRole: StakeholderRole;
  createdAt: string;
  status: ReviewStatus;
  artifacts: Artifact[];
}

export type AgentIconName = "shield" | "network" | "brain" | "sparkles" | "flask" | "scale";

export interface AgentDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: AgentIconName;
  colorToken: "primary" | "secondary" | "tertiary" | "error" | "cyan";
}

export interface AgentRunStatus {
  agentId: string;
  status: "idle" | "queued" | "running" | "completed" | "failed";
  progress: number;
  startedAt?: string;
  completedAt?: string;
}

export type FindingSeverity = "critical" | "high" | "medium" | "low";
export type FindingConfidence = "high" | "medium" | "low";

export interface Finding {
  id: string;
  agentId: string;
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
  suggestedDiff?: string;
  suggestedTestCases: string[];
  tags: string[];
  relatedArtifacts: string[];
  affectedFeature?: string;
}

export interface AgentSummary {
  agentId: string;
  headline: string;
  summary: string;
  focusAreas: string[];
}

export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ReviewResult {
  reviewId: string;
  executiveSummary: string;
  releaseRecommendation: "Hold Release" | "Proceed with Caution" | "Ready with Follow-up";
  estimatedFixEffort: string;
  overallRisk: "Severe" | "Elevated" | "Moderate" | "Contained";
  severityCounts: SeverityCounts;
  findings: Finding[];
  agentSummaries: AgentSummary[];
}

export interface CreateReviewSessionPayload {
  title: string;
  description: string;
  projectType: ProjectType;
  language: LanguageOption;
  stakeholderRole: StakeholderRole;
  artifacts?: Artifact[];
}

export type UpdateReviewSessionPayload = Partial<
  Pick<ReviewSession, "title" | "description" | "projectType" | "language" | "stakeholderRole" | "status">
> & {
  artifacts?: Artifact[];
};

export interface RoleBasedFindingView {
  headline: string;
  body: string;
  emphasisLabel: string;
  emphasisValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  recommendationLabel: string;
  recommendation: string;
}

export interface RoleBasedSummary {
  eyebrow: string;
  title: string;
  description: string;
  callout: string;
}

export type FindingSortOption = "severity" | "confidence" | "agent" | "filePath";

export interface ResultsFilters {
  agentId: "all" | AgentDefinition["id"];
  severity: "all" | FindingSeverity;
  sortBy: FindingSortOption;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}
