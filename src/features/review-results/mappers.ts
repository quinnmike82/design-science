import {
  ApiAgentRole,
  ApiConfidence,
  ApiEvaluationResponse,
  ApiReviewFinding,
  ApiReviewMode,
  ApiReviewResponse,
  ApiSeverity,
  ApiSnippetDetail,
  ApiSnippetSummary,
} from "@/types/api";
import {
  AgentId,
  AgentSummary,
  DeveloperComment,
  DeveloperFindingStatus,
  Finding,
  FindingConfidence,
  FindingSeverity,
  LanguageOption,
  ReviewCondition,
  ReviewMetrics,
  ReviewResult,
  SeverityCounts,
  SnippetDetail,
  SnippetSummary,
} from "@/types/review";
import { agentDefinitions } from "@/data/agents";

const severityMap: Record<ApiSeverity, FindingSeverity> = {
  critical: "critical",
  major: "high",
  minor: "medium",
  suggestion: "low",
};

const confidenceMap: Record<ApiConfidence, FindingConfidence> = {
  high: "high",
  medium: "medium",
  low: "low",
};

const roleMap: Record<ApiAgentRole, AgentId> = {
  general: "general",
  security: "security",
  architecture: "architecture",
  logic: "logic",
  mentorship: "maintainability",
  testing: "testing",
  policy: "policy",
};

const languageMap: Record<string, LanguageOption> = {
  python: "Python",
  typescript: "TypeScript",
  javascript: "JavaScript",
  go: "Go",
  java: "Java",
  kotlin: "Kotlin",
};

const severityRank: Record<FindingSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function mapSnippetSummary(apiSnippet: ApiSnippetSummary): SnippetSummary {
  return {
    id: apiSnippet.id,
    label: apiSnippet.id.replace(/_/g, " "),
    language: apiSnippet.language,
    context: apiSnippet.context,
    numSeededIssues: apiSnippet.num_seeded_issues,
  };
}

export function mapSnippetDetail(apiSnippet: ApiSnippetDetail): SnippetDetail {
  return {
    id: apiSnippet.id,
    label: apiSnippet.id.replace(/_/g, " "),
    language: apiSnippet.language,
    context: apiSnippet.context,
    numSeededIssues: 0,
    code: apiSnippet.code,
  };
}

export function normalizeLanguage(value: string): LanguageOption {
  return languageMap[value.toLowerCase()] ?? "Python";
}

function buildFilePath(snippetId: string, language: string) {
  const extensionMap: Record<string, string> = {
    python: "py",
    typescript: "ts",
    javascript: "js",
    go: "go",
    java: "java",
    kotlin: "kt",
  };

  const extension = extensionMap[language.toLowerCase()] ?? "txt";
  return `snippets/${snippetId}.${extension}`;
}

function firstSentence(text: string) {
  const [sentence] = text.split(/(?<=[.!?])\s+/);
  return sentence ?? text;
}

function buildBusinessImpact(agentId: AgentId, description: string) {
  switch (agentId) {
    case "security":
      return `This can expose unsafe behavior, weaken controls, or create user trust issues. ${description}`;
    case "architecture":
      return `This can spread inconsistent behavior across system boundaries and make fixes costlier. ${description}`;
    case "logic":
      return `This can break expected product behavior for real users or valid inputs. ${description}`;
    case "maintainability":
      return `This increases change risk and slows future delivery velocity. ${description}`;
    case "testing":
      return `This reduces confidence that regressions will be caught before release. ${description}`;
    case "policy":
      return `This can violate internal standards or audit expectations. ${description}`;
    case "general":
      return `This affects release quality and should be reviewed before shipment. ${description}`;
  }
}

function buildQaImpact(finding: ApiReviewFinding, filePath: string) {
  return [
    `Add regression coverage around ${filePath}${finding.line ? `:${finding.line}` : ""}.`,
    finding.suggestion ? `Use the suggested fix as the assertion target: ${finding.suggestion}` : "Cover both positive and negative paths.",
  ].join(" ");
}

function buildPmSummary(severity: FindingSeverity, title: string, description: string) {
  return `${severity.toUpperCase()} priority: ${title}. ${firstSentence(description)}`;
}

