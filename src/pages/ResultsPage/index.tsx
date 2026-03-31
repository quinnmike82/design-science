import { useParams } from "react-router-dom";
import { ReviewFlowPage } from "@/pages/ReviewFlowPage";

export function ResultsPage() {
  const params = useParams<{ reviewId: string }>();
  return <ReviewFlowPage reviewRunId={params.reviewId ?? null} initialStep={2} />;
}
