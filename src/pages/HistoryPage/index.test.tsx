import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { HistoryPage } from "@/pages/HistoryPage";

describe("HistoryPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows total time spent and step-by-step timing for each saved run", async () => {
    window.localStorage.setItem(
      "synthetic-architect.review-flow.runs",
      JSON.stringify([
        {
          id: "history-timed-run",
          status: "completed",
          createdAt: "2026-04-01T00:00:00.000Z",
          updatedAt: "2026-04-01T00:02:00.000Z",
          currentStep: 3,
          stepMetrics: {
            totalActiveSec: 135,
            stepTimesSec: {
              1: 60,
              2: 45,
              3: 30,
            },
          },
          input: {
            reviewMode: "multiple_agent",
            selectedSnippetId: "history-snippet",
            mainFiles: [
              {
                id: "main-history-1",
                kind: "main",
                name: "snippets/history_snippet.py",
                content: "print('history')",
                size: 16,
                uploadedAt: "2026-04-01T00:00:00.000Z",
              },
            ],
            supportingFiles: [],
            developerNotes: [],
            notes: "",
          },
          result: {
            reviewRunId: "history-timed-run",
            mode: "multiple_agent",
            transportMode: "mock-fallback",
            summaryText: "Saved history entry",
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
            submittedAt: "2026-04-01T00:02:00.000Z",
            supportsMultilineSource: false,
            rawResponse: {},
          },
        },
      ]),
    );

    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("2m 15s")).toBeInTheDocument();
    expect(screen.getByText("Phase 1 1m 0s")).toBeInTheDocument();
    expect(screen.getByText("Phase 2 45s")).toBeInTheDocument();
    expect(screen.getByText("Phase 3 30s")).toBeInTheDocument();
  });
});
