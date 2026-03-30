import {
  Finding,
  ReviewResult,
  RoleBasedFindingView,
  RoleBasedSummary,
  StakeholderRole,
} from "@/types/review";

export function getRoleBasedExecutiveSummary(
  result: ReviewResult,
  role: StakeholderRole,
): RoleBasedSummary {
  const missedCount = result.coaching.missed.length;
  const caughtCount = result.coaching.caught.length;

  switch (role) {
    case "DEV":
      return {
        eyebrow: "Technical coaching",
        title: "Developer review compared against the Azure code-review pipeline",
        description: result.executiveSummary,
        callout: `You caught ${caughtCount} mapped issue(s). ${missedCount > 0 ? `${missedCount} AI findings still need attention.` : "The mapped AI review did not surface additional missed issues."}`,
      };
    case "BA":
      return {
        eyebrow: "Requirement alignment",
        title: "Business-rule and workflow impacts from the AI coaching pass",
        description:
          "The backend findings have been translated into workflow and requirement risks so the review can be discussed beyond code-level detail.",
        callout: `${missedCount > 0 ? `${missedCount} issue(s) may still be missing from the developer review.` : "Developer review coverage appears stronger against the mapped findings."} Validate the requirement consequences before sign-off.`,
      };
    case "QA":
      return {
        eyebrow: "Verification posture",
        title: "Regression and coverage guidance from the coaching result",
        description:
          "Use the mapped findings to turn missed reasoning and edge-case gaps into focused regression suites and exploratory checks.",
        callout: `${result.metrics.recallScore !== undefined ? `Recall score: ${result.metrics.recallScore}%. ` : ""}Prioritize the high-severity gaps the developer missed first.`,
      };
    case "PM":
      return {
        eyebrow: "Release perspective",
        title: `Release confidence is ${result.overallRisk === "Contained" ? "stable" : "reduced"} after the AI coaching pass`,
        description:
          "This view compresses the detailed review into delivery risk, missed-review coverage, and recommended next actions for release planning.",
        callout: `Recommendation: ${result.releaseRecommendation}. Estimated coordination effort: ${result.estimatedFixEffort}.`,
      };
  }
}

export function getRoleBasedRecommendation(result: ReviewResult, role: StakeholderRole) {
  const topAction = result.recommendedActions[0] ?? "Review the top-ranked findings and plan a focused fix pass.";

  switch (role) {
    case "DEV":
      return topAction;
    case "BA":
      return "Validate the impacted requirement paths and confirm the fix preserves intended user and business behavior.";
    case "QA":
      return "Turn the missed or high-severity findings into regression tests and targeted exploratory scenarios before sign-off.";
    case "PM":
      return `Plan ${result.estimatedFixEffort} for fixes and verification, and do not treat the release as stable until the top actions are closed.`;
  }
}

export function getRoleBasedFindingView(
  finding: Finding,
  role: StakeholderRole,
): RoleBasedFindingView {
  switch (role) {
    case "DEV":
      return {
        headline: finding.title,
        summary: finding.summary,
        emphasisLabel: "Why it matters",
        emphasisValue: finding.summary,
        secondaryLabel: "Trace",
        secondaryValue: finding.filePath
          ? `${finding.filePath}${finding.lineStart ? `:${finding.lineStart}` : ""}`
          : finding.category,
        recommendationLabel: "Implementation direction",
        recommendation: finding.recommendation,
        detailSections: [
          { label: "Technical details", content: finding.technicalDetails },
          { label: "Evidence", content: finding.evidence ?? "No explicit code evidence was returned by the backend." },
          { label: "Suggested fix", content: finding.suggestedFix ?? finding.recommendation },
        ],
      };
    case "BA":
      return {
        headline: finding.title,
        summary: finding.summary,
        emphasisLabel: "Affected flow",
        emphasisValue: finding.affectedFeature ?? finding.category,
        secondaryLabel: "Requirement risk",
        secondaryValue: finding.summary,
        recommendationLabel: "Business action",
        recommendation: "Validate expected workflow behavior and confirm the fix preserves the intended business rule.",
        detailSections: [
          { label: "Business impact", content: finding.businessImpact },
          { label: "Requirement implication", content: finding.summary },
          { label: "Recommended fix framing", content: finding.recommendation },
        ],
      };
    case "QA":
      return {
        headline: finding.title,
        summary: finding.summary,
        emphasisLabel: "Suggested validation",
        emphasisValue: finding.suggestedTestCases[0] ?? "Add edge-case coverage before release.",
        secondaryLabel: "Regression surface",
        secondaryValue: finding.tags.join(" | "),
        recommendationLabel: "QA next step",
        recommendation: "Convert the impacted branch paths into automated and exploratory verification scenarios.",
        detailSections: [
          { label: "QA impact", content: finding.qaImpact },
          { label: "Suggested test cases", content: finding.suggestedTestCases.join(" ") || "Add coverage around the affected line and branch path." },
          { label: "Evidence", content: finding.evidence ?? "Use the linked line and behavior description as the assertion anchor." },
        ],
      };
    case "PM":
      return {
        headline: finding.title,
        summary: finding.summary,
        emphasisLabel: "Business risk",
        emphasisValue: finding.businessImpact,
        secondaryLabel: "Recommended action",
        secondaryValue: finding.recommendation,
        recommendationLabel: "Decision guidance",
        recommendation: "Treat this as a release risk item until ownership, fix scope, and validation timing are confirmed.",
        detailSections: [
          { label: "Executive summary", content: finding.pmSummary },
          { label: "Impact scope", content: finding.businessImpact },
          { label: "Delivery action", content: finding.recommendation },
        ],
      };
  }
}