function buildSuggestedTestCases(agentId: AgentId, finding: ApiReviewFinding, filePath: string) {
  const cases = [
    `Verify behavior around ${filePath}${finding.line ? `:${finding.line}` : ""}.`,
  ];

  if (agentId === "security") {
    cases.push("Add a negative-path test that proves unsafe input is rejected.");
  }
  if (agentId === "logic") {
    cases.push("Add boundary and invalid-state coverage for the affected branch.");
  }
  if (agentId === "testing") {
    cases.push("Convert the missing coverage gap into an automated regression test.");
  }
  if (finding.suggestion) {
    cases.push(`Validate the suggested fix path: ${finding.suggestion}`);
  }

  return Array.from(new Set(cases));
}

function matchDeveloperComments(
  comments: DeveloperComment[],
  lineStart?: number,
): { status: DeveloperFindingStatus; relatedCommentIds: string[] } {
  if (!lineStart || comments.length === 0) {
    return { status: "unknown", relatedCommentIds: [] };
  }

  const relatedCommentIds = comments
    .filter((comment) => comment.lineStart && Math.abs((comment.lineStart ?? 0) - lineStart) <= 2)
    .map((comment) => comment.id);

  return {
    status: relatedCommentIds.length > 0 ? "found" : "missed",
    relatedCommentIds,
  };
}

function mapFinding(
  finding: ApiReviewFinding,
  snippetId: string,
  snippetLanguage: string,
  developerComments: DeveloperComment[],
): Finding {
  const agentId = roleMap[finding.role];
  const severity = severityMap[finding.severity];
  const filePath = buildFilePath(snippetId, snippetLanguage);
  const match = matchDeveloperComments(developerComments, finding.line ?? undefined);

  return {
    id: finding.id ?? `${snippetId}-${finding.role}-${finding.line ?? "na"}-${finding.title}`,
    agentId,
    severity,
    confidence: confidenceMap[finding.confidence],
    category: agentDefinitions.find((item) => item.id === agentId)?.category ?? "Review Finding",
    title: finding.title,
    summary: firstSentence(finding.description),
    technicalDetails: [finding.description, finding.evidence ? `Evidence: ${finding.evidence}` : ""].filter(Boolean).join(" "),
    businessImpact: buildBusinessImpact(agentId, finding.description),
    qaImpact: buildQaImpact(finding, filePath),
    pmSummary: buildPmSummary(severity, finding.title, finding.description),
    filePath,
    lineStart: finding.line ?? undefined,
    lineEnd: finding.line ?? undefined,
    recommendation: finding.suggestion?.trim() || "Investigate and address the underlying issue before release.",
    suggestedFix: finding.suggestion?.trim(),
    evidence: finding.evidence?.trim(),
    suggestedTestCases: buildSuggestedTestCases(agentId, finding, filePath),
    tags: Array.from(new Set([agentId, severity, snippetId])),
    relatedArtifacts: [],
    affectedFeature: snippetId,
    developerFoundStatus: match.status,
    relatedCommentIds: match.relatedCommentIds,
  };
}

