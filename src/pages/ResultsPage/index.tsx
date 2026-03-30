import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Download, Share2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { Panel } from "@/components/common/Panel";
import { CoachingSummaryPanel } from "@/components/results/CoachingSummaryPanel";
import { ExecutiveSummaryCard } from "@/components/results/ExecutiveSummaryCard";
import { SeverityOverview } from "@/components/results/SeverityOverview";
import { RecommendationPanel } from "@/components/results/RecommendationPanel";
import { ReviewMetricsGrid } from "@/components/results/ReviewMetricsGrid";
import { RoleAwareSummaryPanel } from "@/components/results/RoleAwareSummaryPanel";
import { AgentFilterBar } from "@/components/results/AgentFilterBar";
import { FindingsList } from "@/components/results/FindingsList";
import { FollowUpChatPanel } from "@/components/results/FollowUpChatPanel";
import { StakeholderRoleSelect } from "@/components/review/StakeholderRoleSelect";
import { agentDefinitions } from "@/data/agents";
import { filterAndSortFindings } from "@/features/review-results/filters";
import { getRoleBasedExecutiveSummary } from "@/features/review-results/presenters";
import { reviewRunService } from "@/services/reviewRunService";
import { reviewSessionService } from "@/services/reviewSessionService";
import { useReviewStore } from "@/store/useReviewStore";
import { ReviewSession, StakeholderRole } from "@/types/review";

