import { ReviewResult } from "@/types/review";

export const reviewResultsSeed: ReviewResult[] = [
  {
    reviewId: "rev-synth-001",
    executiveSummary:
      "The review found one critical redirect vulnerability, two high-risk authorization and logic gaps, and several medium-severity maintainability and testing weaknesses. The highest-risk issues are concentrated in the OAuth callback, quote approval path, and pricing fallback logic.",
    releaseRecommendation: "Hold Release",
    estimatedFixEffort: "1.5 to 2 days",
    overallRisk: "Severe",
    severityCounts: {
      critical: 1,
      high: 4,
      medium: 5,
      low: 1,
    },
    agentSummaries: [
      {
        agentId: "security",
        headline: "Unsafe redirect and authorization assumptions were detected.",
        summary:
          "The callback flow trusts redirect parameters and the approval flow can persist an undefined approver identity.",
        focusAreas: ["OAuth callback allow-listing", "Approver role validation"],
      },
      {
        agentId: "architecture",
        headline: "Approval and pricing logic cross too many ownership boundaries.",
        summary:
          "UI workflow code owns fallback paths that should stay behind domain-level validation and service policies.",
        focusAreas: ["Approval boundary ownership", "Pricing provider abstraction"],
      },
      {
        agentId: "logic",
        headline: "Fail-open paths contradict the stated requirement design.",
        summary:
          "Pricing timeout and redirect branching do not fail closed even though the FSD explicitly requires that behavior.",
        focusAreas: ["Pricing fallback", "Missing invalid branch handling"],
      },
      {
        agentId: "maintainability",
        headline: "The patch introduces branching debt in already fragile code paths.",
        summary:
          "Conditional logic and inline policy checks make the review surface harder to reason about and to change safely.",
        focusAreas: ["Callback helper extraction", "Approval helper separation"],
      },
      {
        agentId: "testing",
        headline: "Negative-path and policy regression coverage is incomplete.",
        summary:
          "No tests currently enforce rejected redirects, finance approver role checks, or stale pricing timeouts.",
        focusAreas: ["Negative path tests", "Regression matrix automation"],
      },
      {
        agentId: "policy",
        headline: "The implementation violates internal secure redirect and approval standards.",
        summary:
          "Current code does not satisfy the platform allow-list standard and bypasses the required role gate for high-value quote approvals.",
        focusAreas: ["Platform redirect standard", "Approval control standard"],
      },
    ],
    findings: [
      {
        id: "finding-001",
        agentId: "security",
        severity: "critical",
        confidence: "high",
        category: "Open Redirect",
        title: "OAuth callback accepts an unvalidated redirect target",
        summary:
          "The callback returns users to a raw `redirect_uri` value without checking whether the target belongs to an approved domain.",
        technicalDetails:
          "The patched flow preserves `params.redirect_uri` and only falls back to `/dashboard` when the value is absent. That means an attacker can supply a crafted URL and have the application redirect to a malicious destination after successful auth. The FSD requires allow-listed partner domains only, so this branch should call a validator before redirecting.",
        businessImpact:
          "Users can be redirected to a malicious partner-looking page after login, which can lead to phishing or session abuse and breaches the promised partner safety behavior.",
        qaImpact:
          "Add validation scenarios for allowed domains, disallowed domains, malformed URLs, and missing redirect values. Regression should confirm the user is routed to the dashboard when the redirect is rejected.",
        pmSummary:
          "A critical security issue exists in the login redirect. If released, users may be sent to unsafe destinations after authentication.",
        filePath: "src/auth/auth-provider.ts",
        lineStart: 42,
        lineEnd: 46,
        recommendation:
          "Introduce a strict allow-list validator and fail closed to `/dashboard` whenever the target is absent, malformed, or outside approved domains.",
        suggestedDiff: `- return res.redirect(params.redirect_uri)
+ const safeUrl = validateRedirect(params.redirect_uri, approvedDomains)
+ return res.redirect(safeUrl ?? "/dashboard")`,
        suggestedTestCases: [
          "Reject `https://evil.example` and redirect to `/dashboard`.",
          "Allow `https://partners.syntheticarchitect.app/checkout/complete`.",
          "Reject malformed URLs and log policy telemetry.",
        ],
        tags: ["auth", "redirect", "owasp"],
        relatedArtifacts: ["artifact-001", "artifact-002", "artifact-003"],
        affectedFeature: "Partner checkout handoff",
      },
      {
        id: "finding-002",
        agentId: "security",
        severity: "high",
        confidence: "high",
        category: "Authorization",
        title: "High-value quote approval can persist without a valid approver role",
        summary:
          "The approval flow updates the quote with `approver?.id` but does not verify the user exists or holds the required finance role.",
        technicalDetails:
          "The current implementation trusts `employeeDirectory.getByEmail` and immediately writes the approval record. If the lookup fails or returns a non-finance user, the system can still mark the quote as approved because the repository call is not guarded by a role check.",
        businessImpact:
          "Quotes above the approval threshold could be processed without the required finance authorization, violating stated approval rules and financial control expectations.",
        qaImpact:
          "Cover missing approver, inactive approver, and wrong-role approver cases. Verify the API returns forbidden and the quote status remains unchanged.",
        pmSummary:
          "A required finance approval control can be bypassed, which creates release and audit risk for high-value quotes.",
        filePath: "src/quotes/approveQuote.ts",
        lineStart: 13,
        lineEnd: 24,
        recommendation:
          "Fail before persistence unless the approver exists and explicitly has the `finance_admin` permission.",
        suggestedTestCases: [
          "Reject approval when approver email is unknown.",
          "Reject approval when approver lacks `finance_admin`.",
          "Persist approval only when role validation succeeds.",
        ],
        tags: ["authorization", "approval", "finance"],
        relatedArtifacts: ["artifact-001", "artifact-002"],
        affectedFeature: "Enterprise quote approval",
      },
      {
        id: "finding-003",
        agentId: "architecture",
        severity: "high",
        confidence: "medium",
        category: "Boundary Ownership",
        title: "Pricing fallback logic is implemented in the UI workflow instead of the pricing domain",
        summary:
          "The component-level patch decides how to recover from pricing failures, which spreads domain policy across presentation code.",
        technicalDetails:
          "Checkout orchestration is deciding whether to continue when pricing data is stale or unavailable. That policy belongs in a domain service that can enforce fail-closed rules consistently across web, admin, and API callers.",
        businessImpact:
          "Inconsistent pricing decisions can cause mismatched checkout outcomes depending on which entry point triggered the flow.",
        qaImpact:
          "Regression needs to compare browser, admin, and API paths so fallback behavior cannot diverge by channel.",
        pmSummary:
          "A policy decision is embedded in the wrong layer, which increases the risk of inconsistent behavior and follow-on defects.",
        filePath: "src/features/checkout/useCheckoutSubmit.ts",
        lineStart: 77,
        lineEnd: 109,
        recommendation:
          "Move pricing fallback decisions into a shared pricing policy service and let the UI react only to the resolved decision.",
        suggestedTestCases: [
          "Ensure browser and admin flows both fail closed on stale pricing.",
          "Verify the UI only consumes a normalized pricing decision object.",
        ],
        tags: ["architecture", "pricing", "layering"],
        relatedArtifacts: ["artifact-001", "artifact-002", "artifact-004"],
        affectedFeature: "Checkout pricing confirmation",
      },
      {
        id: "finding-004",
        agentId: "logic",
        severity: "high",
        confidence: "high",
        category: "Business Rule Validation",
        title: "Pricing timeout path fails open despite the FSD requiring fail-closed behavior",
        summary:
          "When the pricing provider times out, the workflow keeps the previous quote state and continues submission instead of requiring a retry.",
        technicalDetails:
          "The new branch catches pricing timeout errors and keeps the last known pricing object in memory. The FSD explicitly states checkout must stop and request a retry whenever current pricing cannot be resolved.",
        businessImpact:
          "Users may complete checkout using stale or unverified pricing, creating billing disputes and inconsistent order outcomes.",
        qaImpact:
          "Test stale quote cache, pricing timeout, and retry-after-timeout flows. Confirm the user sees a retry prompt and no order is submitted.",
        pmSummary:
          "Checkout can continue with stale pricing, which raises revenue accuracy and customer trust risk.",
        filePath: "src/features/checkout/useCheckoutSubmit.ts",
        lineStart: 110,
        lineEnd: 132,
        recommendation:
          "Replace the fail-open branch with a hard stop that returns a retry state to the UI and records pricing telemetry.",
        suggestedTestCases: [
          "Timeout the pricing call and confirm checkout does not submit.",
          "Retry after timeout and verify fresh pricing is required before continuation.",
        ],
        tags: ["logic", "pricing", "requirements"],
        relatedArtifacts: ["artifact-002", "artifact-003", "artifact-004"],
        affectedFeature: "Checkout pricing confirmation",
      },
      {
        id: "finding-005",
        agentId: "maintainability",
        severity: "medium",
        confidence: "medium",
        category: "Code Health",
        title: "Policy and orchestration checks are mixed into one callback handler",
        summary:
          "The auth callback now combines redirect validation, audit logging, and flow routing in a single branch-heavy function.",
        technicalDetails:
          "The callback patch introduces conditional logic for redirect parsing, fallback routing, and approval context mapping inside one handler. This makes the critical auth path harder to review, harder to test in isolation, and more likely to accumulate side effects over time.",
        businessImpact:
          "Future changes to partner routing or compliance logging are more likely to introduce accidental behavior changes in login flows.",
        qaImpact:
          "Testing effort rises because a single callback now owns multiple responsibilities and requires more branch coverage.",
        pmSummary:
          "The implementation is getting harder to change safely, which increases delivery friction for future auth work.",
        filePath: "src/auth/auth-provider.ts",
        lineStart: 31,
        lineEnd: 78,
        recommendation:
          "Extract redirect validation, audit logging, and route resolution into dedicated helpers with focused unit tests.",
        suggestedTestCases: [
          "Unit test redirect validation independently from audit logging.",
          "Verify callback routing decisions with helper-level coverage.",
        ],
        tags: ["maintainability", "auth", "refactor"],
        relatedArtifacts: ["artifact-001", "artifact-004"],
        affectedFeature: "Login callback",
      },
      {
        id: "finding-006",
        agentId: "testing",
        severity: "medium",
        confidence: "high",
        category: "Coverage Gap",
        title: "No automated regression covers invalid redirect inputs",
        summary:
          "The attached regression matrix lists invalid redirect scenarios, but there is no evidence of automated coverage in the patch set.",
        technicalDetails:
          "The test artifact documents invalid domain, malformed URL, and missing redirect cases, yet the review package does not include unit or integration tests that assert those outcomes. A critical auth branch is therefore unprotected from regression.",
        businessImpact:
          "A future patch can accidentally reintroduce unsafe redirect behavior without any warning in CI.",
        qaImpact:
          "Add unit and integration coverage for each invalid redirect scenario plus allow-list acceptance cases.",
        pmSummary:
          "A critical security behavior is not protected by automation, making future releases less predictable.",
        recommendation:
          "Add unit tests around the redirect validator and an integration test that confirms rejected redirects land on the safe default route.",
        suggestedTestCases: [
          "Reject disallowed redirect domains in unit tests.",
          "Reject malformed redirect values in integration tests.",
          "Confirm valid allow-listed redirects still succeed.",
        ],
        tags: ["testing", "regression", "security"],
        relatedArtifacts: ["artifact-002", "artifact-003"],
        affectedFeature: "Partner checkout handoff",
      },
      {
        id: "finding-007",
        agentId: "testing",
        severity: "medium",
        confidence: "medium",
        category: "Coverage Gap",
        title: "Approval workflow lacks negative-path coverage for missing approver states",
        summary:
          "Current tests do not prove that the quote remains unapproved when the approver record is missing or invalid.",
        technicalDetails:
          "The change set introduces approval behavior based on directory lookup but does not cover null approver results, role mismatch, or inactive users. These are the exact branches where control failure is most likely.",
        businessImpact:
          "The organization can believe approvals are enforced while hidden edge cases still allow invalid approvals to pass.",
        qaImpact:
          "Add scenario coverage for unknown approver email, wrong role, and inactive approver profile before sign-off.",
        pmSummary:
          "The team lacks verification for a key approval control, which weakens release confidence.",
        recommendation:
          "Extend approval tests to assert both the API response and the persisted quote state across all rejection branches.",
        suggestedTestCases: [
          "Return forbidden and preserve draft status when approver is missing.",
          "Return forbidden and preserve draft status when approver lacks finance role.",
        ],
        tags: ["testing", "approval", "negative-path"],
        relatedArtifacts: ["artifact-001", "artifact-003"],
        affectedFeature: "Enterprise quote approval",
      },
      {
        id: "finding-008",
        agentId: "policy",
        severity: "high",
        confidence: "high",
        category: "Policy Compliance",
        title: "Redirect handling violates the platform secure redirect standard",
        summary:
          "Internal standards require every external redirect target to be validated against an allow-list helper before execution.",
        technicalDetails:
          "The reviewed patch directly redirects from a request parameter instead of routing through the platform `validateRedirectTarget` utility mandated by frontend security policy. This is a documented compliance violation in addition to the security exposure.",
        businessImpact:
          "The release would breach an internal control and create audit follow-up even if no exploit occurs immediately.",
        qaImpact:
          "Policy verification should assert the approved helper is called and that telemetry fires when a redirect is rejected.",
        pmSummary:
          "This change breaks an internal engineering standard and would create governance follow-up if shipped.",
        filePath: "src/auth/auth-provider.ts",
        lineStart: 42,
        lineEnd: 46,
        recommendation:
          "Adopt the shared `validateRedirectTarget` helper and log rejections using the standard telemetry event.",
        suggestedTestCases: [
          "Assert redirect validation utility is invoked before navigation.",
          "Assert rejected redirects emit the correct telemetry event.",
        ],
        tags: ["policy", "security", "standards"],
        relatedArtifacts: ["artifact-001", "artifact-002"],
        affectedFeature: "Partner checkout handoff",
      },
      {
        id: "finding-009",
        agentId: "policy",
        severity: "medium",
        confidence: "medium",
        category: "Naming & Convention",
        title: "Approval path writes raw directory data without normalized policy metadata",
        summary:
          "The approval record is persisted without storing the validated approval source and rule version expected by the audit convention.",
        technicalDetails:
          "Platform convention requires the approval event payload to include `approvedByRole`, `policyVersion`, and `approvalSource`. The current patch only writes the approver ID and timestamp, which weakens traceability.",
        businessImpact:
          "Audit and support teams lose evidence explaining why a high-value quote was approved and under which control policy.",
        qaImpact:
          "Verification should confirm the stored approval event includes normalized policy metadata whenever approval succeeds.",
        pmSummary:
          "Approval traceability is incomplete, which can slow audits and incident response.",
        filePath: "src/quotes/approveQuote.ts",
        lineStart: 18,
        lineEnd: 24,
        recommendation:
          "Persist the approval role, policy version, and approval source as part of the normalized audit event.",
        suggestedTestCases: [
          "Store policy metadata on successful approval.",
          "Reject or log when metadata cannot be resolved.",
        ],
        tags: ["policy", "audit", "approvals"],
        relatedArtifacts: ["artifact-001", "artifact-004"],
        affectedFeature: "Enterprise quote approval",
      },
      {
        id: "finding-010",
        agentId: "architecture",
        severity: "medium",
        confidence: "medium",
        category: "Dependency Flow",
        title: "Checkout hook now depends directly on analytics telemetry for control decisions",
        summary:
          "The patch uses telemetry availability to decide whether to continue a checkout fallback path, coupling product behavior to observability infrastructure.",
        technicalDetails:
          "The submission hook checks telemetry response state before deciding whether to continue after pricing errors. Business behavior should never depend on analytics delivery; telemetry should observe decisions rather than shape them.",
        businessImpact:
          "Checkout behavior can become inconsistent when analytics is degraded, which creates avoidable customer-facing variance.",
        qaImpact:
          "Simulate telemetry failures and confirm they do not change checkout behavior.",
        pmSummary:
          "A non-critical infrastructure dependency can influence product behavior, which adds operational risk.",
        filePath: "src/features/checkout/useCheckoutSubmit.ts",
        lineStart: 132,
        lineEnd: 151,
        recommendation:
          "Decouple telemetry from control flow and emit analytics after a pricing decision is already resolved.",
        suggestedTestCases: ["Fail telemetry delivery and confirm pricing fallback behavior is unchanged."],
        tags: ["architecture", "telemetry", "coupling"],
        relatedArtifacts: ["artifact-001", "artifact-004"],
        affectedFeature: "Checkout pricing confirmation",
      },
      {
        id: "finding-011",
        agentId: "logic",
        severity: "low",
        confidence: "medium",
        category: "Usability Edge Case",
        title: "Reviewer-facing error message does not explain why redirect was rejected",
        summary:
          "The current rejection path routes safely but gives the user no reason or next-step context.",
        technicalDetails:
          "When redirect validation fails, the user is silently returned to the dashboard. This is technically safe but makes it harder to distinguish between an expired link and a blocked destination.",
        businessImpact:
          "Support volume may increase because users cannot understand why their partner handoff failed.",
        qaImpact:
          "Add a scenario that confirms a clear retry message appears when redirect validation fails.",
        pmSummary:
          "Low severity, but poor messaging can increase support and confusion after a blocked redirect.",
        recommendation:
          "Show a safe retry message and log a user-facing reason code when redirect validation fails.",
        suggestedTestCases: ["Display retry guidance when a redirect is blocked."],
        tags: ["logic", "ux", "support"],
        relatedArtifacts: ["artifact-002", "artifact-004"],
        affectedFeature: "Partner checkout handoff",
      },
    ],
  },
  {
    reviewId: "rev-synth-002",
    executiveSummary:
      "Billing entitlement sync has no critical blockers, but stale cache invalidation still introduces elevated release risk.",
    releaseRecommendation: "Proceed with Caution",
    estimatedFixEffort: "6 to 8 hours",
    overallRisk: "Elevated",
    severityCounts: {
      critical: 0,
      high: 2,
      medium: 3,
      low: 1,
    },
    agentSummaries: [],
    findings: [],
  },
  {
    reviewId: "rev-synth-003",
    executiveSummary:
      "Notification orchestration refactor is structurally sound overall, but retry coordination and SMS policy handling still need follow-up before release confidence improves.",
    releaseRecommendation: "Proceed with Caution",
    estimatedFixEffort: "4 to 6 hours",
    overallRisk: "Moderate",
    severityCounts: {
      critical: 0,
      high: 1,
      medium: 2,
      low: 1,
    },
    agentSummaries: [
      {
        agentId: "logic",
        headline: "Retry sequencing still allows duplicate notifications in one edge path.",
        summary: "The refactor consolidated orchestration well, but duplicate-send protection is not consistently applied after retry recovery.",
        focusAreas: ["Retry recovery", "Deduplication state"],
      },
      {
        agentId: "policy",
        headline: "SMS quiet-hour handling needs explicit policy validation.",
        summary: "The current change centralizes templates but does not fully enforce policy windows for all message channels.",
        focusAreas: ["Quiet hours", "Channel policy parity"],
      },
    ],
    findings: [
      {
        id: "finding-201",
        agentId: "logic",
        severity: "high",
        confidence: "medium",
        category: "Retry Sequencing",
        title: "Duplicate send guard is skipped after retry recovery",
        summary: "A retry success path can bypass the in-memory deduplication marker and emit the same notification twice.",
        technicalDetails:
          "The refactor re-enters the delivery path after a recoverable transport failure, but the deduplication marker is only set on the initial attempt. When the retry succeeds, the guard is not rechecked before dispatch.",
        businessImpact:
          "Users may receive duplicate operational messages, which reduces trust and can generate support noise.",
        qaImpact:
          "Add recovery-path tests that simulate one failed send followed by a successful retry and assert that only one notification is emitted.",
        pmSummary:
          "A retry edge case can still send duplicate notifications, which is noisy but manageable if fixed before rollout.",
        filePath: "notifications/orchestrator.py",
        lineStart: 88,
        lineEnd: 113,
        recommendation:
          "Normalize the deduplication guard so both initial and recovered sends pass through the same dispatch boundary.",
        suggestedTestCases: [
          "Fail then recover the transport and confirm exactly one message is emitted.",
        ],
        tags: ["notifications", "retry", "dedupe"],
        relatedArtifacts: ["artifact-006"],
        affectedFeature: "Notification retry orchestration",
      },
      {
        id: "finding-202",
        agentId: "policy",
        severity: "medium",
        confidence: "medium",
        category: "Channel Policy",
        title: "SMS quiet-hour policy is not enforced on fallback sends",
        summary: "Fallback to SMS after email failure does not consistently re-evaluate quiet-hour policy.",
        technicalDetails:
          "Template fallback correctly selects SMS, but the quiet-hour policy check runs only on the primary channel decision. A delayed fallback can therefore bypass the channel restriction window.",
        businessImpact:
          "Messages can be sent outside approved contact windows, creating customer experience and compliance concerns.",
        qaImpact:
          "Test email-to-SMS fallback during quiet hours and verify the message is deferred rather than sent immediately.",
        pmSummary:
          "The fallback path can violate communication timing policy and should be fixed before broad release.",
        filePath: "notifications/policy.py",
        lineStart: 34,
        lineEnd: 57,
        recommendation:
          "Re-evaluate channel policy after any fallback decision and emit a deferral event when quiet hours apply.",
        suggestedTestCases: [
          "Fallback to SMS during quiet hours should defer instead of sending.",
        ],
        tags: ["policy", "sms", "fallback"],
        relatedArtifacts: ["artifact-006"],
        affectedFeature: "Notification channel fallback",
      },
      {
        id: "finding-203",
        agentId: "testing",
        severity: "medium",
        confidence: "high",
        category: "Coverage Gap",
        title: "No regression suite covers retry-plus-dedupe behavior",
        summary: "The refactor has integration coverage for first-pass sends, but not for recovered retry flows.",
        technicalDetails:
          "Current tests assert single-dispatch only on clean sends. They do not cover failure recovery, delayed send replay, or fallback channel sequencing where most orchestration bugs hide.",
        businessImpact:
          "Duplicate or misrouted notifications can return in later changes without CI catching them.",
        qaImpact:
          "Extend integration coverage for retry, fallback, and deferred quiet-hour scenarios.",
        pmSummary:
          "The main remaining risk is inadequate test coverage around the trickiest orchestration paths.",
        recommendation:
          "Add end-to-end integration tests for recovered sends, delayed fallback, and channel policy deferral.",
        suggestedTestCases: [
          "Recovered retry emits one message.",
          "Quiet-hour fallback is deferred and logged.",
        ],
        tags: ["testing", "regression", "orchestration"],
        relatedArtifacts: ["artifact-006"],
        affectedFeature: "Notification retry orchestration",
      },
      {
        id: "finding-204",
        agentId: "maintainability",
        severity: "low",
        confidence: "medium",
        category: "Readability",
        title: "Template resolution and delivery policy are still intertwined in one module",
        summary: "The refactor improved consolidation, but one module still owns both template lookup and delivery timing rules.",
        technicalDetails:
          "The module reads more cleanly than before, but it still mixes rendering concerns with policy concerns, which raises the cost of future changes.",
        businessImpact:
          "Future channel or policy changes will be slower and more defect-prone than necessary.",
        qaImpact:
          "Refactoring later will require careful regression of template rendering and delivery timing together.",
        pmSummary:
          "Low immediate risk, but the module will remain harder to evolve if left as-is.",
        recommendation:
          "Separate template resolution from delivery policy evaluation after the current refactor stabilizes.",
        suggestedTestCases: ["Verify refactor preserves existing template rendering after policy extraction."],
        tags: ["maintainability", "templates", "policy"],
        relatedArtifacts: ["artifact-006"],
        affectedFeature: "Notification template resolution",
      },
    ],
  },
];
