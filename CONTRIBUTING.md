# Contributing to HealthyCrop

Thank you for your interest in contributing to **HealthyCrop**. This document outlines our development setup, conventions, quality checks, and pull request workflow.

## Language Policy

- Write **all code, comments, docstrings, commit messages, issues, pull requests, file names, and documentation in English**, except [`docs/SETUP_SERVICES_ES.md`](docs/SETUP_SERVICES_ES.md), which is maintained in Spanish.
- The Android application UI uses `i18next` with **Spanish (`es`) as the default locale** and **English (`en`)** as the secondary locale.

## Prerequisites & Tooling

- **Node.js**: Current LTS (see [`.nvmrc`](.nvmrc), `24.18.0`).
- **Package Manager (JS/TS)**: **`pnpm` only** (pinned in root [`package.json`](package.json)). Never use `npm` or `yarn`, and never commit `package-lock.json` or `yarn.lock`.
- **Python**: **Python 3.12** managed via **`uv`** (separate `uv` projects in `ml/` and `api/`).
- **Android Development**: Android SDK Platform-Tools (`adb`), JDK 17, and an Android device or emulator for running the Expo development build (`react-native-fast-tflite` requires a native development build and cannot run inside Expo Go).

## Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/keylorpineda/healthycrop.git
   cd healthycrop
   ```

2. Install JavaScript dependencies from the repository root:
   ```bash
   pnpm install
   ```

3. Set up the Python environments for `api/` and `ml/`:
   ```bash
   cd api && uv sync --all-extras && cd ..
   cd ml && uv sync --all-extras && cd ..
   ```

4. Copy the environment variable templates:
   ```bash
   cp api/.env.example api/.env
   cp app/.env.example app/.env
   ```
   Follow [`docs/SETUP_SERVICES_ES.md`](docs/SETUP_SERVICES_ES.md) for step-by-step instructions on configuring external services.

## Non-Negotiable Engineering Rules

1. **`pnpm` only** for JavaScript/TypeScript workspaces.
2. **Zero data leakage**: ML splits (`70/15/15`, seed `42`) are grouped by `group_id` (plant/tree) after perceptual-hash deduplication across sources.
3. **Identical preprocessing**: Python training/export and the React Native inference pipeline (`app/src/ml/`) must produce identical input tensors (verified by a shared fixture test).
4. **Strict data boundary**: The Android app authenticates with Firebase Auth (ID tokens) and communicates exclusively with the FastAPI backend (`api/`). The app **never** accesses Firestore directly.
5. **No secrets, datasets, or model weights in Git**: Never commit `.env` files, service account keys, `google-services.json`, `kaggle.json`, raw/processed datasets, or `.tflite`/`.keras` weights.

## Issue & Branch Workflow

1. **Every change starts with an issue**:
   - Ensure an approved GitHub Issue exists and belongs to a milestone (`MVP`, `v1.1`, or `v1.2`) and the GitHub Project board.
   - Move the issue to **In progress** before starting work.
   - If the scope changes while working, update the issue description first rather than deviating silently.

2. **Branch naming**:
   Create one branch per issue from `main`:
   - `feat/<issue-number>-<short-slug>` (e.g., `feat/12-coffee-export`)
   - `fix/<issue-number>-<short-slug>`
   - `docs/<issue-number>-<short-slug>`
   - `chore/<issue-number>-<short-slug>`
   - `test/<issue-number>-<short-slug>`

3. **Conventional Commits**:
   Format every commit message using Conventional Commits and reference the issue number:
   ```text
   <type>(<scope>): <imperative summary> (#<issue-number>)
   ```
   - Allowed types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `ci`, `build`, `perf`
   - Common scopes: `ml`, `app`, `api`, `ci`, `docs`, `repo`
   - Example: `feat(ml): export coffee model to TFLite (#12)`

## Quality Checks Before Opening a PR

All checks must pass locally before pushing. Fix root causes; never disable linter rules or skip tests.

- **App (`app/`)**:
  ```bash
  pnpm --filter @healthycrop/app lint
  pnpm --filter @healthycrop/app format:check
  pnpm --filter @healthycrop/app typecheck
  pnpm --filter @healthycrop/app test
  ```

- **API (`api/`)**:
  ```bash
  cd api
  uv run ruff check .
  uv run ruff format --check .
  uv run mypy src tests
  uv run pytest
  ```

- **ML (`ml/`)**:
  ```bash
  cd ml
  uv run ruff check .
  uv run ruff format --check .
  uv run mypy src tests
  uv run pytest
  ```

## Pull Request Flow

1. Open a Pull Request targeting `main` and fill out the entire [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).
2. Include `Closes #<issue-number>` in the PR description.
3. Attach screenshots or a screen recording for any UI changes.
4. Ensure all CI jobs (`app`, `api`, `ml`) are green.
5. Squash-merge into `main` once approved and green; the linked issue will move to **Done**.
