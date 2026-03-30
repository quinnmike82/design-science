import { Artifact, ArtifactType } from "@/types/review";
import { reviewSessionService } from "@/services/reviewSessionService";
import { inferArtifactType } from "@/utils/artifact";
import { createId } from "@/utils/id";

export interface UploadArtifactInput {
  file?: File;
  reviewId: string;
  type?: ArtifactType;
  name?: string;
  content?: string;
}

async function uploadArtifact(input: UploadArtifactInput) {
  const review = await reviewSessionService.getReviewById(input.reviewId);
  if (!review) {
    throw new Error(`Review ${input.reviewId} not found.`);
  }

  const fileContent = input.file ? await input.file.text() : input.content ?? "";
  const fileName = input.file?.name;
  const artifact: Artifact = {
    id: createId("artifact"),
    type: input.type ?? inferArtifactType(fileName ?? input.name ?? "artifact.txt"),
    name: input.name ?? fileName ?? "Pasted artifact",
    content: fileContent,
    fileName,
    size: input.file?.size ?? fileContent.length,
    uploadedAt: new Date().toISOString(),
  };

  await reviewSessionService.updateReviewSession(review.id, {
    artifacts: [artifact, ...review.artifacts],
  });

  return artifact;
}

async function removeArtifact(reviewId: string, artifactId: string) {
  const review = await reviewSessionService.getReviewById(reviewId);
  if (!review) {
    throw new Error(`Review ${reviewId} not found.`);
  }

  const artifacts = review.artifacts.filter((artifact) => artifact.id !== artifactId);
  await reviewSessionService.updateReviewSession(review.id, { artifacts });
  return artifacts;
}

export const artifactService = {
  uploadArtifact,
  removeArtifact,
};
