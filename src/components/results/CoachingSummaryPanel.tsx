import { CheckCircle2, SearchX, Target } from "lucide-react";
import { Panel } from "@/components/common/Panel";
import { ReviewResult, StakeholderRole } from "@/types/review";

interface CoachingSummaryPanelProps {
  result: ReviewResult;
  role: StakeholderRole;
}

export function CoachingSummaryPanel({ result, role }: CoachingSummaryPanelProps) {
  return (
    <Panel className="space-y-5">
      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
          Coaching summary
        </div>
        <h3 className="font-display text-2xl font-semibold text-on-surface">What the AI added to your review</h3>
        <p className="text-sm leading-7 text-on-surface-variant">{result.coaching.summary}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-on-surface">
            <CheckCircle2 className="size-4 text-secondary" />
            Already caught
          </div>
          <div className="text-2xl font-semibold text-on-surface">{result.coaching.caught.length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-on-surface">
            <SearchX className="size-4 text-tertiary" />
            Missed by developer
          </div>
          <div className="text-2xl font-semibold text-on-surface">{result.coaching.missed.length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-on-surface">
            <Target className="size-4 text-primary" />
            Reviewer notes
          </div>
          <div className="text-2xl font-semibold text-on-surface">{result.developerComments.length}</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
          Recommended next actions
        </div>
        <div className="space-y-3">
          {result.recommendedActions.map((action) => (
            <div key={action} className="rounded-2xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-on-surface">
              {action}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-on-surface-variant">
        Current role: {role}. Expanded finding panels below adapt their detail blocks without duplicating the
        underlying result data.
      </div>
    </Panel>
  );
}
