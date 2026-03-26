import { useEffect, useMemo } from "react";
import { Download, Share2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import { LoadingState } from "@/components/common/LoadingState";
import { ExecutiveSummaryCard } from "@/components/results/ExecutiveSummaryCard";
import { SeverityOverview } from "@/components/results/SeverityOverview";
import { RecommendationPanel } from "@/components/results/RecommendationPanel";
import { RoleAwareSummaryPanel } from "@/components/results/RoleAwareSummaryPanel";
import { AgentFilterBar } from "@/components/results/AgentFilterBar";
import { FindingsList } from "@/components/results/FindingsList";
import { FindingDetailDrawer } from "@/components/results/FindingDetailDrawer";
import { FollowUpChatPanel } from "@/components/results/FollowUpChatPanel";
import { StakeholderRoleSelect } from "@/components/review/StakeholderRoleSelect";
import { filterAndSortFindings } from "@/features/review-results/filters";
import { getRoleBasedExecutiveSummary } from "@/features/review-results/presenters";
import { reviewRunService } from "@/services/mock/reviewRunService";
import { reviewSessionService } from "@/services/mock/reviewSessionService";
import { getSelectedFinding, useReviewStore } from "@/store/useReviewStore";
import { ReviewSession, StakeholderRole } from "@/types/review";

export function ResultsPage() {
  const params = useParams<{ reviewId: string }>();
  const reviewId = params.reviewId ?? "rev-synth-001";
  const {
    sessions,
    results,
    currentRole,
    resultsFilters,
    selectedFindingId,
    setCurrentReviewId,
    setCurrentRole,
    upsertSession,
    setResult,
    setSelectedFinding,
    setResultsFilters,
    resetResultsFilters,
  } = useReviewStore((state) => ({
    sessions: state.sessions,
    results: state.results,
    currentRole: state.currentRole,
    resultsFilters: state.resultsFilters,
    selectedFindingId: state.selectedFindingId,
    setCurrentReviewId: state.setCurrentReviewId,
    setCurrentRole: state.setCurrentRole,
    upsertSession: state.upsertSession,
    setResult: state.setResult,
    setSelectedFinding: state.setSelectedFinding,
    setResultsFilters: state.setResultsFilters,
    resetResultsFilters: state.resetResultsFilters,
  }));

  const session = sessions[reviewId];
  const result = results[reviewId];

  useEffect(() => {
    setCurrentReviewId(reviewId);
    resetResultsFilters();
  }, [resetResultsFilters, reviewId, setCurrentReviewId]);

  useEffect(() => {
    if (!session) {
      reviewSessionService.getReviewById(reviewId).then((review) => {
        if (review) {
          upsertSession(review);
          setCurrentRole(review.stakeholderRole);
        }
      });
    }
  }, [reviewId, session, setCurrentRole, upsertSession]);

  useEffect(() => {
    if (!result) {
      reviewRunService.getReviewResult(reviewId).then((reviewResult) => {
        if (reviewResult) {
          setResult(reviewResult);
        }
      });
    }
  }, [result, reviewId, setResult]);

  const handleRoleChange = async (role: StakeholderRole) => {
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

  const selectedFinding = useMemo(
    () => (result ? getSelectedFinding(result.findings, selectedFindingId) : null),
    [result, selectedFindingId],
  );

  if (!session || !result) {
    return (
      <AppShell withSidebar>
        <div className="mx-auto max-w-[1400px]">
          <LoadingState />
        </div>
      </AppShell>
    );
  }

  const summary = getRoleBasedExecutiveSummary(result, currentRole);

  return (
    <AppShell withSidebar>
      <div className="mx-auto max-w-[1400px] space-y-8">
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
            Overall risk: {result.overallRisk}
          </span>
        </div>

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
          <div className="space-y-6 xl:col-span-8">
            <AgentFilterBar
              filters={resultsFilters}
              onFiltersChange={setResultsFilters}
              onReset={resetResultsFilters}
            />
            <FindingsList
              findings={filteredFindings}
              role={currentRole}
              onSelect={(findingId) => setSelectedFinding(findingId)}
            />
          </div>
          <div className="grid gap-6 xl:col-span-4">
            <RoleAwareSummaryPanel result={result} role={currentRole} />
            <FollowUpChatPanel result={result} role={currentRole} />
          </div>
        </section>
      </div>

      <FindingDetailDrawer
        finding={selectedFinding}
        role={currentRole}
        onClose={() => setSelectedFinding(null)}
      />
    </AppShell>
  );
}
