import { useMemo, useState } from "react";
import { Bug, MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { Panel } from "@/components/common/Panel";
import { Select } from "@/components/common/Select";
import type { ReviewPhaseFinding } from "@/models/review.types";
import { formatLineRange } from "@/utils/format";

interface Phase3FindingPanelProps {
  filePath: string;
  sourceFileContent?: string;
  findings: ReviewPhaseFinding[];
  onAddFinding: (finding: Omit<ReviewPhaseFinding, "id" | "createdAt" | "sourcePhase">) => void;
  onRemoveFinding: (findingId: string) => void;
}

const severityOptions: NonNullable<ReviewPhaseFinding["severityGuess"]>[] = [
  "unknown",
  "critical",
  "high",
  "medium",
  "low",
];

function splitLines(sourceFileContent?: string) {
  return sourceFileContent ? sourceFileContent.split(/\r?\n/) : [];
}

export function Phase3FindingPanel({
  filePath,
  sourceFileContent,
  findings,
  onAddFinding,
  onRemoveFinding,
}: Phase3FindingPanelProps) {
  const [selectionStart, setSelectionStart] = useState<number | undefined>();
  const [selectionEnd, setSelectionEnd] = useState<number | undefined>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severityGuess, setSeverityGuess] = useState<NonNullable<ReviewPhaseFinding["severityGuess"]>>("unknown");

  const lines = useMemo(() => splitLines(sourceFileContent), [sourceFileContent]);
  const selectedRange = useMemo(() => {
    if (!selectionStart) {
      return undefined;
    }

    const end = selectionEnd ?? selectionStart;
    return {
      start: Math.min(selectionStart, end),
      end: Math.max(selectionStart, end),
    };
  }, [selectionEnd, selectionStart]);
  const requiresLineSelection = lines.length > 0;
  const canSubmit = Boolean(
    title.trim() &&
      description.trim() &&
      (!requiresLineSelection || selectedRange),
  );

  const clearDraft = () => {
    setSelectionStart(undefined);
    setSelectionEnd(undefined);
    setTitle("");
    setDescription("");
    setSeverityGuess("unknown");
  };

  const handleSelectLine = (lineNumber: number, extendSelection: boolean) => {
    if (!selectionStart || !extendSelection) {
      setSelectionStart(lineNumber);
      setSelectionEnd(lineNumber);
      return;
    }

    setSelectionEnd(lineNumber);
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
    <Panel className="space-y-5">
      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">
          Phase 3 · Step 4
        </div>
        <h3 className="font-display text-2xl font-semibold text-on-surface">Add Bugs The Agent Missed</h3>
        <p className="text-sm leading-6 text-on-surface-variant">
          Capture extra bugs you spotted during the phase 3 review so they stay in local storage with the rest of the feedback set.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.95fr]">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
          <div className="border-b border-white/10 bg-surface-low/95 px-5 py-3">
            <div className="text-sm font-medium text-on-surface">{filePath}</div>
            <div className="mt-1 text-xs text-on-surface-variant">
              {requiresLineSelection
                ? "Click a line number to anchor the missed bug. Shift+click a second line to capture a range."
                : "Source lines are unavailable for this file, so the missed bug will be stored without a line range."}
            </div>
          </div>

          {requiresLineSelection ? (
            <div className="max-h-[360px] overflow-auto px-5 py-4 font-mono text-[13px] leading-7 text-on-surface scrollbar-thin">
              {lines.map((line, index) => {
                const lineNumber = index + 1;
                const isSelected = selectedRange
                  ? lineNumber >= selectedRange.start && lineNumber <= selectedRange.end
                  : false;

                return (
                  <div
                    key={`${filePath}-${lineNumber}`}
                    className={`grid grid-cols-[44px_1fr] gap-3 rounded-xl px-2 ${
                      isSelected ? "bg-primary/10" : "hover:bg-white/5"
                    }`}
                  >
                    <button
                      type="button"
                      aria-label={`Select phase 3 line ${lineNumber}`}
                      className={`select-none py-0.5 text-right text-xs ${
                        isSelected ? "text-primary" : "text-outline hover:text-on-surface"
                      }`}
                      onClick={(event) => handleSelectLine(lineNumber, event.shiftKey)}
                    >
                      {lineNumber}
                    </button>
                    <span className="whitespace-pre-wrap break-words py-0.5 text-on-surface">{line || " "}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-6 text-sm leading-6 text-on-surface-variant">
              The backend did not provide the full source content for this file.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                Missed bug form
              </div>
              <h4 className="font-display text-xl font-semibold text-on-surface">Store an extra reviewer finding</h4>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-on-surface">
                {selectedRange
                  ? `Anchored to ${filePath}:${formatLineRange(selectedRange.start, selectedRange.end)}`
                  : requiresLineSelection
                    ? "Select one or more lines in the code viewer."
                    : `Stored against ${filePath} without a line range.`}
              </div>
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
              <h4 className="font-display text-xl font-semibold text-on-surface">Phase 3 reviewer-only bugs</h4>
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
                            ? ` · ${finding.severityGuess}`
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
    </Panel>
  );
}
