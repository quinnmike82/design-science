import { useEffect, useState } from "react";
import type { ReviewRunRecord } from "@/models/review.types";
import { getOrCreateLatestReviewRun, getReviewRun } from "@/services/review.service";

interface UseReviewResultsState {
  run: ReviewRunRecord | null;
  isLoading: boolean;
  error: string | null;
}

export function useReviewResults(reviewRunId?: string | null) {
  const [state, setState] = useState<UseReviewResultsState>({
    run: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    try {
      const run = reviewRunId ? getReviewRun(reviewRunId) : getOrCreateLatestReviewRun();
      if (!run) {
        setState({
          run: null,
          isLoading: false,
          error: reviewRunId ? "The selected review run could not be found." : "No review run is available yet.",
        });
        return;
      }

      setState({
        run,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        run: null,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load the review run.",
      });
    }
  }, [reviewRunId]);

  return {
    ...state,
    setRun: (run: ReviewRunRecord) =>
      setState({
        run,
        isLoading: false,
        error: null,
      }),
  };
}
