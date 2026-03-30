import { CreateReviewSessionPayload } from "@/types/review";
/*

const draftArtifacts: Artifact[] = [
  {
    id: "artifact-draft-code",
    type: "codeChange",
    name: "auth-provider.ts patch",
    fileName: "auth-provider.ts",
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
    id: "artifact-draft-fsd",
    type: "fsd",
    name: "Checkout redirect hardening FSD",
    fileName: "checkout-redirect-fsd.md",
    size: 1120,
    uploadedAt: "2026-03-26T08:55:00.000Z",
    content: `Feature: Partner checkout redirect

Rules:
1. Redirects after OAuth must resolve only to approved partner domains.
2. Quotes above 50,000 USD require an approver with finance_admin role.
3. When pricing cannot be resolved, checkout must fail closed and ask the user to retry.`,
  },
  {
    id: "artifact-draft-tests",
    type: "testcase",
    name: "Negative path regression matrix",
    fileName: "checkout-regression.csv",
    size: 824,
    uploadedAt: "2026-03-26T09:02:00.000Z",
    content: `scenario,expected
invalid redirect domain,reject and route to dashboard
missing approver role,return forbidden
pricing timeout,show retry state and do not submit quote`,
  },
  {
    id: "artifact-draft-notes",
    type: "notes",
    name: "Reviewer context",
    uploadedAt: "2026-03-26T09:04:00.000Z",
    content: `Rush review before Friday release.
Recent incidents:
- partner redirect abuse in a similar service
- finance team raised concern on approval bypass
- QA reported flaky pricing timeout behavior in staging`,
  },
];

export const defaultReviewDraft: CreateReviewSessionPayload = {
  title: "Checkout Redirect Hardening",
  description:
    "Validate the new checkout authorization and redirect flow before the release candidate moves into staging.",
  projectType: "Frontend App",
  language: "TypeScript",
  stakeholderRole: "DEV",
  artifacts: draftArtifacts,
};
*/

export const defaultReviewDraft: CreateReviewSessionPayload = {
  title: "Developer Coaching Session",
  description: "Local compatibility fallback draft.",
  projectType: "Backend Service",
  language: "Python",
  stakeholderRole: "DEV",
  snippetId: "snippet_01",
  snippetTitle: "snippet 01",
  snippetContext: "Local compatibility fallback.",
  snippetLanguage: "python",
  snippetCode: "",
  artifacts: [],
  developerComments: [],
};
