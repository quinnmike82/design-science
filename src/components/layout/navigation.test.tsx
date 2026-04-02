import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SideNav } from "@/components/layout/SideNav";
import { TopNav } from "@/components/layout/TopNav";
import { getReviewRun } from "@/services/review.service";

describe("results navigation", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps the current shared results route in the top navigation when local history is empty", () => {
    render(
      <MemoryRouter initialEntries={["/results/review-run-shared"]}>
        <TopNav />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Results" })).toHaveAttribute("href", "/results/review-run-shared");
  });

  it("keeps the current shared results route in the side navigation when local history is empty", () => {
    render(
      <MemoryRouter initialEntries={["/results/review-run-shared"]}>
        <SideNav />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Results" })).toHaveAttribute("href", "/results/review-run-shared");
  });

  it("can resolve a stored run by backend review id alias", () => {
    window.localStorage.setItem(
      "synthetic-architect.review-flow.runs",
      JSON.stringify([
        {
          id: "review-run-shared",
          status: "completed",
          createdAt: "2026-04-02T00:00:00.000Z",
          updatedAt: "2026-04-02T00:01:00.000Z",
          currentStep: 2,
          stepMetrics: {
            totalActiveSec: 60,
            stepTimesSec: {
              1: 30,
              2: 30,
              3: 0,
            },
          },
          submissionMetadata: {
            apiReviewId: "backend-review-42",
            transportMode: "api",
            capturedAt: "2026-04-02T00:01:00.000Z",
          },
          input: {
            reviewMode: "multiple_agent",
            selectedSnippetId: "snippet-shared",
            mainFiles: [],
            supportingFiles: [],
            developerNotes: [],
            notes: "",
          },
          result: {
            reviewRunId: "review-run-shared",
            backendReviewId: "backend-review-42",
            mode: "multiple_agent",
            transportMode: "api",
            summaryText: "Shared result",
            issues: [],
            noteComparison: {
              totalNotes: 0,
              matchedNotes: 0,
              unmatchedNotes: 0,
              agentMatchedIssues: 0,
              agentOnlyIssues: 0,
              notes: [],
            },
            severityCounts: {
              critical: 0,
              high: 0,
              medium: 0,
              low: 0,
            },
            submittedAt: "2026-04-02T00:01:00.000Z",
            supportsMultilineSource: false,
            rawResponse: {},
          },
        },
      ]),
    );

    expect(getReviewRun("backend-review-42")?.id).toBe("review-run-shared");
  });

  it("can read a legacy stored result through the new review run loader", () => {
    window.localStorage.setItem(
      "coding-coach.sessions",
      JSON.stringify([
        {
          id: "review-run-legacy",
          title: "Legacy review",
          description: "Legacy saved session",
          projectType: "Backend Service",
          language: "Python",
          stakeholderRole: "DEV",
          createdAt: "2026-04-02T00:00:00.000Z",
          status: "completed",
          artifacts: [],
          snippetId: "snippet_legacy",
          snippetTitle: "snippet legacy",
          snippetContext: "Legacy snippet",
          snippetLanguage: "python",
          snippetCode: "result = eval('2 + 2')",
          developerComments: [],
          submittedAt: "2026-04-02T00:02:00.000Z",
          timeSpentSec: 120,
          reviewMode: "specialist",
          backendSessionId: "legacy-session-1",
        },
      ]),
    );
    window.localStorage.setItem(
      "coding-coach.results",
      JSON.stringify({
        "review-run-legacy": {
          reviewId: "review-run-legacy",
          sessionId: "legacy-session-1",
          mode: "specialist",
          executiveSummary: "Legacy executive summary",
          mergedSummary: "Legacy merged summary",
          releaseRecommendation: "Proceed with Caution",
          estimatedFixEffort: "1 to 3 hours",
          overallRisk: "Moderate",
          severityCounts: {
            critical: 0,
            high: 1,
            medium: 0,
            low: 0,
          },
          findings: [
            {
              id: "legacy-finding-1",
              agentId: "security",
              severity: "high",
              confidence: "high",
              category: "Security",
              title: "Unsafe eval",
              summary: "Avoid eval",
              technicalDetails: "Dynamic evaluation is unsafe.",
              businessImpact: "Could execute unsafe code.",
              qaImpact: "Add regression coverage.",
              pmSummary: "High-risk finding.",
              filePath: "snippets/snippet_legacy.py",
              lineStart: 1,
              lineEnd: 1,
              recommendation: "Use a safe parser.",
              suggestedFix: "safeEvaluate(expression)",
              suggestedTestCases: [],
              tags: [],
              relatedArtifacts: [],
              developerFoundStatus: "missed",
              relatedCommentIds: [],
            },
          ],
          agentSummaries: [],
          metrics: {
            timeSpentSec: 120,
            condition: "specialist",
          },
          recommendedActions: [],
          developerComments: [],
          coaching: {
            caught: [],
            missed: [],
            falsePositives: [],
            summary: "Legacy coaching",
          },
          issueReports: [],
        },
      }),
    );

    const run = getReviewRun("review-run-legacy");

    expect(run?.id).toBe("review-run-legacy");
    expect(run?.result?.summaryText).toBe("Legacy merged summary");
    expect(run?.input.reviewMode).toBe("multiple_agent");
  });
});
