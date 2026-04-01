import { FileCode2, RefreshCw } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Panel } from "@/components/common/Panel";
import { Select } from "@/components/common/Select";
import { SnippetDetail, SnippetSummary } from "@/types/review";

interface SnippetSourcePanelProps {
  snippets: SnippetSummary[];
  selectedSnippetId: string;
  selectedSnippet?: SnippetDetail;
  isLoading: boolean;
  onSnippetChange: (snippetId: string) => void;
  onReload: () => void;
}

export function SnippetSourcePanel({
  snippets,
  selectedSnippetId,
  selectedSnippet,
  isLoading,
  onSnippetChange,
  onReload,
}: SnippetSourcePanelProps) {
  return (
    <Panel className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
            Phase 1 · Step 2
          </div>
          <h2 className="font-display text-2xl font-semibold text-on-surface">Server-backed review target</h2>
          <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
            The real Azure API reviews fixed backend snippets. Choose the snippet here, then use the local artifact
            area for supporting notes, FSDs, or copied test cases.
          </p>
        </div>
        <Button variant="outline" onClick={onReload} disabled={isLoading}>
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh snippets
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <Select
          label="Backend Snippet"
          value={selectedSnippetId}
          onChange={(event) => onSnippetChange(event.target.value)}
          helperText="This selection drives the real review and evaluation payloads sent to the Azure API."
        >
          {snippets.map((snippet) => (
            <option key={snippet.id} value={snippet.id}>
              {snippet.id} · {snippet.language}
            </option>
          ))}
        </Select>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-on-surface">
            <FileCode2 className="size-4 text-primary" />
            Selected snippet context
          </div>
          {selectedSnippet ? (
            <div className="space-y-2 text-sm leading-6 text-on-surface-variant">
              <div className="text-on-surface">
                {selectedSnippet.id} · {selectedSnippet.language}
              </div>
              <p>{selectedSnippet.context || "No extra context provided by the backend for this snippet."}</p>
            </div>
          ) : (
            <p className="text-sm leading-6 text-on-surface-variant">Load a snippet to inspect its backend context.</p>
          )}
        </div>
      </div>
    </Panel>
  );
}
