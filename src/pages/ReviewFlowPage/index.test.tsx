import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReviewFlowPage } from "@/pages/ReviewFlowPage";

const snippetId = "snippet_algebra";
const reviewRunsStorageKey = "synthetic-architect.review-flow.runs";
const snippetCode = [
  "import numpy as np",
  "arr = np.array([[4, 2], [1, 3]])",
  "print(arr)",
  "result = eval('2 + 2')",
].join("\n");

function jsonResponse(payload: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }),
  );
}

function renderPage() {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <ReviewFlowPage />
    </MemoryRouter>,
  );
  return { user };
}

function readStoredRuns() {
  return JSON.parse(window.localStorage.getItem(reviewRunsStorageKey) ?? "[]") as Array<Record<string, unknown>>;
}

async function closeReviewerProfileModalIfOpen(user: ReturnType<typeof userEvent.setup>) {
  const dialog = screen.queryByRole("dialog");
  if (!dialog) {
    return;
  }

  const closeButton = within(dialog).queryByRole("button", { name: /Done|Continue in Background/i });
  if (!closeButton) {
    return;
  }

  await user.click(closeButton);
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
}

async function prepareReview(user: ReturnType<typeof userEvent.setup>) {
  const modeButton = screen.getByRole("button", { name: /Multiple Agent/i });
  await user.click(modeButton);
  expect(modeButton).toHaveAttribute("aria-pressed", "true");

  await screen.findByRole("button", { name: "Select line 4" });
  const runButton = screen.getByRole("button", { name: "Run Review" });
  await waitFor(() => expect(runButton).toBeEnabled());
  return { runButton };
}

async function addInterviewerNote(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole("button", { name: "Select line 4" });
  await user.click(screen.getByRole("button", { name: "Select line 4" }));
  await user.type(screen.getByPlaceholderText("Issue title"), "Potential eval risk");
  await user.type(
    screen.getByPlaceholderText(/Why do you think this is a problem/i),
    "Dynamic evaluation should be reviewed before AI feedback.",
  );
  await user.click(screen.getByRole("button", { name: "Add Review Comment" }));
  await screen.findByText("Potential eval risk");
}

async function submitReview(user: ReturnType<typeof userEvent.setup>) {
  const { runButton } = await prepareReview(user);
  await user.click(runButton);
  await screen.findByRole("heading", { name: "Findings overview" });
  await closeReviewerProfileModalIfOpen(user);
}

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn((input: string | URL) => {
      const url = input.toString();

      if (url.endsWith("/snippets")) {
        return jsonResponse({
          snippets: [
            {
              id: snippetId,
              language: "python",
              context: "Linear algebra sample",
              num_seeded_issues: 1,
            },
          ],
        });
      }

      if (url.endsWith(`/snippets/${snippetId}`)) {
        return jsonResponse({
          id: snippetId,
          language: "python",
          context: "Linear algebra sample",
          code: snippetCode,
        });
      }

      return Promise.reject(new Error("offline"));
    }),
  );
});

