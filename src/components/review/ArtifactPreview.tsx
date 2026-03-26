import { Artifact } from "@/types/review";
import { getArtifactPreviewLines, getArtifactTypeLabel } from "@/utils/artifact";

interface ArtifactPreviewProps {
  artifact?: Artifact;
}

export function ArtifactPreview({ artifact }: ArtifactPreviewProps) {
  if (!artifact) {
    return (
      <div className="flex min-h-[480px] items-center justify-center rounded-3xl border border-white/10 bg-surface-low/80">
        <p className="max-w-sm text-center text-sm leading-6 text-on-surface-variant">
          Select an artifact to inspect its content. Code changes, FSD notes, tests, and reviewer comments all use
          the same preview surface.
        </p>
      </div>
    );
  }

  const lines = getArtifactPreviewLines(artifact);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/35">
      <div className="flex items-center justify-between border-b border-white/10 bg-surface-low/95 px-5 py-3">
        <div>
          <div className="text-sm font-medium text-on-surface">{artifact.name}</div>
          <div className="mt-1 text-xs text-on-surface-variant">{getArtifactTypeLabel(artifact.type)}</div>
        </div>
      </div>
      <div className="max-h-[520px] overflow-auto px-5 py-4 font-mono text-[13px] leading-7 text-on-surface scrollbar-thin">
        {lines.map((line, index) => (
          <div key={`${artifact.id}-${index}`} className="grid grid-cols-[44px_1fr] gap-3">
            <span className="select-none text-right text-outline">{index + 1}</span>
            <span className="whitespace-pre-wrap break-words text-on-surface">{line || " "}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
