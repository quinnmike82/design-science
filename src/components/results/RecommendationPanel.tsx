import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Panel } from "@/components/common/Panel";
import { getRoleBasedRecommendation } from "@/features/review-results/presenters";
import { ReviewResult, StakeholderRole } from "@/types/review";

interface RecommendationPanelProps {
  result: ReviewResult;
  role: StakeholderRole;
}

const riskIconMap = {
  Severe: ShieldAlert,
  Elevated: AlertTriangle,
  Moderate: AlertTriangle,
  Contained: CheckCircle2,
};

export function RecommendationPanel({ result, role }: RecommendationPanelProps) {
  const Icon = riskIconMap[result.overallRisk];
  const message = getRoleBasedRecommendation(result, role);

  return (
    <Panel className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
            Release recommendation
          </div>
          <h3 className="mt-1 font-display text-xl font-semibold text-on-surface">{result.releaseRecommendation}</h3>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Risk</div>
          <div className="mt-2 text-lg font-semibold text-on-surface">{result.overallRisk}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Fix effort</div>
          <div className="mt-2 text-lg font-semibold text-on-surface">{result.estimatedFixEffort}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Findings</div>
          <div className="mt-2 text-lg font-semibold text-on-surface">{result.findings.length}</div>
        </div>
      </div>
      <p className="text-sm leading-7 text-on-surface-variant">{message}</p>
    </Panel>
  );
}