describe("ReviewFlowPage", () => {
  it("does not crash when an older persisted review run is missing new input fields", async () => {
    window.localStorage.setItem(
      reviewRunsStorageKey,
      JSON.stringify([
        {
          id: "legacy-run-1",
          status: "draft",
          createdAt: "2026-03-31T00:00:00.000Z",
          updatedAt: "2026-03-31T00:00:00.000Z",
          currentStep: 1,
          input: {
            reviewMode: "multiple_agent",
            notes: "",
          },
        },
      ]),
    );

    renderPage();

    expect(await screen.findByRole("button", { name: "Select line 4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run Review" })).toBeEnabled();
  });

  it("does not crash in step 3 when an older persisted run is missing suggested line feedback fields", async () => {
    window.localStorage.setItem(
      reviewRunsStorageKey,
      JSON.stringify([
        {
          id: "legacy-step3-run",
          status: "completed",
          createdAt: "2026-03-31T00:00:00.000Z",
          updatedAt: "2026-04-01T00:00:00.000Z",
          currentStep: 3,
          input: {
            reviewMode: "multiple_agent",
            selectedSnippetId: snippetId,
            mainFiles: [
              {
                id: "main-1",
                kind: "main",
                name: `snippets/${snippetId}.py`,
                content: snippetCode,
                size: snippetCode.length,
                uploadedAt: "2026-04-01T00:00:00.000Z",
              },
            ],
            supportingFiles: [],
            developerNotes: [],
            notes: "",
          },
          result: {
            reviewRunId: "legacy-step3-run",
            mode: "multiple_agent",
            transportMode: "mock-fallback",
            summaryText: "Legacy saved run",
            issues: [
              {
                id: "issue-1",
                title: "Unsafe dynamic evaluation detected",
                severity: "critical",
                roleName: "Security Agent",
                filePath: `snippets/${snippetId}.py`,
                lineNumber: 4,
                locationLabel: `snippets/${snippetId}.py:4`,
                description: "Legacy issue payload",
                suggestion: "Use a safer parser instead of eval.",
                originalSnippet: "result = eval('2 + 2')",
                replacementSnippet: "safe_eval(result)",
                sourceFileContent: snippetCode,
                rationale: "Legacy rationale",
                canRenderRichDiff: false,
                noteMatchStatus: "unknown",
                relatedNoteIds: [],
                relatedNoteTitles: [],
                feedback: {
                  comments: [],
                },
                rawMetadata: {},
              },
            ],
            noteComparison: {
              totalNotes: 0,
              matchedNotes: 0,
              unmatchedNotes: 0,
              agentMatchedIssues: 0,
              agentOnlyIssues: 1,
              notes: [],
            },
            severityCounts: {
              critical: 1,
              high: 0,
              medium: 0,
              low: 0,
            },
            submittedAt: "2026-04-01T00:00:00.000Z",
            supportsMultilineSource: false,
            rawResponse: {},
          },
        },
      ]),
    );

    renderPage();

    expect(await screen.findByRole("button", { name: /Expand Unchanged Lines/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Report fault for suggested line 4/i })).toBeInTheDocument();
  });

  it("keeps step 1 validation and review mode card selection with backend snippet input", async () => {
    const { user } = renderPage();

    const runButton = screen.getByRole("button", { name: "Run Review" });
    expect(runButton).toBeDisabled();

    const modeButton = screen.getByRole("button", { name: /Multiple Agent/i });
    await user.click(modeButton);
    expect(modeButton).toHaveAttribute("aria-pressed", "true");

    await screen.findByRole("button", { name: "Select line 4" });
    await waitFor(() => expect(runButton).toBeEnabled());
  });

  it("supports hover-based multi-line selection in phase 1 before adding a reviewer note", async () => {
    const { user } = renderPage();

    await screen.findByRole("button", { name: "Select line 4" });

    await user.click(screen.getByRole("button", { name: "Select line 2" }));
    await user.hover(screen.getByRole("button", { name: "Anchor line 4 from code" }));
    await user.click(screen.getByRole("button", { name: "Select line 4" }));

    expect(screen.getByText(/Selected lines 2-4/i)).toBeInTheDocument();
    expect(screen.getByText(/Anchored to snippets\/snippet_algebra\.py:2-4/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Issue title"), "Range-based reviewer note");
    await user.type(
      screen.getByPlaceholderText(/Why do you think this is a problem/i),
      "The surrounding logic across these lines needs to be reviewed together.",
    );
    await user.click(screen.getByRole("button", { name: "Add Review Comment" }));

    expect(await screen.findByText("Range-based reviewer note")).toBeInTheDocument();

    const [storedRun] = readStoredRuns();
    expect(storedRun.input).toMatchObject({
      developerNotes: expect.arrayContaining([
        expect.objectContaining({
          title: "Range-based reviewer note",
          lineStart: 2,
          lineEnd: 4,
        }),
      ]),
    });
  });

  it("moves from submit flow to step 2 with the backend snippet contract and fallback summary", async () => {
    const { user } = renderPage();

    await submitReview(user);

    expect(screen.getByRole("heading", { name: "Findings overview" })).toBeInTheDocument();
    expect(
      screen.getByText(/Backend review failed, so the summary was generated with the local fallback mapper/i),
    ).toBeInTheDocument();
  });

  it("renders summary issues returned from the normalized result", async () => {
    const { user } = renderPage();

    await submitReview(user);

    expect(screen.getByText("Unsafe dynamic evaluation detected")).toBeInTheDocument();
    expect(screen.getByText(/surfaced 1 issue/i)).toBeInTheDocument();
  });

  it("compares interviewer notes against returned agent issues", async () => {
    const { user } = renderPage();

    await prepareReview(user);
    await addInterviewerNote(user);
    await user.click(screen.getByRole("button", { name: "Run Review" }));
    await screen.findByRole("heading", { name: "Findings overview" });

    expect(screen.getByText("Interviewer Note Comparison")).toBeInTheDocument();
    expect(screen.getByText("Matched notes")).toBeInTheDocument();
    expect(screen.getByText("Potential eval risk")).toBeInTheDocument();
    expect(screen.getByText("Matches Interviewer Note")).toBeInTheDocument();
  }, 10000);

  it("triggers report fault from step 2", async () => {
    const { user } = renderPage();

    await submitReview(user);
    await user.click(screen.getByRole("button", { name: "Report Fault" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Fault Reported" })).toBeDisabled());
  });

  it("allows moving from step 2 to step 3", async () => {
    const { user } = renderPage();

    await submitReview(user);
    await user.click(screen.getByRole("button", { name: /Continue to Marker Review Phase/i }));

    expect(screen.getByRole("heading", { name: "GitHub-like review detail" })).toBeInTheDocument();
  });

  it("shows the full-file diff fallback in step 3 when only line-level backend data is available", async () => {
    const { user } = renderPage();

    await submitReview(user);
    await user.click(screen.getByRole("button", { name: /Continue to Marker Review Phase/i }));

    const combinedReview = screen.getByRole("region", { name: /Combined file review for /i });

    expect(screen.getByText(/All highlighted changes for this file are merged into one review box/i)).toBeInTheDocument();
    expect(within(combinedReview).getByText(/^Combined File Review$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Expand Unchanged Lines/i })).toBeInTheDocument();
    expect(within(combinedReview).getByRole("button", { name: /Show 3 unchanged lines \(1-3\)/i })).toBeInTheDocument();
    expect(within(combinedReview).queryByText("import numpy as np")).not.toBeInTheDocument();
    expect(within(combinedReview).getByText(/result = eval\('2 \+ 2'\)/)).toBeInTheDocument();
    expect(
      screen.getByText(/Replace eval with a deterministic parser or allow-listed dispatch/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Expand Unchanged Lines/i }));
    expect(within(combinedReview).getByText("import numpy as np")).toBeInTheDocument();
  });

  it("generates a frontend replacement line when backend does not return replacement code", async () => {
    window.localStorage.setItem(
      reviewRunsStorageKey,
      JSON.stringify([
        {
          id: "frontend-generated-run",
          status: "completed",
          createdAt: "2026-04-01T00:00:00.000Z",
          updatedAt: "2026-04-01T00:00:00.000Z",
          currentStep: 3,
          input: {
            reviewMode: "mono",
            selectedSnippetId: "generated-types",
            mainFiles: [
              {
                id: "main-types-1",
                kind: "main",
                name: "snippets/generated_types.ts",
                content: "const payload: any = source;",
                size: 28,
                uploadedAt: "2026-04-01T00:00:00.000Z",
              },
            ],
            supportingFiles: [],
            developerNotes: [],
            notes: "",
          },
          result: {
            reviewRunId: "frontend-generated-run",
            mode: "mono",
            transportMode: "api",
            summaryText: "Frontend generated replacement preview",
            issues: [
              {
                id: "issue-generated-1",
                title: "Broad typing reduces review confidence",
                severity: "medium",
                filePath: "snippets/generated_types.ts",
                lineNumber: 1,
                locationLabel: "snippets/generated_types.ts:1",
                description: "The issue did not include a replacement block.",
                suggestion: "Replace `any` with a narrower domain type or validated interface.",
                originalSnippet: "const payload: any = source;",
                sourceFileContent: "const payload: any = source;",
                rationale: "Legacy API payload without a patch block",
                canRenderRichDiff: false,
                noteMatchStatus: "unknown",
                relatedNoteIds: [],
                relatedNoteTitles: [],
                feedback: {
                  comments: [],
                  suggestedLineReports: [],
                },
                rawMetadata: {},
              },
            ],
            noteComparison: {
              totalNotes: 0,
              matchedNotes: 0,
              unmatchedNotes: 0,
              agentMatchedIssues: 0,
              agentOnlyIssues: 1,
              notes: [],
            },
            severityCounts: {
              critical: 0,
              high: 0,
              medium: 1,
              low: 0,
            },
            submittedAt: "2026-04-01T00:00:00.000Z",
            supportsMultilineSource: false,
            rawResponse: {},
          },
        },
      ]),
    );

    renderPage();

    expect(await screen.findByText(/payload: SpecificType = source;/)).toBeInTheDocument();
    expect(screen.queryByText(/Some green rows were generated directly by the frontend/i)).not.toBeInTheDocument();
  });

  it("opens the comment modal and saves a comment for an issue", async () => {
    const { user } = renderPage();

    await submitReview(user);
    await user.click(screen.getByRole("button", { name: /Continue to Marker Review Phase/i }));
    await user.click(screen.getByRole("button", { name: "Comment" }));

    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("Add your note"), "Please verify this suggestion.");
    await user.click(within(dialog).getByRole("button", { name: "Save Comment" }));

    expect(await screen.findByText("1 saved comment")).toBeInTheDocument();
  });

  it("marks a result as wrong from the marker review step", async () => {
    const { user } = renderPage();

    await submitReview(user);
    await user.click(screen.getByRole("button", { name: /Continue to Marker Review Phase/i }));
    await user.click(screen.getByRole("button", { name: "Mark Wrong Result" }));

    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("Add your note"), "The line mapping is incorrect.");
    await user.click(within(dialog).getByRole("button", { name: "Save Wrong Result" }));

    expect(await screen.findByRole("button", { name: "Marked Wrong" })).toBeDisabled();
  });

  it("lets the reviewer report a faulty suggested green line with fault type and comment", async () => {
    const { user } = renderPage();

    await submitReview(user);
    await user.click(screen.getByRole("button", { name: /Continue to Marker Review Phase/i }));
    await user.click(screen.getByRole("button", { name: /Report fault for suggested line 4/i }));

    const dialog = screen.getByRole("dialog");
    await user.selectOptions(within(dialog).getByRole("combobox"), "wrong_logic");
    await user.type(
      within(dialog).getByPlaceholderText("Optional explanation for admin review"),
      "This added line does not match the intended secure implementation.",
    );
    await user.click(within(dialog).getByRole("button", { name: "Report Faulty Line" }));

    expect(await screen.findByRole("button", { name: /Fault reported for suggested line 4/i })).toBeDisabled();
    expect(screen.getByText("Wrong logic")).toBeInTheDocument();
    expect(
      screen.getByText("This added line does not match the intended secure implementation."),
    ).toBeInTheDocument();
  }, 10000);

  it("stores reviewer profile answers and the backend review id while the review request is running", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL) => {
        const url = input.toString();

        if (url.endsWith("/snippets")) {
          return jsonResponse({
            snippets: [
              {
                id: snippetId,
                language: "python",
                context: "Linear algebra sample",
                num_seeded_issues: 1,
              },
            ],
          });
        }

        if (url.endsWith(`/snippets/${snippetId}`)) {
          return jsonResponse({
            id: snippetId,
            language: "python",
            context: "Linear algebra sample",
            code: snippetCode,
          });
        }

        if (url.endsWith("/review/specialist")) {
          return new Promise((resolve) => {
            window.setTimeout(() => {
              resolve(
                new Response(
                  JSON.stringify({
                    review_id: "api-review-123",
                    mode: "specialist",
                    snippet_id: snippetId,
                    findings: [
                      {
                        id: "finding-1",
                        role: "security",
                        severity: "critical",
                        confidence: "high",
                        line: 4,
                        title: "Unsafe dynamic evaluation detected",
                        description: "Avoid eval here.",
                        suggestion: "Use a safer parser.",
                      },
                    ],
                    summary: "Backend review summary",
                    metadata: {
                      total_tokens: 100,
                      latency_ms: 1200,
                      agents_used: ["security"],
                    },
                  }),
                  {
                    status: 200,
                    headers: {
                      "Content-Type": "application/json",
                    },
                  },
                ),
              );
            }, 75);
          });
        }

        return Promise.reject(new Error("offline"));
      }),
    );

    const { user } = renderPage();

    await prepareReview(user);
    await user.click(screen.getByRole("button", { name: "Run Review" }));

    await screen.findByRole("dialog");
    const liveDialog = screen.getByRole("dialog");
    const [roleSelect, toolSelect] = within(liveDialog).getAllByRole("combobox");
    await user.selectOptions(roleSelect, "QA");
    await user.type(within(liveDialog).getByPlaceholderText("e.g. 5"), "7");
    await user.selectOptions(toolSelect, "ai_assistant");
    await user.type(
      within(liveDialog).getByPlaceholderText("Capture what matters most in code review for your team."),
      "It protects delivery quality and catches risks early.",
    );

    await user.click(await screen.findByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByRole("heading", { name: "Findings overview" })).toBeInTheDocument();

    const [storedRun] = readStoredRuns();
    expect(storedRun.reviewerProfile).toMatchObject({
      role: "QA",
      yearsOfExperience: 7,
      usualReviewTool: "ai_assistant",
      codeReviewImportance: "It protects delivery quality and catches risks early.",
    });
    expect(storedRun.submissionMetadata).toMatchObject({
      apiReviewId: "api-review-123",
      transportMode: "api",
    });
  }, 10000);

  it("stores extra reviewer-only bugs added in phase 3", async () => {
    window.localStorage.setItem(
      reviewRunsStorageKey,
      JSON.stringify([
        {
          id: "phase3-finding-run",
          status: "completed",
          createdAt: "2026-04-01T00:00:00.000Z",
          updatedAt: "2026-04-01T00:02:00.000Z",
          currentStep: 3,
          input: {
            reviewMode: "multiple_agent",
            selectedSnippetId: snippetId,
            mainFiles: [
              {
                id: "main-1",
                kind: "main",
                name: `snippets/${snippetId}.py`,
                content: snippetCode,
                size: snippetCode.length,
                uploadedAt: "2026-04-01T00:00:00.000Z",
              },
            ],
            supportingFiles: [],
            developerNotes: [],
            notes: "",
          },
          result: {
            reviewRunId: "phase3-finding-run",
            mode: "multiple_agent",
            transportMode: "mock-fallback",
            summaryText: "Legacy saved run",
            issues: [
              {
                id: "issue-1",
                title: "Unsafe dynamic evaluation detected",
                severity: "critical",
                roleName: "Security Agent",
                filePath: `snippets/${snippetId}.py`,
                lineNumber: 4,
                locationLabel: `snippets/${snippetId}.py:4`,
                description: "Legacy issue payload",
                suggestion: "Use a safer parser instead of eval.",
                originalSnippet: "result = eval('2 + 2')",
                replacementSnippet: "safe_eval(result)",
                sourceFileContent: snippetCode,
                rationale: "Legacy rationale",
                canRenderRichDiff: false,
                noteMatchStatus: "unknown",
                relatedNoteIds: [],
                relatedNoteTitles: [],
                feedback: {
                  comments: [],
                  suggestedLineReports: [],
                },
                rawMetadata: {},
              },
            ],
            noteComparison: {
              totalNotes: 0,
              matchedNotes: 0,
              unmatchedNotes: 0,
              agentMatchedIssues: 0,
              agentOnlyIssues: 1,
              notes: [],
            },
            severityCounts: {
              critical: 1,
              high: 0,
              medium: 0,
              low: 0,
            },
            submittedAt: "2026-04-01T00:00:00.000Z",
            supportsMultilineSource: false,
            rawResponse: {},
          },
        },
      ]),
    );

    const { user } = renderPage();

    await user.click(await screen.findByRole("button", { name: /Expand Unchanged Lines/i }));
    await user.click(await screen.findByRole("button", { name: "Anchor phase 3 line 3 from code" }));
    await user.hover(screen.getByRole("button", { name: "Anchor phase 3 line 4 from code" }));
    await user.click(screen.getByRole("button", { name: "Select phase 3 line 4" }));
    await user.type(screen.getByPlaceholderText("Bug title"), "Agent missed input validation risk");
    await user.type(
      screen.getByPlaceholderText("Why do you think this is a missed bug?"),
      "The surrounding branch still accepts unsafe input paths.",
    );
    await user.click(screen.getByRole("button", { name: "Add Missed Bug" }));

    expect(await screen.findByText("Agent missed input validation risk")).toBeInTheDocument();

    const [storedRun] = readStoredRuns();
    expect(storedRun.phase3Findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Agent missed input validation risk",
          filePath: `snippets/${snippetId}.py`,
          lineStart: 3,
          lineEnd: 4,
          sourcePhase: 3,
        }),
      ]),
    );
  });

  it("tracks and shows total active time plus per-step time in the review flow header", async () => {
    window.localStorage.setItem(
      reviewRunsStorageKey,
      JSON.stringify([
        {
          id: "timed-review-run",
          status: "completed",
          createdAt: "2026-04-01T00:00:00.000Z",
          updatedAt: "2026-04-01T00:02:00.000Z",
          currentStep: 2,
          stepMetrics: {
            totalActiveSec: 120,
            stepTimesSec: {
              1: 45,
              2: 30,
              3: 45,
            },
          },
          input: {
            reviewMode: "multiple_agent",
            selectedSnippetId: snippetId,
            mainFiles: [
              {
                id: "main-1",
                kind: "main",
                name: `snippets/${snippetId}.py`,
                content: snippetCode,
                size: snippetCode.length,
                uploadedAt: "2026-04-01T00:00:00.000Z",
              },
            ],
            supportingFiles: [],
            developerNotes: [],
            notes: "",
          },
          result: {
            reviewRunId: "timed-review-run",
            mode: "multiple_agent",
            transportMode: "mock-fallback",
            summaryText: "Stored review with timing metrics",
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

    renderPage();

    expect(await screen.findByText("Time spent: 2m 0s")).toBeInTheDocument();
    expect(screen.getAllByText("Active time 45s")).toHaveLength(2);
    expect(screen.getByText("Active time 30s")).toBeInTheDocument();
  });

  it("expands only the selected collapsed section in step 3 instead of every section at once", async () => {
    const multiSectionCode = [
      "const alpha = 1;",
      "const beta = 2;",
      "const gamma = 3;",
      "result = eval('2 + 2')",
      "const delta = 4;",
      "const epsilon = 5;",
      "const zeta = 6;",
      "window.location = target",
      "return result;",
    ].join("\n");

    window.localStorage.setItem(
      reviewRunsStorageKey,
      JSON.stringify([
        {
          id: "multi-collapse-run",
          status: "completed",
          createdAt: "2026-04-01T00:00:00.000Z",
          updatedAt: "2026-04-01T00:02:00.000Z",
          currentStep: 3,
          input: {
            reviewMode: "multiple_agent",
            selectedSnippetId: "multi-collapse",
            mainFiles: [
              {
                id: "main-multi-collapse",
                kind: "main",
                name: "snippets/multi_collapse.ts",
                content: multiSectionCode,
                size: multiSectionCode.length,
                uploadedAt: "2026-04-01T00:00:00.000Z",
              },
            ],
            supportingFiles: [],
            developerNotes: [],
            notes: "",
          },
          result: {
            reviewRunId: "multi-collapse-run",
            mode: "multiple_agent",
            transportMode: "mock-fallback",
            summaryText: "Multiple collapsed sections",
            issues: [
              {
                id: "issue-a",
                title: "Unsafe dynamic evaluation detected",
                severity: "critical",
                roleName: "Security Agent",
                filePath: "snippets/multi_collapse.ts",
                lineNumber: 4,
                locationLabel: "snippets/multi_collapse.ts:4",
                description: "Eval should not be used here.",
                suggestion: "Use a safe parser.",
                originalSnippet: "result = eval('2 + 2')",
                replacementSnippet: "safeEvaluate(result)",
                sourceFileContent: multiSectionCode,
                rationale: "Legacy unsafe behavior",
                canRenderRichDiff: false,
                noteMatchStatus: "unknown",
                relatedNoteIds: [],
                relatedNoteTitles: [],
                feedback: {
                  comments: [],
                  suggestedLineReports: [],
                },
                rawMetadata: {},
              },
              {
                id: "issue-b",
                title: "Redirect handling should be validated",
                severity: "high",
                roleName: "Security Agent",
                filePath: "snippets/multi_collapse.ts",
                lineNumber: 8,
                locationLabel: "snippets/multi_collapse.ts:8",
                description: "Redirect target should be validated.",
                suggestion: "Validate the redirect target.",
                originalSnippet: "window.location = target",
                replacementSnippet: "window.location = getValidatedRedirectTarget(target)",
                sourceFileContent: multiSectionCode,
                rationale: "Open redirect risk",
                canRenderRichDiff: false,
                noteMatchStatus: "unknown",
                relatedNoteIds: [],
                relatedNoteTitles: [],
                feedback: {
                  comments: [],
                  suggestedLineReports: [],
                },
                rawMetadata: {},
              },
            ],
            noteComparison: {
              totalNotes: 0,
              matchedNotes: 0,
              unmatchedNotes: 0,
              agentMatchedIssues: 0,
              agentOnlyIssues: 2,
              notes: [],
            },
            severityCounts: {
              critical: 1,
              high: 1,
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

    const { user } = renderPage();

    const combinedReview = await screen.findByRole("region", { name: /Combined file review for /i });
    const firstCollapsedSection = within(combinedReview).getByRole("button", {
      name: /Show 3 unchanged lines \(1-3\)/i,
    });
    expect(within(combinedReview).getByRole("button", { name: /Show 3 unchanged lines \(5-7\)/i })).toBeInTheDocument();

    await user.click(firstCollapsedSection);

    expect(within(combinedReview).getByText("const alpha = 1;")).toBeInTheDocument();
    expect(within(combinedReview).getByRole("button", { name: /Show 3 unchanged lines \(5-7\)/i })).toBeInTheDocument();
  });

  it("validates and submits the survey modal with a max score of 3", async () => {
    const { user } = renderPage();

    await submitReview(user);
    await user.click(screen.getByRole("button", { name: /Continue to Marker Review Phase/i }));
    await user.click(screen.getByRole("button", { name: "Open Survey" }));

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Submit Survey" }));
    expect(within(dialog).getByText("Please answer all survey questions before submitting.")).toBeInTheDocument();

    const findingsCard = within(dialog).getByRole("group", { name: "How useful were the review findings?" });
    const modeCard = within(dialog).getByRole("group", {
      name: /How useful was the Multiple Agent review mode for this run/i,
    });
    const clarityCard = within(dialog).getByRole("group", {
      name: "How clear was the file-level code review in Phase 3?",
    });
    const trustCard = within(dialog).getByRole("group", {
      name: "How much did you trust the suggested changes?",
    });

    await user.click(within(findingsCard).getByRole("button", { name: /3/i }));
    await user.click(within(modeCard).getByRole("button", { name: /2/i }));
    await user.click(within(clarityCard).getByRole("button", { name: /3/i }));
    await user.click(within(trustCard).getByRole("button", { name: /2/i }));
    await user.click(within(dialog).getByRole("button", { name: "Submit Survey" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText(/Survey saved locally while backend support is pending/i)).toBeInTheDocument();
  }, 10000);
});
