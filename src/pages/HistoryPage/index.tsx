import { useMemo } from "react";
import { ArrowRight, Clock3, FolderGit2 } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { Panel } from "@/components/common/Panel";
import { listReviewRuns } from "@/services/review.service";
import { formatDate, formatDuration } from "@/utils/format";
import { getReviewStepMetricsSnapshot } from "@/utils/reviewTiming";

export function HistoryPage() {
  const runs = useMemo(() => listReviewRuns(), []);

  return (
    <AppShell withSidebar>
      <div className="mx-auto max-w-[1400px] space-y-8">
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary">Review history</div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface">Previous review runs</h1>
          <p className="max-w-3xl text-sm leading-7 text-on-surface-variant">
            Open a saved review run in the shared 3-step flow. History is currently persisted on the frontend so the experience stays usable while backend run indexing is still in progress.
          </p>
        </div>

        {runs.length === 0 ? (
          <EmptyState
            icon={<FolderGit2 className="size-6" />}
            title="No review history yet"
            description="Create a review run from the workspace to start building history."
          />
        ) : (
          <div className="space-y-4">
            {runs.map((run) => {
              const timingSnapshot = getReviewStepMetricsSnapshot(run.stepMetrics, run.updatedAt);

              return (
                <Panel key={run.id} className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="grid gap-4 xl:flex-1 xl:grid-cols-[minmax(0,1.3fr)_repeat(5,minmax(0,0.55fr))] xl:items-center">
                    <div className="space-y-2">
                      <div className="font-display text-2xl font-semibold text-on-surface">
                        {run.input.mainFiles[0]?.name ?? "Untitled review run"}
                      </div>
                      <p className="text-sm leading-6 text-on-surface-variant">
                        {run.result?.summaryText ?? "Draft review input. Submit the run to generate findings."}
                      </p>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Status</div>
                      <div className="mt-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-on-surface">
                        {run.status}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Updated</div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-on-surface">
                        <Clock3 className="size-4 text-secondary" />
                        {formatDate(run.updatedAt)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Time spent</div>
                      <div className="mt-2 text-sm text-on-surface">{formatDuration(timingSnapshot.totalActiveSec)}</div>
                      <div className="mt-2 space-y-1 text-xs text-on-surface-variant">
                        <div>Step 1 {formatDuration(timingSnapshot.stepTimesSec[1])}</div>
                        <div>Step 2 {formatDuration(timingSnapshot.stepTimesSec[2])}</div>
                        <div>Step 3 {formatDuration(timingSnapshot.stepTimesSec[3])}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Mode</div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-on-surface">
                        <FolderGit2 className="size-4 text-primary" />
                        {run.input.reviewMode === "multiple_agent" ? "Multiple Agent" : run.input.reviewMode === "mono" ? "Mono" : "Unselected"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Issues</div>
                      <div className="mt-2 text-sm text-on-surface">{run.result?.issues.length ?? 0}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 xl:shrink-0">
                    <Button asChild variant="outline">
                      <Link to={`/workspace?reviewId=${run.id}`}>Open workspace</Link>
                    </Button>
                    <Button asChild>
                      <Link to={`/results/${run.id}`}>
                        Open results
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </Panel>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
