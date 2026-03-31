import { useSearchParams } from "react-router-dom";
import { ReviewFlowPage } from "@/pages/ReviewFlowPage";
import type { ReviewFlowStep } from "@/models/review.types";

function parseWorkspaceStep(value: string | null): ReviewFlowStep | undefined {
  return value === "2" || value === "3" ? (Number(value) as ReviewFlowStep) : undefined;
}

export function WorkspacePage() {
  const [searchParams] = useSearchParams();
  return (
    <ReviewFlowPage
      reviewRunId={searchParams.get("reviewId")}
      initialStep={parseWorkspaceStep(searchParams.get("step")) ?? 1}
    />
  );
}
