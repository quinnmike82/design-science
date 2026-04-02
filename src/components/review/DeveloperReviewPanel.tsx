import { useMemo, useState } from "react";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { Panel } from "@/components/common/Panel";
import { Select } from "@/components/common/Select";
import { DeveloperComment, FindingSeverity, SnippetDetail } from "@/types/review";
import { formatLineRange } from "@/utils/format";

interface DeveloperReviewPanelProps {
  snippet?: SnippetDetail;
  comments: DeveloperComment[];
  onAddComment: (comment: Omit<DeveloperComment, "id" | "createdAt">) => void;
  onRemoveComment: (commentId: string) => void;
}

const severityOptions: Array<FindingSeverity | "unknown"> = ["unknown", "critical", "high", "medium", "low"];

function buildFilePath(snippet?: SnippetDetail) {
  if (!snippet) {
    return "snippets/unknown.py";
  }

  const extension = snippet.language.toLowerCase() === "python" ? "py" : "txt";
  return `snippets/${snippet.id}.${extension}`;
}

export function DeveloperReviewPanel({ snippet, comments, onAddComment, onRemoveComment }: DeveloperReviewPanelProps) {
  const [selectionStart, setSelectionStart] = useState<number | undefined>();
  const [selectionEnd, setSelectionEnd] = useState<number | undefined>();
  const [isRangeSelecting, setIsRangeSelecting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severityGuess, setSeverityGuess] = useState<FindingSeverity | "unknown">("unknown");

  const lines = useMemo(() => snippet?.code.split("\n") ?? [], [snippet]);
  const selectedRange = useMemo(() => {
    if (!selectionStart) {
      return null;
    }

    const end = selectionEnd ?? selectionStart;
    return {
      start: Math.min(selectionStart, end),
      end: Math.max(selectionStart, end),
    };
  }, [selectionEnd, selectionStart]);
  const canSubmit = Boolean(snippet && title.trim() && description.trim() && selectedRange);
  const filePath = buildFilePath(snippet);

  const clearSelection = () => {
    setSelectionStart(undefined);
    setSelectionEnd(undefined);
    setIsRangeSelecting(false);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSeverityGuess("unknown");
    clearSelection();
  };

  const handleSelectLine = (lineNumber: number) => {
    if (!selectionStart || !isRangeSelecting) {
      setSelectionStart(lineNumber);
      setSelectionEnd(lineNumber);
      setIsRangeSelecting(true);
      return;
    }

    setSelectionEnd(lineNumber);
    setIsRangeSelecting(false);
  };

  const handlePreviewLine = (lineNumber: number) => {
    if (!selectionStart || !isRangeSelecting) {
      return;
    }

    setSelectionEnd(lineNumber);
  };

  const handleAddComment = () => {
    if (!canSubmit || !selectedRange) {
      return;
    }

    onAddComment({
      title: title.trim(),
      description: description.trim(),
      filePath,
      lineStart: selectedRange.start,
      lineEnd: selectedRange.end,
      severityGuess,
    });
    resetForm();
  };

  return (
    <Panel className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
            Phase 1 · Step 3
          </div>
          <h2 className="font-display text-2xl font-semibold text-on-surface">Comment on lines before AI feedback</h2>
          <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
            Click a line or its number to start your review comment, hover to preview a multi-line range, then click
            again to lock it. Your selected span is what gets scored and compared against the AI coaching output.
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-on-surface-variant">
          {comments.length} comment{comments.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/35">
          <div className="flex items-center justify-between border-b border-white/10 bg-surface-low/95 px-5 py-3">
            <div>
              <div className="text-sm font-medium text-on-surface">{snippet?.id ?? "Loading snippet..."}</div>
              <div className="mt-1 text-xs text-on-surface-variant">
                Click to start a selection, hover across more lines to preview the range, then click again to lock it.
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedRange ? (
                <div className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs text-primary">
                  {isRangeSelecting ? "Previewing" : "Selected"} lines {formatLineRange(selectedRange.start, selectedRange.end)}
                </div>
              ) : null}
              {selectedRange ? (
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
          <div className="max-h-[520px] overflow-auto px-5 py-4 font-mono text-[13px] leading-7 text-on-surface scrollbar-thin">
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              const isSelected = selectedRange
                ? lineNumber >= selectedRange.start && lineNumber <= selectedRange.end
                : false;
              const isBoundary = selectedRange
                ? lineNumber === selectedRange.start || lineNumber === selectedRange.end
                : false;

              return (
                <div
                  key={`${snippet?.id ?? "snippet"}-${lineNumber}`}
                  className={`grid grid-cols-[44px_1fr] gap-3 rounded-xl px-2 ${
                    isSelected ? "bg-primary/10" : "hover:bg-white/5"
                  }`}
                >
                  <button
                    type="button"
                    aria-label={`Select line ${lineNumber}`}
                    className={`select-none py-0.5 text-right text-xs ${
                      isSelected ? "text-primary" : "text-outline hover:text-on-surface"
                    } ${isBoundary ? "font-semibold" : ""}`}
                    onClick={() => handleSelectLine(lineNumber)}
                    onMouseEnter={() => handlePreviewLine(lineNumber)}
                  >
                    {lineNumber}
                  </button>
                  <button
                    type="button"
                    aria-label={`Anchor line ${lineNumber} from code`}
                    className="w-full rounded px-1 py-0.5 text-left hover:bg-white/5"
                    onClick={() => handleSelectLine(lineNumber)}
                    onMouseEnter={() => handlePreviewLine(lineNumber)}
                  >
                    <span className="whitespace-pre-wrap break-words py-0.5 text-on-surface">{line || " "}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                Add comment
              </div>
              <h3 className="font-display text-xl font-semibold text-on-surface">Structured developer finding</h3>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-on-surface">
                {selectedRange
                  ? `Anchored to ${filePath}:${formatLineRange(selectedRange.start, selectedRange.end)}`
                  : "Select one or more lines in the snippet viewer."}
              </div>
              <input
                className="h-11 w-full rounded-xl border border-white/10 bg-surface/90 px-4 text-sm text-on-surface focus:border-primary/60"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Issue title"
              />
              <textarea
                className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-surface/90 px-4 py-3 text-sm leading-6 text-on-surface focus:border-primary/60"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Why do you think this is a problem? Add your reasoning before AI feedback."
              />
              <Select
                label="Severity Guess"
                value={severityGuess}
                onChange={(event) => setSeverityGuess(event.target.value as FindingSeverity | "unknown")}
              >
                {severityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "unknown" ? "No guess" : option}
                  </option>
                ))}
              </Select>
              <Button className="w-full justify-center" disabled={!canSubmit} onClick={handleAddComment}>
                <MessageSquarePlus className="size-4" />
                Add Review Comment
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                Your review
              </div>
              <h3 className="font-display text-xl font-semibold text-on-surface">Comments queued for submission</h3>
            </div>
            {comments.length === 0 ? (
              <EmptyState
                icon={<MessageSquarePlus className="size-6" />}
                title="No developer comments yet"
                description="Select one or more lines in the code viewer and add your first structured review finding."
              />
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="font-medium text-on-surface">{comment.title}</div>
                        <div className="text-xs text-on-surface-variant">
                          {comment.filePath}
                          {comment.lineStart ? `:${formatLineRange(comment.lineStart, comment.lineEnd)}` : ""}
                          {comment.severityGuess && comment.severityGuess !== "unknown"
                            ? ` · ${comment.severityGuess}`
                            : ""}
                        </div>
                        <p className="text-sm leading-6 text-on-surface-variant">{comment.description}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => onRemoveComment(comment.id)}>
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
