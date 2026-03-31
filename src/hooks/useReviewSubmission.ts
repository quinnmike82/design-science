import { useState } from "react";
import type { ReviewRunRecord, ReviewSubmitRequest } from "@/models/review.types";
import { submitReview } from "@/services/review.service";

export function useReviewSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const runSubmission = async (request: ReviewSubmitRequest): Promise<ReviewRunRecord> => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      return await submitReview(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit the review.";
      setSubmitError(message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitError,
    submitReview: runSubmission,
  };
}
