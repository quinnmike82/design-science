import { ArrowRight, Bot, CheckCircle2, ShieldCheck, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import { Panel } from "@/components/common/Panel";
import { agentDefinitions } from "@/data/agents";
import { AgentIcon } from "@/components/common/AgentIcon";
import { getLatestReviewRun } from "@/services/review.service";

const trustPoints = [
  "Security, architecture, logic, maintainability, testing, and policy agents operate as one review system.",
  "One canonical review result projects into DEV, BA, QA, and PM views without duplicating data.",
  "Frontend-only mock services create clean boundaries for the future backend and orchestration layer.",
];

const testimonials = [
  {
    quote:
      "Synthetic Architect caught a redirect flaw and an approval bypass in the same review run, then gave us clean summaries for engineering and product without duplicating the work.",
    name: "Leona Park",
    title: "Staff Engineer, Prism Commerce",
  },
  {
    quote:
      "The stakeholder switch is what changed our process. QA gets validation scenarios, PM gets release impact, and engineering keeps the file-level detail.",
    name: "Darren Iqbal",
    title: "Head of Delivery, Northstar Labs",
  },
  {
    quote:
      "It feels like a premium review workspace, not a generic admin dashboard. The mock flow was structured enough that our backend team can plug into it later.",
    name: "Mina Alvarez",
    title: "Principal Product Manager, Orbit Systems",
  },
];

export function LandingPage() {
  const latestRunId = getLatestReviewRun()?.id;
  const resultLink = latestRunId ? `/results/${latestRunId}` : "/workspace";

  return (
    <AppShell className="px-0 pt-16">
      <section className="relative overflow-hidden bg-hero px-5 pb-20 pt-20 md:px-8 md:pb-28 md:pt-28">
        <div className="absolute inset-0 bg-grid opacity-[0.08]" />
        <div className="relative mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <span className="inline-flex size-2 rounded-full bg-primary shadow-glow" />
              Agentic Review Kernel
            </div>
            <div className="space-y-6">
              <h1 className="max-w-4xl font-display text-5xl font-bold leading-none tracking-tight text-on-surface text-glow md:text-7xl">
                Synthetic Architect turns one review run into four stakeholder-ready narratives.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-on-surface-variant md:text-xl">
                A premium multi-agent code review workspace for security, architecture, logic, testing, policy, and
                maintainability. Built frontend-first with clean mock API boundaries for future orchestration.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/workspace">
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link to={resultLink}>View Latest Results</Link>
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {trustPoints.map((point) => (
                <div key={point} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <CheckCircle2 className="mb-3 size-5 text-secondary" />
                  <p className="text-sm leading-6 text-on-surface-variant">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <Panel className="panel-grid relative overflow-hidden p-4 md:p-6">
            <div className="absolute -right-14 top-0 size-44 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute -bottom-14 left-0 size-40 rounded-full bg-secondary/10 blur-3xl" />
            <div className="relative rounded-[28px] border border-white/10 bg-black/25">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-error/60" />
                  <span className="size-2.5 rounded-full bg-tertiary/60" />
                  <span className="size-2.5 rounded-full bg-secondary/60" />
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                  rev-synth-001
                </div>
              </div>
              <div className="grid gap-4 p-4 md:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl border border-white/10 bg-surface-low/90 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="font-display text-lg font-semibold text-on-surface">Review Workspace</div>
                      <div className="text-sm text-on-surface-variant">Checkout Redirect Hardening</div>
                    </div>
                    <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
                      DEV View
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-xs leading-6 text-on-surface-variant">
                    <div>src/auth/auth-provider.ts</div>
                    <div className="mt-2 text-on-surface">
                      return res.redirect(params.redirect_uri)
                    </div>
                    <div className="mt-4 text-secondary">Suggested fix: validateRedirect(...)</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-surface/80 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      Risk profile
                    </div>
                    <div className="mt-3 grid gap-3">
                      <div className="rounded-2xl border border-error/25 bg-error/10 p-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-error">Critical</div>
                        <div className="mt-1 text-2xl font-semibold text-on-surface">1</div>
                      </div>
                      <div className="rounded-2xl border border-tertiary/25 bg-tertiary/10 p-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-tertiary">High</div>
                        <div className="mt-1 text-2xl font-semibold text-on-surface">4</div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-surface/80 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      Stakeholder switch
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["DEV", "BA", "QA", "PM"].map((role) => (
                        <span
                          key={role}
                          className={`rounded-full px-3 py-1 text-xs ${
                            role === "DEV"
                              ? "border border-primary/30 bg-primary/10 text-primary"
                              : "border border-white/10 bg-white/5 text-on-surface-variant"
                          }`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                      Same findings, role-aware presentation. Technical depth for engineers, release framing for PMs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-8">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary">Specialist Agents</div>
            <h2 className="font-display text-4xl font-bold tracking-tight text-on-surface">
              Six focused agents, one normalized review model.
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
            Every agent keeps its own specialty, but the product presents a unified review system in the workspace,
            progress panel, filters, findings, and dashboard summaries.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
          {agentDefinitions.map((agent, index) => (
            <Panel
              key={agent.id}
              className={`space-y-4 ${index === 0 ? "xl:col-span-7" : index === 1 ? "xl:col-span-5" : "xl:col-span-4"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <AgentIcon name={agent.icon} className="size-5" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                  {agent.category}
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-2xl font-semibold text-on-surface">{agent.name}</h3>
                <p className="text-sm leading-7 text-on-surface-variant">{agent.description}</p>
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-surface-low/40 px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-[1400px] gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Panel className="space-y-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">Why It Works</div>
            <h2 className="font-display text-4xl font-bold tracking-tight text-on-surface">
              Designed for future backend replacement, not trapped in demo code.
            </h2>
            <p className="text-sm leading-7 text-on-surface-variant">
              Mock services sit behind typed contracts for review sessions, artifacts, run status, and results. The
              role-aware transformation logic lives in a dedicated presentation layer, so the UI can change viewpoint
              instantly without re-fetching or duplicating data.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Bot className="mb-3 size-5 text-primary" />
                <div className="font-medium text-on-surface">Mock orchestration</div>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Promise-based services simulate file uploads, agent progress, and completed review runs.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <ShieldCheck className="mb-3 size-5 text-secondary" />
                <div className="font-medium text-on-surface">Typed boundaries</div>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Strong models keep sessions, artifacts, agents, findings, and role projections consistent.
                </p>
              </div>
            </div>
          </Panel>

          <div className="grid gap-4 md:grid-cols-2">
            {testimonials.map((item) => (
              <Panel key={item.name} className="space-y-4">
                <Star className="size-5 text-primary" />
                <p className="text-sm leading-7 text-on-surface">{item.quote}</p>
                <div>
                  <div className="font-medium text-on-surface">{item.name}</div>
                  <div className="text-sm text-on-surface-variant">{item.title}</div>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 py-24 text-center md:px-8">
        <Panel highlighted className="space-y-6 px-6 py-10 md:px-10 md:py-14">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary">Start The Demo</div>
          <h2 className="font-display text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
            Launch the review workspace and run the 3-phase review flow.
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-on-surface-variant">
            Upload review input, inspect the structured summary, then move into the marker review experience with inline feedback and a lightweight survey.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/workspace">Open Workspace</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/history">Browse Review History</Link>
            </Button>
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
