import { mockDb } from "@/services/mock/db";
import { clone, createId, sleep } from "@/services/mock/helpers";
import { Artifact, ArtifactType } from "@/types/review";
import { inferArtifactType } from "@/utils/artifact";

export interface UploadArtifactInput {
  file?: File;
  reviewId: string;
  type?: ArtifactType;
  name?: string;
  content?: string;
}

async function uploadArtifact(input: UploadArtifactInput) {
  const review = mockDb.reviews.get(input.reviewId);
  if (!review) {
    throw new Error(`Review ${input.reviewId} not found.`);
  }

  await sleep(260);

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

  review.artifacts = [artifact, ...review.artifacts];
  mockDb.reviews.set(review.id, review);

  return clone(artifact);
}

async function removeArtifact(reviewId: string, artifactId: string) {
  const review = mockDb.reviews.get(reviewId);
  if (!review) {
    throw new Error(`Review ${reviewId} not found.`);
  }

  await sleep(140);
  review.artifacts = review.artifacts.filter((artifact) => artifact.id !== artifactId);
  mockDb.reviews.set(review.id, review);
  return clone(review.artifacts);
}

export const artifactService = {
  uploadArtifact,
  removeArtifact,
};
