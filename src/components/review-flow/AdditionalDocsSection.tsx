import type { ReviewInputFile } from "@/models/review.types";
import { InputFilesSection } from "@/components/review-flow/InputFilesSection";

interface AdditionalDocsSectionProps {
  files: ReviewInputFile[];
  onFilesSelected: (files: FileList) => Promise<void> | void;
  onRemoveFile: (fileId: string) => void;
}

export function AdditionalDocsSection(props: AdditionalDocsSectionProps) {
  return (
    <InputFilesSection
      {...props}
      title="Additional documents / FSD"
      description="Attach FSD, testcase packs, notes, or any supporting documents that make the review more accurate."
      helperText="Supporting uploads are optional and can include FSDs, testcase files, design notes, and review context."
      inputId="supporting-files-input"
    />
  );
}
