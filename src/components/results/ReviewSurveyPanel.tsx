import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { Panel } from "@/components/common/Panel";
import { Select } from "@/components/common/Select";
import { ReviewCondition, ReviewMode, ReviewSurvey, SurveyRating } from "@/types/review";

interface ReviewSurveyPanelProps {
  mode: ReviewMode;
  survey?: ReviewSurvey;
  canSubmit: boolean;
  disabledReason?: string;
  submitting: boolean;
  onSubmit: (survey: Omit<ReviewSurvey, "submittedAt">) => Promise<void>;
}

type DraftSurvey = Omit<ReviewSurvey, "submittedAt">;

const ratingOptions: SurveyRating[] = [1, 2, 3, 4, 5];

const fieldGroups: Array<{
  title: string;
  description: string;
  fields: Array<{ key: keyof DraftSurvey; label: string; helper: string }>;
}> = [
  {
    title: "Method evaluation",
    description: "How well did the review method itself help you compare your own notes against the AI output?",
    fields: [
      { key: "methodHelpfulness", label: "Helpfulness", helper: "1 = not helpful, 5 = very helpful" },
      { key: "methodClarity", label: "Clarity", helper: "1 = confusing, 5 = very clear" },
      { key: "methodActionability", label: "Actionability", helper: "1 = vague, 5 = directly usable" },
    ],
  },
  {
    title: "Platform evaluation",
    description: "Rate the product experience around the review workflow and results presentation.",
    fields: [
      { key: "platformUsability", label: "Usability", helper: "1 = hard to use, 5 = very easy" },
      { key: "platformSpeed", label: "Perceived speed", helper: "1 = too slow, 5 = very responsive" },
      { key: "platformDesign", label: "Design quality", helper: "1 = rough, 5 = polished" },
    ],
  },
  {
    title: "Workload and trust",
    description: "Capture trust in the system and a lightweight NASA-TLX style workload readout.",
    fields: [
      { key: "trustScore", label: "Trust in the result", helper: "1 = low trust, 5 = high trust" },
      { key: "tlxMental", label: "Mental demand", helper: "1 = low demand, 5 = high demand" },
      { key: "tlxEffort", label: "Effort", helper: "1 = low effort, 5 = high effort" },
      { key: "tlxFrustration", label: "Frustration", helper: "1 = calm, 5 = frustrated" },
      { key: "tlxTemporal", label: "Time pressure", helper: "1 = low pressure, 5 = high pressure" },
      { key: "tlxPerformance", label: "Self-rated performance", helper: "1 = poor, 5 = strong" },
      { key: "tlxPhysical", label: "Physical demand", helper: "1 = none, 5 = very high" },
    ],
  },
];

function createDefaultSurvey(mode: ReviewMode): DraftSurvey {
  return {
    tlxMental: 3,
    tlxPhysical: 1,
    tlxTemporal: 3,
    tlxPerformance: 3,
    tlxEffort: 3,
    tlxFrustration: 2,
    trustScore: 3,
    methodHelpfulness: 3,
    methodClarity: 3,
    methodActionability: 3,
    platformUsability: 3,
    platformSpeed: 3,
    platformDesign: 3,
    preferredMode: mode,
    feedbackComment: "",
  };
}

function formatSubmittedAt(timestamp: string) {
  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? "Saved" : `Saved ${parsed.toLocaleString()}`;
}

interface RatingFieldProps {
  label: string;
  helper: string;
  value: SurveyRating;
  onChange: (value: SurveyRating) => void;
}

function RatingField({ label, helper, value, onChange }: RatingFieldProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="space-y-1">
        <div className="font-medium text-on-surface">{label}</div>
        <div className="text-xs leading-5 text-on-surface-variant">{helper}</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {ratingOptions.map((rating) => {
          const isSelected = rating === value;
          return (
            <button
              key={rating}
              type="button"
              className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition-colors ${
                isSelected
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-white/10 bg-white/5 text-on-surface-variant hover:border-white/20 hover:text-on-surface"
              }`}
              onClick={() => onChange(rating)}
            >
              {rating}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewSurveyPanel({ mode, survey, canSubmit, disabledReason, submitting, onSubmit }: ReviewSurveyPanelProps) {
  const [draft, setDraft] = useState<DraftSurvey>(() => survey ?? createDefaultSurvey(mode));
  const alternateMode = mode === "monolithic" ? "specialist" : "monolithic";
  const preferredModeOptions = useMemo<Array<{ value: DraftSurvey["preferredMode"]; label: string }>>(
    () => [
      { value: mode, label: mode === "monolithic" ? "Prefer the monolithic baseline" : "Prefer the specialist method" },
      {
        value: alternateMode,
        label: alternateMode === "monolithic" ? "Prefer the monolithic baseline" : "Prefer the specialist method",
      },
      { value: "no_preference", label: "No preference" },
    ],
    [alternateMode, mode],
  );

  useEffect(() => {
    setDraft(survey ?? createDefaultSurvey(mode));
  }, [mode, survey]);

  return (
    <Panel className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
            Post-review survey
          </div>
          <h3 className="font-display text-2xl font-semibold text-on-surface">Evaluate the method and the platform</h3>
          <p className="max-w-3xl text-sm leading-7 text-on-surface-variant">
            This short survey helps us separate the quality of the review method from the quality of the interface.
          </p>
        </div>
        {survey ? (
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-on-surface-variant">
            {formatSubmittedAt(survey.submittedAt)}
          </div>
        ) : null}
      </div>

      {fieldGroups.map((group) => (
        <section key={group.title} className="space-y-4">
          <div className="space-y-1">
            <h4 className="font-display text-xl font-semibold text-on-surface">{group.title}</h4>
            <p className="text-sm leading-6 text-on-surface-variant">{group.description}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {group.fields.map((field) => (
              <RatingField
                key={field.key}
                label={field.label}
                helper={field.helper}
                value={draft[field.key] as SurveyRating}
                onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))}
              />
            ))}
          </div>
        </section>
      ))}

      <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <Select
          label="Preferred method"
          helperText="Choose the approach you would rather use after seeing this review result."
          value={draft.preferredMode ?? "no_preference"}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              preferredMode: event.target.value as ReviewCondition | "no_preference",
            }))
          }
        >
          {preferredModeOptions.map((option) => (
            <option key={option.value ?? "no_preference"} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
            Additional comments
          </span>
          <textarea
            className="min-h-[132px] w-full rounded-2xl border border-white/10 bg-surface/90 px-4 py-3 text-sm leading-6 text-on-surface focus:border-primary/60"
            value={draft.feedbackComment ?? ""}
            onChange={(event) => setDraft((current) => ({ ...current, feedbackComment: event.target.value }))}
            placeholder="What worked well, what felt confusing, and what would you change?"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm leading-6 text-on-surface-variant">
          {canSubmit
            ? "You can submit once and update it later if your opinion changes."
            : disabledReason ?? "A completed review session is required before feedback can be recorded."}
        </div>
        <Button disabled={!canSubmit || submitting} onClick={() => void onSubmit(draft)}>
          {submitting ? "Saving survey..." : survey ? "Update survey" : "Submit survey"}
        </Button>
      </div>
    </Panel>
  );
}
