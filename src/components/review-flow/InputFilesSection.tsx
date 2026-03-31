import { Upload, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Panel } from "@/components/common/Panel";
import type { ReviewInputFile } from "@/models/review.types";

interface InputFilesSectionProps {
  title: string;
  description: string;
  inputId: string;
  files: ReviewInputFile[];
  helperText: string;
  onFilesSelected: (files: FileList) => Promise<void> | void;
  onRemoveFile: (fileId: string) => void;
}

export function InputFilesSection({
  title,
  description,
  inputId,
  files,
  helperText,
  onFilesSelected,
  onRemoveFile,
}: InputFilesSectionProps) {
  return (
    <Panel className="space-y-4">
      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">{title}</div>
        <p className="text-sm leading-6 text-on-surface-variant">{description}</p>
      </div>

      <label
        htmlFor={inputId}
        className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-surface-low/70 px-6 py-10 text-center transition-colors hover:border-primary/30 hover:bg-surface/80"
      >
        <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
          <Upload className="size-5" />
        </div>
        <div className="mt-4 font-medium text-on-surface">Select files</div>
        <div className="mt-1 max-w-lg text-sm leading-6 text-on-surface-variant">{helperText}</div>
      </label>
      <input
        id={inputId}
        type="file"
        multiple
        aria-label={title}
        className="sr-only"
        onChange={(event) => {
          if (!event.target.files?.length) {
            return;
          }
          void onFilesSelected(event.target.files);
          event.target.value = "";
        }}
      />

      {files.length > 0 ? (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-on-surface">{file.name}</div>
                <div className="text-xs text-on-surface-variant">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onRemoveFile(file.id)} aria-label={`Remove ${file.name}`}>
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}
