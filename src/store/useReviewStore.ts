import { create } from "zustand";
import {
  AgentRunStatus,
  Finding,
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
  selectedFindingId: string | null;
  resultsFilters: ResultsFilters;
  isBootstrapped: boolean;
  setSessions: (sessions: ReviewSession[]) => void;
  upsertSession: (session: ReviewSession) => void;
  setCurrentReviewId: (reviewId: string | null) => void;
  setCurrentRole: (role: StakeholderRole) => void;
  setAgentStatuses: (reviewId: string, statuses: AgentRunStatus[]) => void;
  setResult: (result: ReviewResult) => void;
  setSelectedFinding: (findingId: string | null) => void;
  setResultsFilters: (filters: Partial<ResultsFilters>) => void;
  resetResultsFilters: () => void;
}

const initialFilters: ResultsFilters = {
  agentId: "all",
  severity: "all",
  sortBy: "severity",
};

export const useReviewStore = create<ReviewStoreState>((set) => ({
  sessions: {},
  currentReviewId: null,
  currentRole: "DEV",
  agentStatuses: {},
  results: {},
  selectedFindingId: null,
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
    set((state) => ({
      currentReviewId: reviewId,
      currentRole: reviewId ? state.sessions[reviewId]?.stakeholderRole ?? state.currentRole : state.currentRole,
    })),
  setCurrentRole: (role) =>
    set((state) => {
      const currentReview = state.currentReviewId ? state.sessions[state.currentReviewId] : undefined;
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
    set((state) => ({
      agentStatuses: {
        ...state.agentStatuses,
        [reviewId]: statuses,
      },
    })),
  setResult: (result) =>
    set((state) => ({
      results: {
        ...state.results,
        [result.reviewId]: result,
      },
    })),
  setSelectedFinding: (findingId) => set({ selectedFindingId: findingId }),
  setResultsFilters: (filters) =>
    set((state) => ({
      resultsFilters: {
        ...state.resultsFilters,
        ...filters,
      },
    })),
  resetResultsFilters: () => set({ resultsFilters: initialFilters }),
}));

export function getSelectedFinding(findings: Finding[], selectedFindingId: string | null) {
  return findings.find((finding) => finding.id === selectedFindingId) ?? null;
}
