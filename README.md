# Synthetic Architect

Frontend-only mock application for an agentic code review product. The app recreates the provided dark, premium product language across:

- Landing page
- Review workspace
- Results dashboard
- Review history

It is intentionally structured so the current mock services can be replaced by real backend clients later without rewriting the presentation layer.

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

2. Start the dev server:

```bash
npm run dev
```

3. Build for production:

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

## Mock service replacement plan

The current backend boundary is already isolated in `src/services/mock/`.

- `reviewSessionService.ts`
  Replace with real `GET /reviews`, `GET /reviews/:id`, `POST /reviews`, `PATCH /reviews/:id`.
- `artifactService.ts`
  Replace with real artifact upload and delete endpoints.
- `reviewRunService.ts`
  Replace with real run trigger + polling, SSE, or websocket orchestration.
- `db.ts`
  Delete once real HTTP clients become the source of truth.

The UI pages and components should continue to call the same service functions, so the migration stays localized.

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

## Seeded demo flow

Use `rev-synth-001` to test the primary experience:

- workspace artifacts already loaded
- stakeholder role dropdown on workspace and results
- mock multi-agent run with status progression
- results dashboard with role-aware finding rendering

Additional seeded reviews are included for history and alternate result navigation.
