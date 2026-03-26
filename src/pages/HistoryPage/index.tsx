import { useEffect, useMemo } from "react";
import { ArrowRight, Clock3, FolderGit2 } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/common/Button";
import { LoadingState } from "@/components/common/LoadingState";
import { Panel } from "@/components/common/Panel";
import { reviewRunService } from "@/services/mock/reviewRunService";
import { reviewSessionService } from "@/services/mock/reviewSessionService";
import { useReviewStore } from "@/store/useReviewStore";
import { formatDate } from "@/utils/format";

export function HistoryPage() {
  const { sessions, results, isBootstrapped, setSessions, setResult, setCurrentReviewId } = useReviewStore((state) => ({
    sessions: state.sessions,
    results: state.results,
    isBootstrapped: state.isBootstrapped,
    setSessions: state.setSessions,
    setResult: state.setResult,
    setCurrentReviewId: state.setCurrentReviewId,
  }));

  useEffect(() => {
    reviewSessionService.listReviews().then((reviews) => {
      setSessions(reviews);
    });
  }, [setSessions]);

  useEffect(() => {
    const reviewIds = Object.keys(sessions);
    if (!reviewIds.length) {
      return;
    }
    Promise.all(reviewIds.map((reviewId) => reviewRunService.getReviewResult(reviewId))).then((items) => {
      items.filter(Boolean).forEach((item) => {
        if (item) {
          setResult(item);
        }
      });
    });
  }, [sessions, setResult]);

  const orderedSessions = useMemo(
    () =>
      Object.values(sessions).sort((left, right) => (left.createdAt < right.createdAt ? 1 : -1)),
    [sessions],
  );

  if (!isBootstrapped && orderedSessions.length === 0) {
    return (
      <AppShell withSidebar>
        <div className="mx-auto max-w-[1400px]">
          <LoadingState title="Loading review history" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell withSidebar>
      <div className="mx-auto max-w-[1400px] space-y-8">
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary">Review history</div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface">Previous synthetic review sessions</h1>
          <p className="max-w-3xl text-sm leading-7 text-on-surface-variant">
            Inspect the seeded mock sessions, their current status, and the risk posture captured by the review result
            model. This page is intentionally structured like a future API-backed review index.
          </p>
        </div>

        <div className="space-y-4">
          {orderedSessions.map((session) => {
            const result = results[session.id];
            return (
              <Panel key={session.id} className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="grid gap-4 xl:flex-1 xl:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,0.55fr))] xl:items-center">
                  <div className="space-y-2">
                    <div className="font-display text-2xl font-semibold text-on-surface">{session.title}</div>
                    <p className="text-sm leading-6 text-on-surface-variant">{session.description}</p>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Status</div>
                    <div className="mt-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-on-surface">
                      {session.status}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Created</div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-on-surface">
                      <Clock3 className="size-4 text-secondary" />
                      {formatDate(session.createdAt)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Project</div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-on-surface">
                      <FolderGit2 className="size-4 text-primary" />
                      {session.projectType}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Risk</div>
                    <div className="mt-2 text-sm text-on-surface">{result?.overallRisk ?? "Pending result"}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 xl:shrink-0">
                  <Button asChild variant="outline">
                    <Link to="/workspace" onClick={() => setCurrentReviewId(session.id)}>
                      Open workspace
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link to={`/results/${session.id}`} onClick={() => setCurrentReviewId(session.id)}>
                      Open results
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </Panel>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
