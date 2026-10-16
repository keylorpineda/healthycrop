# HealthyCrop — Engineering Development Log (DEVLOG)

This log documents what was built, key architectural decisions, and technical problems solved at the end of each phase.

---

## Phase 0 — Setup, Repo & Community Standards (2026-10-16)

### Built
- **Monorepo & Toolchain Foundation**:
  - Root configuration files: [`.gitignore`](../.gitignore), [`.gitattributes`](../.gitattributes) (enforcing LF), [`.editorconfig`](../.editorconfig), [`.nvmrc`](../.nvmrc) (`24.18.0`), [`.npmrc`](../.npmrc), [`pnpm-workspace.yaml`](../pnpm-workspace.yaml), root [`package.json`](../package.json) (`pnpm@11.17.0`), [`.vscode/extensions.json`](../.vscode/extensions.json), and [`.pre-commit-config.yaml`](../.pre-commit-config.yaml).
  - Environment variable templates [`api/.env.example`](../api/.env.example) and [`app/.env.example`](../app/.env.example).
  - Minimal `app/` (`pnpm` + TypeScript + ESLint + Prettier + Jest), `api/` (`uv` + Python 3.12 + Ruff + Mypy + Pytest), and `ml/` (`uv` + Python 3.12 + Ruff + Mypy + Pytest) empty test suites so CI verifies the entire toolchain from commit one.
- **GitHub Community Standards & Automation**:
  - [`LICENSE`](../LICENSE) (MIT, Keylor Pineda), [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) (Contributor Covenant 2.1), [`CONTRIBUTING.md`](../CONTRIBUTING.md), [`SECURITY.md`](../SECURITY.md), [`SUPPORT.md`](../SUPPORT.md), [`CITATION.cff`](../CITATION.cff), [`CHANGELOG.md`](../CHANGELOG.md), [`.github/CODEOWNERS`](../.github/CODEOWNERS), [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md), [`.github/dependabot.yml`](../.github/dependabot.yml), and structured issue templates (`bug_report.yml`, `feature_request.yml`, `model_issue.yml`, `config.yml`).
  - GitHub Actions workflows [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) and [`.github/workflows/release.yml`](../.github/workflows/release.yml).
  - Public repository [`keylorpineda/healthycrop`](https://github.com/keylorpineda/healthycrop) with `main` branch protection requiring CI checks, 13 custom labels, 3 milestones (`MVP`, `v1.1`, `v1.2`), linked GitHub Project board (`Project #3`), and 35 structured roadmap issues (`#10`–`#44`, with Phase 0 issues `#10`–`#12` retroactively closed and moved to `Done`).
- **Engineering & Product Documentation**:
  - [`AGENTS.md`](../AGENTS.md) (`< 4,000` characters) codifying commands, conventions, non-negotiables, and session workflow.
  - [`docs/PLAN.md`](PLAN.md), [`docs/ARCHITECTURE.md`](ARCHITECTURE.md), [`docs/DATASETS.md`](DATASETS.md), [`docs/MODEL_CARD.md`](MODEL_CARD.md), [`docs/EXPERIMENTS.md`](EXPERIMENTS.md), [`docs/FIELD_VALIDATION.md`](FIELD_VALIDATION.md), [`docs/SETUP_SERVICES_ES.md`](SETUP_SERVICES_ES.md) (step-by-step Spanish guide), and [`README.md`](../README.md).

### Decisions
1. **Hoisted `pnpm` Node Linker (`node-linker=hoisted`)**:
   - Expo and React Native native autolinking (`Gradle`, Metro bundler, and Babel plugins) frequently fail when traversing `pnpm`'s default symlinked virtual store in a monorepo. Setting `node-linker=hoisted` in [`.npmrc`](../.npmrc) preserves `pnpm`'s speed and deterministic `pnpm-lock.yaml` while presenting a flat `node_modules` tree compatible with native Android builds.
2. **Independent `uv` Projects for `api/` and `ml/`**:
   - `api/` (deployed to Render's lightweight container environment) requires a fast, minimal dependency tree (`fastapi`, `firebase-admin`, `google-genai`, `cloudinary`), whereas `ml/` requires heavy scientific/training packages (`tensorflow`, `scikit-learn`, `imagehash`). Keeping separate `pyproject.toml` and `uv.lock` files in `api/` and `ml/` prevents ML dependencies from bloating the API deployment image.
3. **Strict Client/Database Security Boundary**:
   - Documented and architected the system so the Android client never initializes the Firestore client SDK. All data reads/writes pass through `api/` with Firebase ID tokens verified by `firebase-admin`, eliminating client-side security rule misconfigurations.

### Problems Solved
- **Missing Global `python` Alias on Windows**:
  - On Windows 11, the default Microsoft Store `python.exe` execution alias returned an exit code `1` because Python was not installed globally on `PATH`. Configured `uv` (`uv python install 3.12` / `uv run --python 3.12`) to manage an isolated Python 3.12 runtime automatically for both `api/` and `ml/`.
