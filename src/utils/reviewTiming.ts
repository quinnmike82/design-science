import type { ReviewFlowStep, ReviewStepMetrics } from "@/models/review.types";

export interface ReviewStepMetricsSnapshot {
  totalActiveSec: number;
  stepTimesSec: Record<ReviewFlowStep, number>;
}

function toSafeSeconds(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function getElapsedSeconds(startedAt?: string, endedAt = new Date().toISOString()) {
  if (!startedAt) {
    return 0;
  }

  const startedMs = new Date(startedAt).getTime();
  const endedMs = new Date(endedAt).getTime();

  if (!Number.isFinite(startedMs) || !Number.isFinite(endedMs) || endedMs <= startedMs) {
    return 0;
  }

  return Math.floor((endedMs - startedMs) / 1000);
}

export function createEmptyReviewStepMetrics(): ReviewStepMetrics {
  return {
    totalActiveSec: 0,
    stepTimesSec: {
      1: 0,
      2: 0,
      3: 0,
    },
  };
}

export function normalizeReviewStepMetrics(metrics?: Partial<ReviewStepMetrics> | null): ReviewStepMetrics {
  const defaults = createEmptyReviewStepMetrics();

  return {
    totalActiveSec: toSafeSeconds(metrics?.totalActiveSec),
    stepTimesSec: {
      1: toSafeSeconds(metrics?.stepTimesSec?.[1]),
      2: toSafeSeconds(metrics?.stepTimesSec?.[2]),
      3: toSafeSeconds(metrics?.stepTimesSec?.[3]),
    },
    activeStep:
      metrics?.activeStep === 1 || metrics?.activeStep === 2 || metrics?.activeStep === 3
        ? metrics.activeStep
        : undefined,
    activeStepEnteredAt:
      typeof metrics?.activeStepEnteredAt === "string" && metrics.activeStepEnteredAt.trim().length > 0
        ? metrics.activeStepEnteredAt
        : undefined,
  };
}

export function pauseReviewStepMetrics(
  metrics?: Partial<ReviewStepMetrics> | null,
  endedAt = new Date().toISOString(),
): ReviewStepMetrics {
  const normalized = normalizeReviewStepMetrics(metrics);
  if (!normalized.activeStep || !normalized.activeStepEnteredAt) {
    return {
      ...normalized,
      activeStep: undefined,
      activeStepEnteredAt: undefined,
    };
  }

  const elapsedSec = getElapsedSeconds(normalized.activeStepEnteredAt, endedAt);
  const nextStepTimes = {
    ...normalized.stepTimesSec,
    [normalized.activeStep]: normalized.stepTimesSec[normalized.activeStep] + elapsedSec,
  };

  return {
    totalActiveSec: normalized.totalActiveSec + elapsedSec,
    stepTimesSec: nextStepTimes,
    activeStep: undefined,
    activeStepEnteredAt: undefined,
  };
}

export function activateReviewStepMetrics(
  metrics: Partial<ReviewStepMetrics> | null | undefined,
  step: ReviewFlowStep,
  startedAt = new Date().toISOString(),
): ReviewStepMetrics {
  const paused = pauseReviewStepMetrics(metrics, startedAt);

  return {
    ...paused,
    activeStep: step,
    activeStepEnteredAt: startedAt,
  };
}

export function getReviewStepMetricsSnapshot(
  metrics?: Partial<ReviewStepMetrics> | null,
  endedAt = new Date().toISOString(),
): ReviewStepMetricsSnapshot {
  const normalized = normalizeReviewStepMetrics(metrics);
  if (!normalized.activeStep || !normalized.activeStepEnteredAt) {
    return {
      totalActiveSec: normalized.totalActiveSec,
      stepTimesSec: normalized.stepTimesSec,
    };
  }

  const elapsedSec = getElapsedSeconds(normalized.activeStepEnteredAt, endedAt);

  return {
    totalActiveSec: normalized.totalActiveSec + elapsedSec,
    stepTimesSec: {
      ...normalized.stepTimesSec,
      [normalized.activeStep]: normalized.stepTimesSec[normalized.activeStep] + elapsedSec,
    },
  };
}