export function ResultsPage() {
  const params = useParams<{ reviewId: string }>();
  const reviewId = params.reviewId ?? "";
  const {
    sessions,
    results,
    currentReviewId,
    currentRole,
    resultsFilters,
    setCurrentReviewId,
    setCurrentRole,
    upsertSession,
    setResult,
    setResultsFilters,
    resetResultsFilters,
  } = useReviewStore(useShallow((state) => ({
    sessions: state.sessions,
    results: state.results,
    currentReviewId: state.currentReviewId,
    currentRole: state.currentRole,
    resultsFilters: state.resultsFilters,
    setCurrentReviewId: state.setCurrentReviewId,
    setCurrentRole: state.setCurrentRole,
    upsertSession: state.upsertSession,
    setResult: state.setResult,
    setResultsFilters: state.setResultsFilters,
    resetResultsFilters: state.resetResultsFilters,
  })));
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const session = sessions[reviewId];
  const result = results[reviewId];

  useEffect(() => {
    if (reviewId && currentReviewId !== reviewId) {
      setCurrentReviewId(reviewId);
    }
    resetResultsFilters();
    setExpandedIds([]);
  }, [currentReviewId, resetResultsFilters, reviewId, setCurrentReviewId]);

  useEffect(() => {
    if (!reviewId || session) {
      return;
    }

    reviewSessionService
      .getReviewById(reviewId)
      .then((review) => {
        if (review) {
          upsertSession(review);
          setCurrentRole(review.stakeholderRole);
        }
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "Failed to load the selected review session.");
      });
  }, [reviewId, session, setCurrentRole, upsertSession]);

  useEffect(() => {
    if (!reviewId || result) {
      return;
    }

    reviewRunService
      .getReviewResult(reviewId)
      .then((reviewResult) => {
        if (reviewResult) {
          setResult(reviewResult);
        }
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "Failed to load the review result.");
      });
  }, [result, reviewId, setResult]);

  const handleRoleChange = async (role: StakeholderRole) => {
    if (role === currentRole && session?.stakeholderRole === role) {
      return;
    }

    setCurrentRole(role);
    if (!session) {
      return;
    }
    const optimistic: ReviewSession = {
      ...session,
      stakeholderRole: role,
    };
    upsertSession(optimistic);
    const persisted = await reviewSessionService.updateReviewSession(reviewId, { stakeholderRole: role });
    upsertSession(persisted);
  };

  const filteredFindings = useMemo(() => {
    if (!result) {
      return [];
    }
    return filterAndSortFindings(result.findings, resultsFilters);
  }, [result, resultsFilters]);

  const fileOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (result?.findings ?? [])
            .map((finding) => finding.filePath ?? "Unknown file")
            .filter((value) => value.length > 0),
        ),
      ),
    [result],
  );

  const agents = useMemo(() => {
    const ids = Array.from(new Set((result?.findings ?? []).map((finding) => finding.agentId)));
    return ids.map((id) => ({
      id,
      name: agentDefinitions.find((agent) => agent.id === id)?.name ?? `${id} agent`,
    }));
  }, [result]);

  if (!reviewId) {
    return (
      <AppShell withSidebar>
        <div className="mx-auto max-w-[1400px]">
          <EmptyState
            icon={<AlertTriangle className="size-6" />}
            title="No result selected"
            description="Open a review from the workspace or history page to inspect the coaching dashboard."
          />
        </div>
      </AppShell>
    );
  }

  if (!session || !result) {
    return (
      <AppShell withSidebar>
        <div className="mx-auto max-w-[1400px] space-y-6">
          {error ? (
            <Panel className="border border-error/30 bg-error/10 text-error">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                <div>
                  <div className="font-medium">Results issue</div>
                  <div className="mt-1 text-sm leading-6 text-red-100">{error}</div>
                </div>
              </div>
            </Panel>
          ) : null}
          <LoadingState title="Loading coaching results" />
        </div>
      </AppShell>
    );
  }

  const summary = getRoleBasedExecutiveSummary(result, currentRole);

  return (
    <AppShell withSidebar>
      <div className="mx-auto max-w-[1400px] space-y-8">
        {error ? (
          <Panel className="border border-error/30 bg-error/10 text-error">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0" />
              <div>
                <div className="font-medium">Results issue</div>
                <div className="mt-1 text-sm leading-6 text-red-100">{error}</div>
              </div>
            </div>
          </Panel>
        ) : null}

        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary">Analysis complete</div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
              {session.title}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-on-surface-variant">{session.description}</p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap xl:items-end xl:justify-end">
            <StakeholderRoleSelect value={currentRole} onChange={(role) => void handleRoleChange(role)} />
            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="size-4" />
                Export
              </Button>
              <Button variant="outline">
                <Share2 className="size-4" />
                Share
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-on-surface-variant">
            Status: {session.status}
          </span>
          <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-primary">
            {result.releaseRecommendation}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-on-surface-variant">
            Language: {session.language}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-on-surface-variant">
            Overall risk: {result.overallRisk}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-on-surface-variant">
            Review mode: {result.mode}
          </span>
          {result.metrics.condition ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-on-surface-variant">
              Analytics condition: {result.metrics.condition}
            </span>
          ) : null}
        </div>

        <ReviewMetricsGrid result={result} />

        <section className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <ExecutiveSummaryCard role={currentRole} summary={summary} />
          </div>
          <div className="grid gap-6 xl:col-span-5">
            <SeverityOverview counts={result.severityCounts} />
            <RecommendationPanel result={result} role={currentRole} />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-7">
            <CoachingSummaryPanel result={result} role={currentRole} />
            <RoleAwareSummaryPanel result={result} role={currentRole} />
          </div>
          <div className="grid gap-6 xl:col-span-5">
            <FollowUpChatPanel result={result} role={currentRole} />
          </div>
        </section>

        <section className="space-y-6">
          <AgentFilterBar
            filters={resultsFilters}
            agents={agents}
            fileOptions={fileOptions}
            onFiltersChange={setResultsFilters}
            onReset={resetResultsFilters}
          />
          <FindingsList
            findings={filteredFindings}
            role={currentRole}
            developerComments={result.developerComments}
            expandedIds={expandedIds}
            onToggle={(findingId) =>
              setExpandedIds((current) =>
                current.includes(findingId) ? current.filter((id) => id !== findingId) : [...current, findingId],
              )
            }
            onExpandAll={() => setExpandedIds(filteredFindings.map((finding) => finding.id))}
            onCollapseAll={() => setExpandedIds([])}
          />
        </section>
      </div>
    </AppShell>
  );
}
