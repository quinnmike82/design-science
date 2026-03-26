import { ReviewSession } from "@/types/review";

export const reviewSessionsSeed: ReviewSession[] = [
  {
    id: "rev-synth-001",
    title: "Checkout Redirect Hardening",
    description:
      "Validate new checkout auth, partner redirect policy, and pricing fallback behavior before release.",
    projectType: "Frontend App",
    language: "TypeScript",
    stakeholderRole: "DEV",
    createdAt: "2026-03-26T09:00:00.000Z",
    status: "draft",
    artifacts: [
      {
        id: "artifact-001",
        type: "codeChange",
        name: "auth-provider.ts patch",
        fileName: "src/auth/auth-provider.ts",
        size: 3892,
        uploadedAt: "2026-03-26T08:50:00.000Z",
        content: `diff --git a/src/auth/auth-provider.ts b/src/auth/auth-provider.ts
@@
-return res.redirect(params.redirect_uri)
+const redirect = params.redirect_uri || "/dashboard"
+return res.redirect(redirect)

export async function approveQuote(input: QuoteApprovalInput) {
  if (!input.quoteId) {
    throw new Error("missing quote id")
  }

  const approver = await employeeDirectory.getByEmail(input.approverEmail)
  return quoteRepository.updateApproval(input.quoteId, {
    approverId: approver?.id,
    approvedAt: new Date().toISOString(),
  })
}`,
      },
      {
        id: "artifact-002",
        type: "fsd",
        name: "Checkout redirect hardening FSD",
        fileName: "docs/checkout-redirect-fsd.md",
        size: 1120,
        uploadedAt: "2026-03-26T08:55:00.000Z",
        content: `Feature: Partner checkout redirect

Rules:
1. Redirects after OAuth must resolve only to approved partner domains.
2. Quotes above 50,000 USD require an approver with finance_admin role.
3. When pricing cannot be resolved, checkout must fail closed and ask the user to retry.`,
      },
      {
        id: "artifact-003",
        type: "testcase",
        name: "Negative path regression matrix",
        fileName: "qa/checkout-regression.csv",
        size: 824,
        uploadedAt: "2026-03-26T09:02:00.000Z",
        content: `scenario,expected
invalid redirect domain,reject and route to dashboard
missing approver role,return forbidden
pricing timeout,show retry state and do not submit quote`,
      },
      {
        id: "artifact-004",
        type: "notes",
        name: "Reviewer context",
        uploadedAt: "2026-03-26T09:04:00.000Z",
        content: `Rush review before Friday release.
Recent incidents:
- partner redirect abuse in a similar service
- finance team raised concern on approval bypass
- QA reported flaky pricing timeout behavior in staging`,
      },
    ],
  },
  {
    id: "rev-synth-002",
    title: "Billing Entitlement Sync",
    description: "Audit stale pricing cache invalidation and entitlement refresh sequencing.",
    projectType: "Backend Service",
    language: "Go",
    stakeholderRole: "PM",
    createdAt: "2026-03-23T12:15:00.000Z",
    status: "completed",
    artifacts: [
      {
        id: "artifact-005",
        type: "codeChange",
        name: "entitlement sync handler",
        fileName: "billing/sync.go",
        size: 2496,
        uploadedAt: "2026-03-23T11:10:00.000Z",
        content: "func SyncEntitlements(ctx context.Context) error {\n  // mock content\n}",
      },
    ],
  },
  {
    id: "rev-synth-003",
    title: "Notification Orchestration Refactor",
    description: "Review the refactor that consolidates notification templates and delivery policy checks.",
    projectType: "Platform",
    language: "Python",
    stakeholderRole: "QA",
    createdAt: "2026-03-21T16:20:00.000Z",
    status: "running",
    artifacts: [
      {
        id: "artifact-006",
        type: "notes",
        name: "Refactor notes",
        uploadedAt: "2026-03-21T16:05:00.000Z",
        content: "Investigate retry loops, deduplication logic, and SMS policy compliance.",
      },
    ],
  },
];
