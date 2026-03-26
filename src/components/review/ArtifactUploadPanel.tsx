import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import { FileText, UploadCloud } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { ArtifactType } from "@/types/review";
import { getArtifactTypeLabel } from "@/utils/artifact";

const artifactTypes: ArtifactType[] = ["codeChange", "fsd", "testcase", "notes", "other"];

interface ArtifactUploadPanelProps {
  isUploading: boolean;
  onUploadFile: (file: File, type: ArtifactType) => Promise<void>;
  onAddPastedArtifact: (payload: { name: string; content: string; type: ArtifactType }) => Promise<void>;
}

export function ArtifactUploadPanel({
  isUploading,
  onUploadFile,
  onAddPastedArtifact,
}: ArtifactUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [artifactType, setArtifactType] = useState<ArtifactType>("codeChange");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  const canSubmitPaste = useMemo(() => name.trim().length > 0 && content.trim().length > 0, [content, name]);

  const handleFile = async (file?: File) => {
    if (!file) {
      return;
    }
    await onUploadFile(file, artifactType);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    await handleFile(event.dataTransfer.files[0]);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`panel-grid flex min-h-[220px] flex-col justify-between rounded-3xl border border-dashed p-5 transition-all ${
          dragActive ? "border-primary/60 bg-primary/5" : "border-white/10 bg-white/5"
        }`}
      >
        <div className="space-y-3">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
            <UploadCloud className="size-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-xl font-semibold text-on-surface">Upload review artifacts</h3>
            <p className="max-w-md text-sm leading-6 text-on-surface-variant">
              Drop changed files, patch files, specs, tests, or notes here. Files stay in the frontend mock layer
              and are modeled through the same service interface a future backend will replace.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Select
            label="Artifact Type"
            value={artifactType}
            onChange={(event) => setArtifactType(event.target.value as ArtifactType)}
          >
            {artifactTypes.map((type) => (
              <option key={type} value={type}>
                {getArtifactTypeLabel(type)}
              </option>
            ))}
          </Select>
          <div className="flex flex-wrap gap-3">
            <input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} />
            <Button onClick={() => inputRef.current?.click()} disabled={isUploading}>
              <UploadCloud className="size-4" />
              {isUploading ? "Uploading..." : "Upload File"}
            </Button>
            <Button variant="outline" disabled>
              <FileText className="size-4" />
              Mock Storage Boundary
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
            Paste Content
          </div>
          <h3 className="font-display text-xl font-semibold text-on-surface">Add snippets, notes, or copied docs</h3>
        </div>
        <div className="space-y-4">
          <input
            className="h-11 w-full rounded-xl border border-white/10 bg-surface/90 px-4 text-sm text-on-surface focus:border-primary/60"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Artifact name"
          />
          <textarea
            className="min-h-[138px] w-full rounded-2xl border border-white/10 bg-surface/90 px-4 py-3 text-sm leading-6 text-on-surface focus:border-primary/60"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Paste changed code, requirement notes, or reviewer context..."
          />
          <Button
            className="w-full justify-center"
            disabled={!canSubmitPaste || isUploading}
            onClick={async () => {
              await onAddPastedArtifact({ name, content, type: artifactType });
              setName("");
              setContent("");
            }}
          >
            Save Pasted Artifact
          </Button>
        </div>
      </div>
    </div>
  );
}
