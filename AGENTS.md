# AGENTS.md — HealthyCrop Guide

## Summary
**HealthyCrop** (`com.keylorpineda.healthycrop`) is an open-source, non-commercial, offline-first Android app that detects crop diseases (coffee leaf, cacao pod, banana leaf) from phone photos via on-device TFLite models, generates grounded explanations with Gemini RAG, and tracks farms/plots. First market: Costa Rica. Distributed only as an APK on GitHub Releases. Supports decisions; does not replace an agronomist.
Owner & author: **Keylor Pineda** (`@keylorpineda`).

## Layout
```text
healthycrop/
├── AGENTS.md      # Rules & workflow (< 4,000 chars)
├── .github/       # Community files, templates, CI/release workflows
├── ml/            # Python 3.12 (uv): data, training, eval, TFLite export
├── api/           # Python 3.12 (uv): FastAPI, Firebase Admin, Cloudinary, RAG
├── app/           # Expo React Native (Android, pnpm): TFLite, SQLite, UI
└── docs/          # PLAN, ARCHITECTURE, DATASETS, MODEL_CARD, EXPERIMENTS, DEVLOG, SETUP_SERVICES_ES
```

## Commands
- **App (`app/`, pnpm only)**: `pnpm install` | `pnpm lint` | `pnpm format:check` | `pnpm typecheck` | `pnpm test`
- **API (`api/`, uv + Python 3.12)**: `cd api && uv sync --all-extras && uv run ruff check . && uv run ruff format --check . && uv run mypy src tests && uv run pytest`
- **ML (`ml/`, uv + Python 3.12)**: `cd ml && uv sync --all-extras && uv run ruff check . && uv run ruff format --check . && uv run mypy src tests && uv run pytest`

## Conventions
- **Commits**: Conventional Commits referencing issue: `<type>(<scope>): <summary> (#<id>)`.
- **Branches**: One branch per issue from `main`: `feat/<id>-<slug>`, `fix/...`, `docs/...`, `chore/...`.
- **Python**: Python 3.12, strict `mypy`, `ruff`, `pytest`.
- **App**: TypeScript `strict`, ESLint, Prettier, Jest + RNTL. Tokens only in `app/src/theme/`; UI primitives only in `app/src/components/ui/`. UI i18n: `es` default, `en` secondary.

## Non-Negotiables
1. **Language**: English everywhere (code, comments, commits, issues, PRs, docs, filenames) **except** `docs/SETUP_SERVICES_ES.md` (Spanish).
2. **Git Identity**: Local git identity (`Keylor Pineda` / `keylorpineda`) only. Never change git config, use another identity, or add AI co-author trailers.
3. **Tooling**: **pnpm only** for JS (`node-linker=hoisted` in `.npmrc`), never `npm`/`yarn`. **uv only** for `ml/` and `api/`.
4. **No Leakage**: Perceptual-hash deduplication across sources; 70/15/15 stratified split grouped by `group_id` (plant/tree), seed `42`.
5. **Identical Preprocessing**: Python training/export and `app/src/ml/` must produce the exact same 224x224 RGB normalized tensor (verified by a shared fixture test).
6. **Firestore Boundary**: App sends Firebase ID tokens to `api/` and **never** touches Firestore directly; Firestore rules deny all client access.
7. **No Secrets/Data/Weights in Git**: Never read, print, or commit `.env`, `service-account*.json`, `google-services.json`, `kaggle.json`, keystores, `ml/data/`, or `*.tflite`/`*.keras`/`*.h5`.
8. **Issue & Branch Flow**: Every task has an approved issue (`[Phase N] Imperative summary`, Context/Scope/Out of scope/Acceptance criteria/Dependencies, 1 `type:`, >=1 `area:`, 1 `priority:`, Milestone, Project board). Move to *In progress* -> branch -> PR with `Closes #N` -> green CI -> squash-merge -> *Done*.

## Workflow
1. One phase at a time, in order (`docs/PLAN.md`).
2. Before coding, present an implementation plan (files, new dependencies + why, risks, open questions) and wait for approval.
3. Work issue by issue on its branch; run lint, typecheck, and tests; fix root causes (never disable rules or skip tests).
4. Verify each "Done when" and explain how; tick `docs/PLAN.md`; update `docs/DEVLOG.md` and `CHANGELOG.md`.
5. Show proposed commits and PR before pushing; never force-push `main`.
