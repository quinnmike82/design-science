import { useState } from "react";
import { Bug, MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { Select } from "@/components/common/Select";
import type { ReviewPhaseFinding } from "@/models/review.types";
import { formatLineRange } from "@/utils/format";

interface FindingSelectionRange {
  start: number;
  end: number;
}

interface Phase3FindingPanelProps {
  filePath: string;
  canSelectLines: boolean;
  findings: ReviewPhaseFinding[];
  selectedRange?: FindingSelectionRange;
  onAddFinding: (finding: Omit<ReviewPhaseFinding, "id" | "createdAt" | "sourcePhase">) => void;
  onRemoveFinding: (findingId: string) => void;
  onClearSelection: () => void;
}

const severityOptions: NonNullable<ReviewPhaseFinding["severityGuess"]>[] = [
  "unknown",
  "critical",
  "high",
  "medium",
  "low",
];

export function Phase3FindingPanel({
  filePath,
  canSelectLines,
  findings,
  selectedRange,
  onAddFinding,
  onRemoveFinding,
  onClearSelection,
}: Phase3FindingPanelProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severityGuess, setSeverityGuess] = useState<NonNullable<ReviewPhaseFinding["severityGuess"]>>("unknown");

  const canSubmit = Boolean(title.trim() && description.trim() && (!canSelectLines || selectedRange));

  const clearDraft = () => {
    setTitle("");
    setDescription("");
    setSeverityGuess("unknown");
    onClearSelection();
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    onAddFinding({
      title: title.trim(),
      description: description.trim(),
      filePath,
      lineStart: selectedRange?.start,
      lineEnd: selectedRange?.end,
      severityGuess,
    });
    clearDraft();
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
          Reviewer-only bugs
        </div>
        <h4 className="font-display text-2xl font-semibold text-on-surface">Add Bugs The Agent Missed</h4>
        <p className="text-sm leading-6 text-on-surface-variant">
          Store extra bugs directly from this file review so they stay with the rest of the local feedback data.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
              Missed bug form
            </div>
            <h5 className="font-display text-xl font-semibold text-on-surface">Store an extra reviewer finding</h5>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-on-surface">
              {selectedRange
                ? `Anchored to ${filePath}:${formatLineRange(selectedRange.start, selectedRange.end)}`
                : canSelectLines
                  ? "Click anywhere on a source line in the combined file review. Shift+click a second line to capture a range."
                  : `Stored against ${filePath} without a line range.`}
            </div>
            {selectedRange ? (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={onClearSelection}>
                  Clear Selection
                </Button>
              </div>
            ) : null}
            <input
              className="h-11 w-full rounded-xl border border-white/10 bg-surface/90 px-4 text-sm text-on-surface focus:border-primary/60"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Bug title"
            />
            <textarea
              className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-surface/90 px-4 py-3 text-sm leading-6 text-on-surface focus:border-primary/60"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Why do you think this is a missed bug?"
            />
            <Select
              label="Severity Guess"
              value={severityGuess}
              onChange={(event) =>
                setSeverityGuess(event.target.value as NonNullable<ReviewPhaseFinding["severityGuess"]>)
              }
            >
              {severityOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "unknown" ? "No guess" : option}
                </option>
              ))}
            </Select>
            <Button className="w-full justify-center" disabled={!canSubmit} onClick={handleSubmit}>
              <MessageSquarePlus className="size-4" />
              Add Missed Bug
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
              Stored findings
            </div>
            <h5 className="font-display text-xl font-semibold text-on-surface">Phase 3 reviewer-only bugs</h5>
          </div>

          {findings.length === 0 ? (
            <EmptyState
              icon={<Bug className="size-6" />}
              title="No extra bugs added yet"
              description="Anything you add here is saved locally for later reporting and consolidation."
            />
          ) : (
            <div className="space-y-3">
              {findings.map((finding) => (
                <div key={finding.id} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="font-medium text-on-surface">{finding.title}</div>
                      <div className="text-xs text-on-surface-variant">
                        {finding.filePath}
                        {finding.lineStart ? `:${formatLineRange(finding.lineStart, finding.lineEnd)}` : ""}
                        {finding.severityGuess && finding.severityGuess !== "unknown"
                          ? ` - ${finding.severityGuess}`
                          : ""}
                      </div>
                      <p className="text-sm leading-6 text-on-surface-variant">{finding.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onRemoveFinding(finding.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
