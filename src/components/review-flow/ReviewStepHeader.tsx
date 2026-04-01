import type { ReviewFlowStep } from "@/models/review.types";
import { formatDuration } from "@/utils/format";
import { cn } from "@/utils/cn";

const steps: Array<{ id: ReviewFlowStep; label: string; title: string }> = [
  { id: 1, label: "Step 1", title: "Input" },
  { id: 2, label: "Step 2", title: "Summary" },
  { id: 3, label: "Step 3", title: "Marker Review" },
];

interface ReviewStepHeaderProps {
  currentStep: ReviewFlowStep;
  maxAccessibleStep: ReviewFlowStep;
  stepTimesSec?: Record<ReviewFlowStep, number>;
  onStepChange: (step: ReviewFlowStep) => void;
}

export function ReviewStepHeader({ currentStep, maxAccessibleStep, stepTimesSec, onStepChange }: ReviewStepHeaderProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {steps.map((step) => {
        const isActive = currentStep === step.id;
        const isComplete = step.id < currentStep;
        const isAccessible = step.id <= maxAccessibleStep;

        return (
          <button
            key={step.id}
            type="button"
            disabled={!isAccessible}
            onClick={() => onStepChange(step.id)}
            className={cn(
              "rounded-3xl border p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45",
              isActive
                ? "border-primary/40 bg-primary/10 shadow-glow"
                : isComplete
                  ? "border-secondary/30 bg-secondary/10"
                  : "border-white/10 bg-surface-low/70 hover:border-white/20",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                  {step.label}
                </div>
                <div className="mt-2 font-display text-2xl font-semibold text-on-surface">{step.title}</div>
                <div className="mt-2 text-xs text-on-surface-variant">
                  Active time {formatDuration(stepTimesSec?.[step.id])}
                </div>
              </div>
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border text-sm font-semibold",
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : isComplete
                      ? "border-secondary/40 bg-secondary/10 text-secondary"
                      : "border-white/10 bg-white/5 text-on-surface-variant",
                )}
              >
                {step.id}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
