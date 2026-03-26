import { Trash2 } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Artifact } from "@/types/review";
import { cn } from "@/utils/cn";
import { formatBytes, formatDateTime } from "@/utils/format";
import { getArtifactTypeLabel } from "@/utils/artifact";

interface ArtifactListProps {
  artifacts: Artifact[];
  activeArtifactId: string | null;
  onSelect: (artifactId: string) => void;
  onRemove: (artifactId: string) => void;
}

export function ArtifactList({
  artifacts,
  activeArtifactId,
  onSelect,
  onRemove,
}: ArtifactListProps) {
  return (
    <div className="space-y-3">
      {artifacts.map((artifact) => (
        <div
          key={artifact.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(artifact.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect(artifact.id);
            }
          }}
          className={cn(
            "w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-primary/25 hover:bg-surface-high",
            activeArtifactId === artifact.id && "border-primary/30 bg-surface-variant",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="font-medium text-on-surface">{artifact.name}</div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                <Badge className="border-white/10 bg-white/5 text-on-surface-variant">
                  {getArtifactTypeLabel(artifact.type)}
                </Badge>
                <span>{formatBytes(artifact.size)}</span>
                <span>{formatDateTime(artifact.uploadedAt)}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={(event) => {
                event.stopPropagation();
                onRemove(artifact.id);
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
