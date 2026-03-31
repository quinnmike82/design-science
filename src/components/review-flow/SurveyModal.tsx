import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { Panel } from "@/components/common/Panel";
import { Select } from "@/components/common/Select";
import type {
  ReviewSurvey,
  SurveyFormValues,
  SurveyPreferredMode,
  SurveyScore,
} from "@/models/survey.types";
import { cn } from "@/utils/cn";

interface SurveyModalProps {
  open: boolean;
  loading?: boolean;
  reviewMode?: "mono" | "multiple_agent";
  initialSurvey?: ReviewSurvey;
  onClose: () => void;
  onSubmit: (values: SurveyFormValues) => Promise<void> | void;
}

interface SurveyQuestionDefinition {
  key: keyof Pick<
    SurveyFormValues,
    "findingsQualityScore" | "modeFitScore" | "codeReviewClarityScore" | "trustScore"
  >;
  title: string;
  helper: string;
}

type SurveyDraft = Partial<SurveyFormValues>;

const ratingLabels: Record<SurveyScore, string> = {
  1: "Low",
  2: "Okay",
  3: "High",
};

function getModeLabel(reviewMode?: "mono" | "multiple_agent") {
  return reviewMode === "multiple_agent" ? "Multiple Agent" : "Mono";
}

function getAlternateMode(reviewMode?: "mono" | "multiple_agent"): SurveyPreferredMode {
  return reviewMode === "multiple_agent" ? "mono" : "multiple_agent";
}

function buildDefaultSurvey(reviewMode?: "mono" | "multiple_agent"): SurveyDraft {
  return {
    preferredMode: reviewMode,
    comment: "",
  };
}

function RatingQuestion({
  title,
  helper,
  value,
  onChange,
}: {
  title: string;
  helper: string;
  value?: SurveyScore;
  onChange: (value: SurveyScore) => void;
}) {
  return (
    <div role="group" aria-label={title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="space-y-1">
        <div className="font-medium text-on-surface">{title}</div>
        <div className="text-xs leading-5 text-on-surface-variant">{helper}</div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {[1, 2, 3].map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option as SurveyScore)}
            className={cn(
              "rounded-2xl border px-4 py-4 text-left transition-all",
              value === option
                ? "border-primary/40 bg-primary/10 shadow-glow"
                : "border-white/10 bg-surface-low/80 hover:border-white/20",
            )}
          >
            <div className="text-lg font-semibold text-on-surface">{option}</div>
            <div className="mt-1 text-xs text-on-surface-variant">{ratingLabels[option as SurveyScore]}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SurveyModal({
  open,
  loading,
  reviewMode,
  initialSurvey,
  onClose,
  onSubmit,
}: SurveyModalProps) {
  const [draft, setDraft] = useState<SurveyDraft>(() => initialSurvey ?? buildDefaultSurvey(reviewMode));
  const [error, setError] = useState<string | null>(null);

  const modeLabel = getModeLabel(reviewMode);
  const alternateMode = getAlternateMode(reviewMode);
  const preferredModeOptions = useMemo<Array<{ value: SurveyPreferredMode; label: string }>>(
    () => [
      { value: reviewMode ?? "mono", label: `Prefer ${modeLabel}` },
      {
        value: alternateMode,
        label: `Prefer ${alternateMode === "multiple_agent" ? "Multiple Agent" : "Mono"}`,
      },
      { value: "no_preference", label: "No preference" },
    ],
    [alternateMode, modeLabel, reviewMode],
  );

  const questions = useMemo<SurveyQuestionDefinition[]>(
    () => [
      {
        key: "findingsQualityScore",
        title: "How useful were the review findings?",
        helper: "1 = weak, 2 = acceptable, 3 = strong",
      },
      {
        key: "modeFitScore",
        title: `How useful was the ${modeLabel} review mode for this run?`,
        helper: "1 = poor fit, 2 = acceptable fit, 3 = strong fit",
      },
      {
        key: "codeReviewClarityScore",
        title: "How clear was the file-level code review in Step 3?",
        helper: "1 = unclear, 2 = manageable, 3 = very clear",
      },
      {
        key: "trustScore",
        title: "How much did you trust the suggested changes?",
        helper: "1 = low trust, 2 = partial trust, 3 = high trust",
      },
    ],
    [modeLabel],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraft(initialSurvey ?? buildDefaultSurvey(reviewMode));
    setError(null);
  }, [initialSurvey, open, reviewMode]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 px-5 py-8 backdrop-blur-sm"
    >
      <Panel className="max-h-[90vh] w-full max-w-4xl space-y-6 overflow-y-auto">
        <div className="space-y-2">
          <h3 className="font-display text-3xl font-semibold text-on-surface">Review Survey</h3>
          <p className="text-sm leading-6 text-on-surface-variant">
            Share a little more feedback about the findings, the {modeLabel} workflow, and the file-level review
            experience.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {questions.map((question) => (
            <RatingQuestion
              key={question.key}
              title={question.title}
              helper={question.helper}
              value={draft[question.key]}
              onChange={(value) => {
                setDraft((current) => ({
                  ...current,
                  [question.key]: value,
                }));
                setError(null);
              }}
            />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
          <Select
            label="Preferred Mode Next Time"
            helperText="This helps us understand whether reviewers still prefer Mono or Multiple Agent after using the flow."
            value={draft.preferredMode ?? reviewMode ?? "mono"}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                preferredMode: event.target.value as SurveyPreferredMode,
              }))
            }
          >
            {preferredModeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
              Additional Comments
            </span>
            <textarea
              rows={5}
              value={draft.comment ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  comment: event.target.value,
                }))
              }
              className="w-full rounded-3xl border border-white/10 bg-surface-low/80 px-4 py-3 text-sm text-on-surface"
              placeholder="What worked well, what felt confusing, and what would you change?"
            />
          </label>
        </div>

        {error ? <div className="text-sm text-error">{error}</div> : null}

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={() => {
              const allAnswered = questions.every((question) => Boolean(draft[question.key]));
              if (!allAnswered) {
                setError("Please answer all survey questions before submitting.");
                return;
              }

              void onSubmit({
                findingsQualityScore: draft.findingsQualityScore!,
                modeFitScore: draft.modeFitScore!,
                codeReviewClarityScore: draft.codeReviewClarityScore!,
                trustScore: draft.trustScore!,
                preferredMode: draft.preferredMode,
                comment: draft.comment?.trim() || undefined,
              });
            }}
          >
            {loading ? "Submitting..." : "Submit Survey"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
