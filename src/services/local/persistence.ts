import { ReviewResult, ReviewSession } from "@/types/review";

const STORAGE_KEYS = {
  sessions: "coding-coach.sessions",
  results: "coding-coach.results",
} as const;

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadJson<T>(key: string, fallback: T): T {
  if (!hasStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T) {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadSessions() {
  return loadJson<ReviewSession[]>(STORAGE_KEYS.sessions, []);
}

export function saveSessions(sessions: ReviewSession[]) {
  saveJson(STORAGE_KEYS.sessions, sessions);
}

export function loadResults() {
  return loadJson<Record<string, ReviewResult>>(STORAGE_KEYS.results, {});
}

export function saveResults(results: Record<string, ReviewResult>) {
  saveJson(STORAGE_KEYS.results, results);
}
