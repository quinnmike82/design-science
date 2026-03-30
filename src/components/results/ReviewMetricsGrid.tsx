import { Panel } from "@/components/common/Panel";
import { ReviewResult } from "@/types/review";

interface ReviewMetricsGridProps {
  result: ReviewResult;
}

function formatPercentage(value?: number) {
  return value === undefined ? "N/A" : `${value}%`;
}

export function ReviewMetricsGrid({ result }: ReviewMetricsGridProps) {
  const metrics = [
    { label: "Overall risk", value: result.overallRisk },
    { label: "Recommendation", value: result.releaseRecommendation },
    { label: "Recall score", value: formatPercentage(result.metrics.recallScore) },
    { label: "False positive rate", value: formatPercentage(result.metrics.falsePositiveRate) },
    {
      label: "Time spent",
      value: result.metrics.timeSpentSec !== undefined ? `${result.metrics.timeSpentSec}s` : "N/A",
    },
    {
      label: "Condition",
      value: result.metrics.condition ?? result.mode,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <Panel key={metric.label} className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
            {metric.label}
          </div>
          <div className="font-display text-2xl font-semibold text-on-surface">{metric.value}</div>
        </Panel>
      ))}
    </div>
  );
}
