import { Button } from "@/components/common/Button";
import { Panel } from "@/components/common/Panel";
import { Select } from "@/components/common/Select";
import type { ReviewReviewerProfile } from "@/models/review.types";
import { cn } from "@/utils/cn";

interface ReviewerProfileModalProps {
  open: boolean;
  loading?: boolean;
  profile?: ReviewReviewerProfile;
  onClose: () => void;
  onChange: (input: Partial<ReviewReviewerProfile>) => void;
}

const roleOptions: Array<{ value: ReviewReviewerProfile["currentRole"]; label: string }> = [
  { value: "student", label: "Student" },
  { value: "junior_developer", label: "Junior Developer (0–2 years)" },
  { value: "mid_level_developer", label: "Mid-level Developer (2–5 years)" },
  { value: "senior_developer", label: "Senior Developer (5+ years)" },
  { value: "tech_lead_manager", label: "Tech Lead / Manager" },
  { value: "other", label: "Other" },
];

const programmingExperienceOptions: Array<{ value: ReviewReviewerProfile["programmingExperience"]; label: string }> = [
  { value: "less_than_1_year", label: "Less than 1 year" },
  { value: "1_3_years", label: "1–3 years" },
  { value: "3_5_years", label: "3–5 years" },
  { value: "more_than_5_years", label: "More than 5 years" },
];

const reviewFrequencyOptions: Array<{ value: ReviewReviewerProfile["reviewFrequency"]; label: string }> = [
  { value: "rarely", label: "Rarely" },
  { value: "occasionally", label: "Occasionally" },
  { value: "frequently", label: "Frequently" },
];

const aiToolUsageOptions: Array<{ value: ReviewReviewerProfile["aiToolUsageFrequency"]; label: string }> = [
  { value: "rarely", label: "Rarely" },
  { value: "sometimes", label: "Sometimes" },
  { value: "frequently", label: "Frequently" },
];

function RatingQuestion({
  title,
  helper,
  value,
  onChange,
}: {
  title: string;
  helper: string;
  value?: 1 | 2 | 3;
  onChange: (value: 1 | 2 | 3) => void;
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
            onClick={() => onChange(option as 1 | 2 | 3)}
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

export function ReviewerProfileModal({
  open,
  loading,
  profile,
  onClose,
  onChange,
}: ReviewerProfileModalProps) {
  if (!open || !profile) {
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
            Section 1 · Participant Background
          </div>
          <h3 className="font-display text-3xl font-semibold text-on-surface">Participant Background While The Review Runs</h3>
          <p className="text-sm leading-6 text-on-surface-variant">
            This section captures reviewer background while the agent is working. The answers are saved locally as you fill them in.
          </p>
        </div>

        <div
          className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
            loading
              ? "border-secondary/20 bg-secondary/10 text-on-surface"
              : "border-white/10 bg-black/20 text-on-surface-variant"
          }`}
        >
          {loading
            ? "The API review is running now. You can complete the participant background questions while waiting for the response."
            : "The review request has finished. You can reopen this section anytime from the phase header if you want to update the stored background data."}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Select
            label="Q1. What is your current role?"
            value={profile.currentRole}
            onChange={(event) =>
              onChange({ currentRole: event.target.value as ReviewReviewerProfile["currentRole"] })
            }
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            label="Q2. How many years of programming experience do you have?"
            value={profile.programmingExperience}
            onChange={(event) =>
              onChange({
                programmingExperience: event.target.value as ReviewReviewerProfile["programmingExperience"],
              })
            }
          >
            {programmingExperienceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <RatingQuestion
          title="Q3. How familiar are you with code review processes?"
          helper="1 = Not familiar, 2 = Moderate familiarity, 3 = Very familiar"
          value={profile.codeReviewFamiliarityScore}
          onChange={(value) => onChange({ codeReviewFamiliarityScore: value })}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Select
            label="Q4. How often do you perform or receive code reviews?"
            value={profile.reviewFrequency}
            onChange={(event) =>
              onChange({ reviewFrequency: event.target.value as ReviewReviewerProfile["reviewFrequency"] })
            }
          >
            {reviewFrequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            label="Q5. How often do you use AI tools (e.g., ChatGPT, GitHub Copilot) for coding?"
            value={profile.aiToolUsageFrequency}
            onChange={(event) =>
              onChange({
                aiToolUsageFrequency: event.target.value as ReviewReviewerProfile["aiToolUsageFrequency"],
              })
            }
          >
            {aiToolUsageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            {loading ? "Continue in Background" : "Done"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
