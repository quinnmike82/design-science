import { Button } from "@/components/common/Button";
import { Panel } from "@/components/common/Panel";
import { Select } from "@/components/common/Select";
import type { ReviewReviewerProfile } from "@/models/review.types";

interface ReviewerProfileModalProps {
  open: boolean;
  loading?: boolean;
  profile?: ReviewReviewerProfile;
  onClose: () => void;
  onChange: (input: Partial<ReviewReviewerProfile>) => void;
}

const roleOptions: Array<{ value: ReviewReviewerProfile["role"]; label: string }> = [
  { value: "DEV", label: "Developer" },
  { value: "QA", label: "QA" },
  { value: "BA", label: "Business Analyst" },
  { value: "PM", label: "Project Manager" },
];

const toolOptions: Array<{ value: ReviewReviewerProfile["usualReviewTool"]; label: string }> = [
  { value: "github", label: "GitHub" },
  { value: "gitlab", label: "GitLab" },
  { value: "azure_devops", label: "Azure DevOps" },
  { value: "ide", label: "IDE tools" },
  { value: "ai_assistant", label: "AI assistant" },
  { value: "other", label: "Other" },
];

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
      <Panel className="w-full max-w-3xl space-y-6">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">
            Phase 1 · Step 6
          </div>
          <h3 className="font-display text-3xl font-semibold text-on-surface">Reviewer Profile While The Review Runs</h3>
          <p className="text-sm leading-6 text-on-surface-variant">
            Save a little reviewer context for later reporting. These answers are stored locally as you type.
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
            ? "The API review is running now. You can fill this in while the result is being prepared."
            : "The review request has finished. You can reopen this form anytime from the phase header if you want to update the stored context."}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Role"
            value={profile.role}
            onChange={(event) => onChange({ role: event.target.value as ReviewReviewerProfile["role"] })}
            helperText="Default role is Developer."
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
              Years Experience
            </span>
            <input
              type="number"
              min={0}
              value={profile.yearsOfExperience ?? ""}
              onChange={(event) =>
                onChange({
                  yearsOfExperience:
                    event.target.value.trim().length > 0 ? Math.max(0, Number(event.target.value)) : undefined,
                })
              }
              className="h-11 w-full rounded-xl border border-white/10 bg-surface/90 px-4 text-sm text-on-surface transition-colors focus:border-primary/60"
              placeholder="e.g. 5"
            />
          </label>
        </div>

        <Select
          label="Usual Review Tool"
          value={profile.usualReviewTool}
          onChange={(event) =>
            onChange({ usualReviewTool: event.target.value as ReviewReviewerProfile["usualReviewTool"] })
          }
          helperText="Pick the tool you usually rely on for code review."
        >
          {toolOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
            Why Is Code Review Important?
          </span>
          <textarea
            rows={5}
            value={profile.codeReviewImportance}
            onChange={(event) => onChange({ codeReviewImportance: event.target.value })}
            className="w-full rounded-3xl border border-white/10 bg-surface-low/80 px-4 py-3 text-sm text-on-surface"
            placeholder="Capture what matters most in code review for your team."
          />
        </label>

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            {loading ? "Continue in Background" : "Done"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
