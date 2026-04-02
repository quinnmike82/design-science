import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { Panel } from "@/components/common/Panel";
import { Select } from "@/components/common/Select";
import type {
  ReviewSurvey,
  SurveyFormValues,
  SurveyReviewApproach,
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
    "feedbackClarityScore" | "issueRelevanceScore" | "feedbackUsefulnessScore" | "trustScore" | "overallSatisfactionScore"
  >;
  title: string;
  helper: string;
}

type SurveyDraft = Partial<SurveyFormValues>;

function getModeLabel(reviewMode?: "mono" | "multiple_agent") {
  return reviewMode === "multiple_agent"
    ? "Role-specialized AI reviewers (multi-agent)"
    : "Monolithic LLM reviewer";
}

function buildDefaultSurvey(reviewMode?: "mono" | "multiple_agent"): SurveyDraft {
  return {
    reviewApproachUsed: reviewMode ?? "mono",
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

  const questions = useMemo<SurveyQuestionDefinition[]>(
    () => [
      {
        key: "feedbackClarityScore",
        title: "Q7. How clear and easy to understand was the code review feedback?",
        helper: "1 = Poor, 2 = Average, 3 = Good",
      },
      {
        key: "issueRelevanceScore",
        title: "Q8. How well did the system identify relevant issues in the code?",
        helper: "1 = Poor, 2 = Average, 3 = Good",
      },
      {
        key: "feedbackUsefulnessScore",
        title: "Q9. How useful was the feedback for improving or fixing the code?",
        helper: "1 = Poor, 2 = Average, 3 = Good",
      },
      {
        key: "trustScore",
        title: "Q10. How much do you trust the review results?",
        helper: "1 = Low, 2 = Average, 3 = High",
      },
      {
        key: "overallSatisfactionScore",
        title: "Q11. Overall, how satisfied are you with this code review approach?",
        helper: "1 = Not satisfied, 2 = Average, 3 = Very satisfied",
      },
    ],
    [],
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
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">
            Section 2 · Code Review Experience
          </div>
          <h3 className="font-display text-3xl font-semibold text-on-surface">Post-review Survey</h3>
          <p className="text-sm leading-6 text-on-surface-variant">
            Share feedback about the code review experience after you finish reading the result.
          </p>
        </div>

        <Select
          label="Q6. Which code review approach did you use?"
          value={draft.reviewApproachUsed ?? reviewMode ?? "mono"}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              reviewApproachUsed: event.target.value as SurveyReviewApproach,
            }))
          }
          helperText={`Defaulted from this run: ${getModeLabel(reviewMode)}`}
        >
          <option value="multiple_agent">Role-specialized AI reviewers (multi-agent)</option>
          <option value="mono">Monolithic LLM reviewer</option>
        </Select>

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

        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
            Q12. What did you like or dislike about this code review approach?
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
            placeholder="Optional feedback about what worked well or what felt weak."
          />
        </label>

        {error ? <div className="text-sm text-error">{error}</div> : null}

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={() => {
              const allAnswered =
                Boolean(draft.reviewApproachUsed) &&
                questions.every((question) => Boolean(draft[question.key]));
              if (!allAnswered) {
                setError("Please answer all survey questions before submitting.");
                return;
              }

              void onSubmit({
                reviewApproachUsed: draft.reviewApproachUsed!,
                feedbackClarityScore: draft.feedbackClarityScore!,
                issueRelevanceScore: draft.issueRelevanceScore!,
                feedbackUsefulnessScore: draft.feedbackUsefulnessScore!,
                trustScore: draft.trustScore!,
                overallSatisfactionScore: draft.overallSatisfactionScore!,
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