function buildSeverityCounts(findings: Finding[]): SeverityCounts {
  return findings.reduce<SeverityCounts>(
    (counts, finding) => {
      counts[finding.severity] += 1;
      return counts;
    },
    {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
  );
}

function deriveRisk(counts: SeverityCounts): ReviewResult["overallRisk"] {
  if (counts.critical > 0) {
    return "Severe";
  }
  if (counts.high > 1) {
    return "Elevated";
  }
  if (counts.high > 0 || counts.medium > 2) {
    return "Moderate";
  }
  return "Contained";
}

function deriveRecommendation(risk: ReviewResult["overallRisk"]): ReviewResult["releaseRecommendation"] {
  switch (risk) {
    case "Severe":
      return "Hold Release";
    case "Elevated":
    case "Moderate":
      return "Proceed with Caution";
    case "Contained":
      return "Ready with Follow-up";
  }
}

function deriveFixEffort(counts: SeverityCounts) {
  const score = counts.critical * 8 + counts.high * 4 + counts.medium * 2 + counts.low;

  if (score >= 18) {
    return "2 to 3 days";
  }
  if (score >= 10) {
    return "1 to 2 days";
  }
  if (score >= 5) {
    return "4 to 8 hours";
  }
  return "1 to 3 hours";
}

function buildAgentSummaries(findings: Finding[]): AgentSummary[] {
  const groups = findings.reduce<Record<string, Finding[]>>((acc, finding) => {
    acc[finding.agentId] = [...(acc[finding.agentId] ?? []), finding];
    return acc;
  }, {});

  return Object.entries(groups).map(([agentId, agentFindings]) => {
    const sorted = [...agentFindings].sort((left, right) => severityRank[right.severity] - severityRank[left.severity]);
    const lead = sorted[0];
    const agent = agentDefinitions.find((item) => item.id === agentId);

    return {
      agentId: agentId as AgentId,
      headline: `${sorted.length} finding${sorted.length === 1 ? "" : "s"} surfaced by ${agent?.name ?? agentId}`,
      summary: lead.summary,
      focusAreas: Array.from(
        new Set(
          sorted
            .flatMap((finding) => [finding.category, finding.filePath])
            .filter((item): item is string => Boolean(item)),
        ),
      ).slice(0, 3),
      findingCount: sorted.length,
      highestSeverity: lead.severity,
    };
  });
}

function buildRecommendedActions(findings: Finding[]) {
  return Array.from(new Set(findings.map((finding) => finding.recommendation).filter(Boolean))).slice(0, 4);
}

function buildCoachingSummary(
  evaluation: ApiEvaluationResponse | undefined,
  caught: DeveloperComment[],
  missed: Finding[],
  falsePositives: DeveloperComment[],
) {
  const parts = [
    evaluation?.message,
    caught.length > 0 ? `You already flagged ${caught.length} issue${caught.length === 1 ? "" : "s"} that align with the AI review.` : "The AI review found opportunities beyond the current developer notes.",
    missed.length > 0 ? `${missed.length} issue${missed.length === 1 ? "" : "s"} still appear to be missing from the developer review.` : "No major AI-only gaps were detected from the mapped findings.",
    falsePositives.length > 0 ? `${falsePositives.length} comment${falsePositives.length === 1 ? "" : "s"} may need stronger evidence or narrower wording.` : undefined,
  ].filter(Boolean);

  return parts.join(" ");
}

export function mapApiReviewToResult(input: {
  reviewId: string;
  sessionId?: string;
  snippetId: string;
  snippetLanguage: string;
  apiReview: ApiReviewResponse;
  evaluation?: ApiEvaluationResponse;
  developerComments: DeveloperComment[];
  analyticsCondition?: ReviewCondition;
}): ReviewResult {
  const findings = input.apiReview.findings.map((finding) =>
    mapFinding(finding, input.snippetId, input.snippetLanguage, input.developerComments),
  );
  const severityCounts = buildSeverityCounts(findings);
  const overallRisk = deriveRisk(severityCounts);
  const releaseRecommendation = deriveRecommendation(overallRisk);
  const agentSummaries = buildAgentSummaries(findings);
  const caughtCommentIds = new Set(findings.flatMap((finding) => finding.relatedCommentIds));
  const caught = input.developerComments.filter((comment) => caughtCommentIds.has(comment.id));
  const falsePositives = input.developerComments.filter((comment) => !caughtCommentIds.has(comment.id));
  const missed = findings.filter((finding) => finding.developerFoundStatus === "missed");

  const metrics: ReviewMetrics = {
    recallScore: input.evaluation?.recall_score,
    falsePositiveRate: input.evaluation?.false_positive_rate,
    truePositives: input.evaluation?.true_positives,
    falsePositives: input.evaluation?.false_positives,
    totalGroundTruth: input.evaluation?.total_ground_truth,
    latencyMs: input.apiReview.metadata.latency_ms,
    condition: input.analyticsCondition ?? (input.apiReview.mode as ReviewCondition),
  };

  return {
    reviewId: input.reviewId,
    sessionId: input.sessionId,
    mode: input.apiReview.mode,
    executiveSummary: input.apiReview.summary,
    mergedSummary: input.apiReview.summary,
    releaseRecommendation,
    estimatedFixEffort: deriveFixEffort(severityCounts),
    overallRisk,
    severityCounts,
    findings,
    agentSummaries,
    metrics,
    recommendedActions: buildRecommendedActions(findings),
    developerComments: input.developerComments,
    coaching: {
      caught,
      missed,
      falsePositives,
      summary: buildCoachingSummary(input.evaluation, caught, missed, falsePositives),
      evaluatorMessage: input.evaluation?.message,
    },
  };
}
