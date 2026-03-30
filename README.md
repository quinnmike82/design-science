# Synthetic Architect

Frontend-only mock application for an agentic code review product. The app recreates the provided dark, premium product language across:

- Landing page
- Review workspace
- Results dashboard
- Review history

It started as a mock frontend and is now wired to the real Azure-backed Coding Coach API for snippet loading, developer-review evaluation, and AI review results, while keeping local-only fallbacks for unsupported backend capabilities such as artifact upload persistence and review history.

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand

## Run

1. Install dependencies:

```bash
npm install
```

2. Point the app at the backend:

```bash
copy .env.example .env
```

By default the frontend uses `http://localhost:8000` via `VITE_API_BASE_URL`.

3. Start the dev server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Project structure

```text
src/
  app/                    router + providers
  components/
    common/               shared UI primitives
    layout/               top nav, side nav, shell
    review/               workspace-specific UI
    results/              dashboard-specific UI
  data/                   seeded mock agents, reviews, and results
  features/
    review-results/       filtering + role-aware presenter logic
    review-session/       default review draft data
    stakeholder-role/     role config and labels
  pages/                  landing, workspace, results, history routes
  services/mock/          async Promise-based mock services and in-memory db
  store/                  lightweight Zustand app state
  types/                  typed contracts for sessions, artifacts, agents, findings, results
  utils/                  formatting, artifact helpers, class helpers
```

## Backend integration

Real backend calls now live under `src/services/api/` and the main orchestration layer lives in `src/services/`.

- Real API usage:
  - `GET /snippets`
  - `GET /snippets/:id`
  - `POST /api/analytics/start`
  - `POST /api/analytics/evaluate`
  - `POST /review/monolithic`
  - `POST /review/specialist`
- Local-only fallback usage:
  - artifact upload/paste state in the workspace
  - persisted frontend review history
  - follow-up assistant prompt rewriting

The UI still talks to a centralized service layer, so future backend expansion should stay localized.

## Stakeholder role logic

Stakeholder role is a first-class concept.

- Config and labels live in `src/features/stakeholder-role/roleConfig.ts`
- Role-aware executive summary and finding presenters live in `src/features/review-results/presenters.ts`
- Shared finding filtering and sorting lives in `src/features/review-results/filters.ts`

The same canonical `ReviewResult` drives all four perspectives:

- `DEV`
- `BA`
- `QA`
- `PM`

Switching roles does not require a refetch. The presentation layer transforms the same result model in place.

## Current workflow

1. Load a backend snippet from the workspace
2. Add developer review comments tied to specific lines
3. Submit the review for evaluation + AI feedback
4. Inspect the role-aware results dashboard with accordion finding cards
5. Re-open completed runs from the local history page
