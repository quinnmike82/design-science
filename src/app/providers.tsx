import { PropsWithChildren, useEffect } from "react";
import { reviewSessionService } from "@/services/reviewSessionService";
import { useReviewStore } from "@/store/useReviewStore";

export function AppProviders({ children }: PropsWithChildren) {
  const setSessions = useReviewStore((state) => state.setSessions);
  const setCurrentReviewId = useReviewStore((state) => state.setCurrentReviewId);

  useEffect(() => {
    reviewSessionService.listReviews().then((reviews) => {
      setSessions(reviews);
      if (!useReviewStore.getState().currentReviewId && reviews.length > 0) {
        setCurrentReviewId(reviews[0].id);
      }
    });
  }, [setCurrentReviewId, setSessions]);

  return children;
}
