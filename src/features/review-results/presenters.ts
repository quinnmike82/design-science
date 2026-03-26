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
  switch (role) {
    case "DEV":
      return {
        eyebrow: "Technical review",
        title: "Implementation hotspots across auth, pricing, and orchestration layers",
        description: result.executiveSummary,
        callout: `Focus on critical file-level fixes first. Current release posture: ${result.releaseRecommendation}.`,
      };
    case "BA":
      return {
        eyebrow: "Requirement alignment",
        title: "Several flows can violate expected user and entitlement rules",
        description:
          "The review indicates mismatches between the intended checkout, entitlement, and admin workflows and the current implementation path.",
        callout: "Validate redirect, approval, and pricing fallback rules before release sign-off.",
      };
    case "QA":
      return {
        eyebrow: "Verification posture",
        title: "High regression risk around invalid inputs and cross-service state handling",
        description:
          "Coverage is thin where the code branches on invalid redirects, missing approver context, and stale pricing state.",
        callout: "Prioritize negative paths, boundary input, and authorization checks.",
      };
    case "PM":
      return {
        eyebrow: "Release perspective",
        title: `Release confidence is ${result.overallRisk === "Contained" ? "stable" : "reduced"} due to unresolved blockers`,
        description:
          "The review found issues that can affect security, business-rule accuracy, and release quality if they ship unchanged.",
        callout: `Recommendation: ${result.releaseRecommendation}. Estimated coordination effort: ${result.estimatedFixEffort}.`,
      };
  }
}

export function getRoleBasedRecommendation(result: ReviewResult, role: StakeholderRole) {
  switch (role) {
    case "DEV":
      return "Patch critical auth and authorization findings first, then resolve pricing fallback logic and dependency boundaries.";
    case "BA":
      return "Confirm redirect, entitlement, and approval rules with product requirements before sign-off.";
    case "QA":
      return "Create regression suites for invalid redirects, unauthorized approval paths, and stale pricing state.";
    case "PM":
      return `Do not proceed without mitigation for the critical blockers. Plan ${result.estimatedFixEffort} for fixes and verification.`;
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
        body: finding.technicalDetails,
        emphasisLabel: "Why it matters",
        emphasisValue: finding.summary,
        secondaryLabel: "Trace",
        secondaryValue: finding.filePath
          ? `${finding.filePath}${finding.lineStart ? `:${finding.lineStart}` : ""}`
          : finding.category,
        recommendationLabel: "Implementation direction",
        recommendation: finding.recommendation,
      };
    case "BA":
      return {
        headline: finding.title,
        body: finding.businessImpact,
        emphasisLabel: "Affected flow",
        emphasisValue: finding.affectedFeature ?? finding.category,
        secondaryLabel: "Requirement risk",
        secondaryValue: finding.summary,
        recommendationLabel: "Business action",
        recommendation: "Validate expected workflow behavior and confirm the fix preserves the intended business rule.",
      };
    case "QA":
      return {
        headline: finding.title,
        body: finding.qaImpact,
        emphasisLabel: "Suggested validation",
        emphasisValue: finding.suggestedTestCases[0] ?? "Add edge-case coverage before release.",
        secondaryLabel: "Regression surface",
        secondaryValue: finding.tags.join(" | "),
        recommendationLabel: "QA next step",
        recommendation: "Convert the impacted branch paths into automated and exploratory verification scenarios.",
      };
    case "PM":
      return {
        headline: finding.title,
        body: finding.pmSummary,
        emphasisLabel: "Business risk",
        emphasisValue: finding.businessImpact,
        secondaryLabel: "Recommended action",
        secondaryValue: finding.recommendation,
        recommendationLabel: "Decision guidance",
        recommendation: "Treat this as a release risk item until ownership, fix scope, and validation timing are confirmed.",
      };
  }
}
