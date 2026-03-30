import { create } from "zustand";
import {
  AgentRunStatus,
  ResultsFilters,
  ReviewResult,
  ReviewSession,
  StakeholderRole,
} from "@/types/review";

interface ReviewStoreState {
  sessions: Record<string, ReviewSession>;
  currentReviewId: string | null;
  currentRole: StakeholderRole;
  agentStatuses: Record<string, AgentRunStatus[]>;
  results: Record<string, ReviewResult>;
  resultsFilters: ResultsFilters;
  isBootstrapped: boolean;
  setSessions: (sessions: ReviewSession[]) => void;
  upsertSession: (session: ReviewSession) => void;
  setCurrentReviewId: (reviewId: string | null) => void;
  setCurrentRole: (role: StakeholderRole) => void;
  setAgentStatuses: (reviewId: string, statuses: AgentRunStatus[]) => void;
  setResult: (result: ReviewResult) => void;
  setResultsFilters: (filters: Partial<ResultsFilters>) => void;
  resetResultsFilters: () => void;
}

const initialFilters: ResultsFilters = {
  agentId: "all",
  severity: "all",
  filePath: "all",
  developerFoundStatus: "all",
  sortBy: "severity",
};

function areFiltersEqual(left: ResultsFilters, right: ResultsFilters) {
  return (
    left.agentId === right.agentId &&
    left.severity === right.severity &&
    left.filePath === right.filePath &&
    left.developerFoundStatus === right.developerFoundStatus &&
    left.sortBy === right.sortBy
  );
}

function areStatusesEqual(left: AgentRunStatus[], right: AgentRunStatus[]) {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => {
    const next = right[index];
    return (
      item.agentId === next.agentId &&
      item.status === next.status &&
      item.progress === next.progress &&
      item.startedAt === next.startedAt &&
      item.completedAt === next.completedAt
    );
  });
}

export const useReviewStore = create<ReviewStoreState>((set) => ({
  sessions: {},
  currentReviewId: null,
  currentRole: "DEV",
  agentStatuses: {},
  results: {},
  resultsFilters: initialFilters,
  isBootstrapped: false,
  setSessions: (sessions) =>
    set((state) => {
      const map = Object.fromEntries(sessions.map((session) => [session.id, session]));
      const current = state.currentReviewId ?? sessions[0]?.id ?? null;
      const role = current ? map[current]?.stakeholderRole ?? state.currentRole : state.currentRole;
      return {
        sessions: map,
        currentReviewId: current,
        currentRole: role,
        isBootstrapped: true,
      };
    }),
  upsertSession: (session) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [session.id]: session,
      },
      currentReviewId: state.currentReviewId ?? session.id,
    })),
  setCurrentReviewId: (reviewId) =>
    set((state) => {
      const nextRole = reviewId ? state.sessions[reviewId]?.stakeholderRole ?? state.currentRole : state.currentRole;

      if (state.currentReviewId === reviewId && state.currentRole === nextRole) {
        return state;
      }

      return {
        currentReviewId: reviewId,
        currentRole: nextRole,
      };
    }),
  setCurrentRole: (role) =>
    set((state) => {
      const currentReview = state.currentReviewId ? state.sessions[state.currentReviewId] : undefined;

      if (state.currentRole === role && (!currentReview || currentReview.stakeholderRole === role)) {
        return state;
      }

      return {
        currentRole: role,
        sessions:
          currentReview && state.currentReviewId
            ? {
                ...state.sessions,
                [state.currentReviewId]: {
                  ...currentReview,
                  stakeholderRole: role,
                },
              }
            : state.sessions,
      };
    }),
  setAgentStatuses: (reviewId, statuses) =>
    set((state) => {
      const current = state.agentStatuses[reviewId] ?? [];
      if (areStatusesEqual(current, statuses)) {
        return state;
      }

      return {
        agentStatuses: {
          ...state.agentStatuses,
          [reviewId]: statuses,
        },
      };
    }),
  setResult: (result) =>
    set((state) => ({
      results: {
        ...state.results,
        [result.reviewId]: result,
      },
    })),
  setResultsFilters: (filters) =>
    set((state) => {
      const nextFilters = {
        ...state.resultsFilters,
        ...filters,
      };

      return areFiltersEqual(state.resultsFilters, nextFilters) ? state : { resultsFilters: nextFilters };
    }),
  resetResultsFilters: () =>
    set((state) => (areFiltersEqual(state.resultsFilters, initialFilters) ? state : { resultsFilters: initialFilters })),
}));
