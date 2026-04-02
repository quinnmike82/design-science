import { FileCode2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Panel } from "@/components/common/Panel";
import { DeveloperReviewPanel } from "@/components/review/DeveloperReviewPanel";
import { SnippetSourcePanel } from "@/components/review/SnippetSourcePanel";
import { AdditionalDocsSection } from "@/components/review-flow/AdditionalDocsSection";
import { ReviewModeCardGroup } from "@/components/review-flow/ReviewModeCardGroup";
import type { ReviewInputState, ReviewLineNote, ReviewSourceSnippetSummary } from "@/models/review.types";

interface Step1InputSectionProps {
  input?: ReviewInputState;
  snippets: ReviewSourceSnippetSummary[];
  isSnippetLoading?: boolean;
  snippetError?: string | null;
  submitting?: boolean;
  onReviewModeChange: (value: NonNullable<ReviewInputState["reviewMode"]>) => void;
  onSnippetChange: (snippetId: string) => Promise<void> | void;
  onReloadSnippets: () => Promise<void> | void;
  onAddDeveloperNote: (note: Omit<ReviewLineNote, "id" | "createdAt">) => void;
  onRemoveDeveloperNote: (noteId: string) => void;
  onSupportingFilesSelected: (files: FileList) => Promise<void> | void;
  onRemoveSupportingFile: (fileId: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: () => Promise<void> | void;
}

export function Step1InputSection({
  input,
  snippets,
  isSnippetLoading,
  snippetError,
  submitting,
  onReviewModeChange,
  onSnippetChange,
  onReloadSnippets,
  onAddDeveloperNote,
  onRemoveDeveloperNote,
  onSupportingFilesSelected,
  onRemoveSupportingFile,
  onNotesChange,
  onSubmit,
}: Step1InputSectionProps) {
  const validationErrors = {
    reviewMode: !input?.reviewMode,
    selectedSnippet: !input?.selectedSnippetId,
  };

  return (
    <div className="space-y-6">
      <Panel className="space-y-5">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">Phase 1 · Step 1</div>
          <p className="text-sm leading-6 text-on-surface-variant">
            Pick the reviewer configuration for this run. The flow keeps the rest of the experience consistent.
          </p>
        </div>
        <ReviewModeCardGroup value={input?.reviewMode} onChange={onReviewModeChange} />
        {validationErrors.reviewMode ? <div className="text-sm text-error">Review mode is required.</div> : null}
      </Panel>

      <SnippetSourcePanel
        snippets={snippets}
        selectedSnippetId={input?.selectedSnippetId ?? ""}
        selectedSnippet={input?.selectedSnippet}
        isLoading={Boolean(isSnippetLoading)}
        onSnippetChange={(snippetId) => void onSnippetChange(snippetId)}
        onReload={() => void onReloadSnippets()}
      />
      {snippetError ? <div className="text-sm text-error">{snippetError}</div> : null}
      {validationErrors.selectedSnippet ? <div className="text-sm text-error">A backend snippet is required.</div> : null}

      {/* <DeveloperReviewPanel
        snippet={input?.selectedSnippet}
        comments={input?.developerNotes ?? []}
        onAddComment={onAddDeveloperNote}
        onRemoveComment={onRemoveDeveloperNote}
      /> */}

      <AdditionalDocsSection
        files={input?.supportingFiles ?? []}
        onFilesSelected={onSupportingFilesSelected}
        onRemoveFile={onRemoveSupportingFile}
      />

      <Panel className="space-y-4">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">Phase 1 · Step 5</div>
          <p className="text-sm leading-6 text-on-surface-variant">
            Add release context, risks, or guidance that helps the reviewer interpret the submitted changes.
          </p>
        </div>
        <textarea
          value={input?.notes ?? ""}
          onChange={(event) => onNotesChange(event.target.value)}
          rows={6}
          className="w-full rounded-3xl border border-white/10 bg-surface-low/80 px-4 py-3 text-sm text-on-surface"
          placeholder="Optional context"
        />
      </Panel>

      <Panel highlighted className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
            <FileCode2 className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">Phase 1 · Step 6</div>
            <div className="font-display text-2xl font-semibold text-on-surface">Submit review input</div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Submitting moves the run into the summary phase after a successful backend response or a mock-safe fallback result.
            </p>
          </div>
        </div>
        <Button
          size="lg"
          disabled={
            submitting ||
            validationErrors.reviewMode ||
            validationErrors.selectedSnippet
          }
          onClick={() => void onSubmit()}
        >
          {submitting ? "Submitting..." : "Run Review"}
        </Button>
      </Panel>
    </div>
  );
}
