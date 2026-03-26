import { Artifact, ArtifactType } from "@/types/review";

export function inferArtifactType(fileName: string): ArtifactType {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".patch") || lower.endsWith(".diff") || lower.endsWith(".ts") || lower.endsWith(".tsx")) {
    return "codeChange";
  }

  if (lower.includes("fsd") || lower.includes("spec") || lower.endsWith(".md")) {
    return "fsd";
  }

  if (lower.includes("test")) {
    return "testcase";
  }

  return "other";
}

export function getArtifactTypeLabel(type: ArtifactType) {
  switch (type) {
    case "codeChange":
      return "Code Change";
    case "fsd":
      return "FSD";
    case "testcase":
      return "Test Case";
    case "notes":
      return "Notes";
    default:
      return "Other";
  }
}

export function getArtifactPreviewLines(artifact?: Artifact) {
  if (!artifact) {
    return [];
  }

  return artifact.content.split("\n").slice(0, 120);
}
