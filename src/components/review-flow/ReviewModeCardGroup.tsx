import type { ReviewModeOption } from "@/models/review.types";
import { cn } from "@/utils/cn";

const modeCards: Array<{ value: ReviewModeOption; title: string; description: string }> = [
  {
    value: "mono",
    title: "Mono",
    description: "One reviewer produces a single summary of the submitted code and supporting context.",
  },
  {
    value: "multiple_agent",
    title: "Multiple Agent",
    description: "Specialized reviewers contribute findings that keep role attribution visible across the flow.",
  },
];

interface ReviewModeCardGroupProps {
  value?: ReviewModeOption;
  onChange: (value: ReviewModeOption) => void;
}

export function ReviewModeCardGroup({ value, onChange }: ReviewModeCardGroupProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {modeCards.map((mode) => {
        const selected = value === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(mode.value)}
            className={cn(
              "rounded-3xl border p-5 text-left transition-all",
              selected
                ? "border-primary/40 bg-primary/10 shadow-glow"
                : "border-white/10 bg-surface-low/70 hover:border-white/20 hover:bg-surface/80",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-display text-2xl font-semibold text-on-surface">{mode.title}</div>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{mode.description}</p>
              </div>
              <div
                className={cn(
                  "mt-1 size-4 rounded-full border",
                  selected ? "border-primary bg-primary shadow-glow" : "border-white/20 bg-transparent",
                )}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
