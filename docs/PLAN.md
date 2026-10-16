# HealthyCrop — Master Implementation Plan

This document tracks the phased delivery of **HealthyCrop** (`com.keylorpineda.healthycrop`). Work proceeds strictly one phase at a time, in order. Every task maps to an atomic GitHub Issue (`0.5–2` days of work) on the GitHub Project board.

---

## Phase 0: Setup, Repo & Community Standards
**Milestone:** `MVP`

### Tasks
- [x] Create root workspace files: `.gitignore`, `.gitattributes`, `.editorconfig`, `.nvmrc`, `.npmrc` (`node-linker=hoisted` documented), `pnpm-workspace.yaml`, root `package.json`, `.vscode/extensions.json`, and `.pre-commit-config.yaml`.
- [x] Create `.env.example` templates for `api/` and `app/`.
- [x] Complete GitHub Community Standards: `README.md`, `LICENSE` (MIT, Keylor Pineda), `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1), `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`, `CITATION.cff`, `CHANGELOG.md`, `.github/CODEOWNERS`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/` (`bug_report.yml`, `feature_request.yml`, `model_issue.yml`, `config.yml`), and `.github/dependabot.yml`.
- [x] Write `AGENTS.md` (< 4,000 characters) and core engineering docs: `docs/PLAN.md`, `docs/ARCHITECTURE.md`, `docs/DATASETS.md`, `docs/MODEL_CARD.md`, `docs/EXPERIMENTS.md`, `docs/FIELD_VALIDATION.md`, `docs/DEVLOG.md`, and `docs/SETUP_SERVICES_ES.md` (in Spanish).
- [x] Configure empty test/lint/typecheck suites for `app/`, `api/`, and `ml/` alongside `.github/workflows/ci.yml` and `.github/workflows/release.yml`.
- [ ] Create public GitHub repository `keylorpineda/healthycrop`, push initial commit, configure branch protection on `main`, set up labels, milestones (`MVP`, `v1.1`, `v1.2`), and link the GitHub Project board.
- [ ] Create Phase 0–8 issues (and v1.1/v1.2 epics) after user approval of the issue list; retroactively close Phase 0 issues referencing the initial setup commits/PR.

### Done when
- Community Standards checklist is 100% complete on GitHub.
- Repository labels, milestones (`MVP`, `v1.1`, `v1.2`), and GitHub Project board (`Todo`, `In progress`, `In review`, `Done`) exist.
- GitHub Actions `ci.yml` runs green on `main` across `app`, `api`, and `ml` empty suites.

---

## Phase 1: Coffee Data & Baseline
**Milestone:** `MVP`

### Tasks
- [ ] Inspect and verify licenses for **RoCoLe** (DOI `10.17632/c5yvn32dzg.2`) and **BRACOL** (Mendeley `yy2k5y8mxg`); record full metadata and citations in `docs/DATASETS.md`.
- [ ] Implement idempotent, checksum-verified download scripts `ml/scripts/download_rocole.py` and `ml/scripts/download_bracol.py` targeting `ml/data/raw/<dataset>/` (with clear manual fallback + structural verification if automated download is blocked by host).
- [ ] Create `ml/configs/coffee.yaml` defining class taxonomy mapping (`healthy`, `leaf_rust` + severity, `leaf_miner`, `cercospora`, `brown_leaf_spot`, `red_spider_mite`), image size (`224x224`), and split parameters.
- [ ] Implement `ml/scripts/prepare_coffee.py` (with unit-tested core logic in `ml/src/`) to fix EXIF orientation, drop corrupt images, convert to RGB, filter BRACOL to whole-leaf images, deduplicate across sources via perceptual hash (`imagehash`), and generate a leakage-free `70/15/15` split grouped by `group_id` (plant) and stratified by label (`seed=42`).
- [ ] Evaluate any coffee class with `< 50` training images for merging and document the decision; generate `docs/data_reports/coffee.md` (split counts, sample grids, duplicates removed).
- [ ] Implement baseline training script (`ml/src/train.py` + Colab notebook) using `MobileNetV3-Large` (`ImageNet` weights, frozen backbone only, class weights, standard augmentations) and log test metrics + confusion matrix in `docs/EXPERIMENTS.md`.

### Done when
- `download_rocole.py`, `download_bracol.py`, and `prepare_coffee.py` run reproducibly with unit tests covering deduplication and grouped stratified splitting (`seed=42`, zero `group_id` overlap across splits).
- Licenses and citations are recorded in `docs/DATASETS.md` and split stats/grids are committed in `docs/data_reports/coffee.md`.
- Frozen-backbone `MobileNetV3-Large` baseline metrics (per-class precision/recall/F1, macro-F1, confusion matrix PNG) are logged in `docs/EXPERIMENTS.md`.

---

## Phase 2: Coffee Model & Export
**Milestone:** `MVP`

### Tasks
- [ ] Fine-tune top layers of `MobileNetV3-Large` on the coffee dataset at a lower learning rate after head warm-up, with early stopping on validation macro-F1; log runs in `docs/EXPERIMENTS.md` (target test macro-F1 >= `0.80`, or document experiments and root causes).
- [ ] Generate Grad-CAM visual explanations per coffee class for `README.md` and `docs/MODEL_CARD.md`.
- [ ] Export the best coffee model to float16 TFLite (`< 10 MB`) via `ml/src/export_tflite.py` and verify TFLite test accuracy is within `1 pp` of the Keras model.
- [ ] Calibrate the validation confidence threshold and write `ml/models/coffee/registry.json` (model filename, version, ordered labels, input size `224x224`, normalization parameters, confidence threshold).
- [ ] Create a deterministic shared fixture test (`ml/tests/test_preprocessing_fixture.py` + shared fixture asset) exporting reference RGB bytes and normalized tensor values so the React Native app can prove identical preprocessing.
- [ ] Complete the coffee section of `docs/MODEL_CARD.md`.

### Done when
- Fine-tuned coffee model achieves macro-F1 >= `0.80` on the held-out test split (or thorough ablation is documented in `docs/EXPERIMENTS.md`).
- Exported float16 `.tflite` model is `< 10 MB` and its test accuracy is within `1.0` percentage point of the Keras checkpoint.
- `ml/models/coffee/registry.json` and the shared preprocessing fixture are committed and verified by automated tests.

---

## Phase 3: App Shell & Design System
**Milestone:** `MVP`

### Tasks
- [ ] Initialize the Expo SDK Android application in `app/` (`com.keylorpineda.healthycrop`) using Expo Router, TypeScript strict, NativeWind, Reanimated, Gesture Handler, `expo-haptics`, `expo-image`, Zustand, and `i18next` (`es` default, `en` secondary); pin and document all native package versions in `docs/ARCHITECTURE.md`.
- [ ] Build the agricultural design token system in `app/src/theme/` (deep leaf greens, soil/coffee browns, crop accents for coffee/cacao/banana, light/dark themes, typography scale, spacing, radii, elevation, and reduced-motion-aware animation tokens).
- [ ] Build and unit-test the reusable UI component library in `app/src/components/ui/`: `Button` (press-in scale `0.97` + spring release), `Card`, `Chip` (spring + crop color morph), `Badge`, `Sheet`, `Toast`, `Skeleton`, `EmptyState`, and `ProgressMeter` (WCAG AA contrast, touch targets >= `48 dp`, accessibility labels).
- [ ] Implement the Onboarding screen (3 slides + mandatory non-replacement agronomic disclaimer), Home screen (camera-first layout with primary Scan CTA, crop selector chips, recent scans placeholder, offline/sync status pill), and Settings screen (language switcher `es`/`en`, light/dark theme toggle, account status placeholder, About screen with dataset credits and model versions).
- [ ] Build and verify the development build on a physical Android phone.

### Done when
- Design tokens (`app/src/theme/`) and all 9 UI components (`app/src/components/ui/`) pass Jest + React Native Testing Library tests with zero one-off inline style overrides.
- Onboarding, Home, and Settings screens work in both Spanish (`es`) and English (`en`) and light/dark themes on a physical Android phone.

---

## Phase 4: Camera, Inference & Offline History
**Milestone:** `MVP`

### Tasks
- [ ] Implement the on-device inference pipeline in `app/src/ml/`: `expo-camera` / `expo-image-picker` -> `expo-image-manipulator` (`224x224` resize) -> `jpeg-js` raw RGB decoding -> training normalization -> `react-native-fast-tflite` execution with bundled `registry.json`.
- [ ] Write a Jest test verifying `app/src/ml/` preprocessing against the shared Python fixture from Phase 2 (exact tensor parity within floating-point tolerance).
- [ ] Implement crop-specific photo tips sheet before the first scan of each crop, Camera screen (framing guide pulse, shutter flash + light haptic, gallery picker), and Analyzing screen (scan-line sweep animation).
- [ ] Implement the Result screen: hero photo, severity eased progress meter, confidence count-up, status badge (`healthy` / `watch` / `act now`) with pop-in + matching haptic, low-confidence retake state (`"low confidence — retake the photo"`), local summary + next steps, and agronomic disclaimer.
- [ ] Implement `expo-sqlite` persistence for farms, plots, scans, and sync queue (`client_uuid`, `sync_status`), plus History screen (crop/status/farm filters, staggered entrance, swipe-to-delete with undo toast, pull-to-refresh), Scan Detail screen (card-to-detail transition), and Farms & Plots management screens.

### Done when
- Shared preprocessing fixture test passes in both `ml/` (`pytest`) and `app/` (`jest`).
- A coffee leaf photo captured or picked from gallery on a physical Android phone in airplane mode is diagnosed on-device, displays the animated Result screen, and persists in `expo-sqlite` across app restarts with working History and Farms/Plots management.

---

## Phase 5: Cacao & Banana Models
**Milestone:** `MVP`

### Tasks
- [ ] Verify dataset licenses for **CocoaMoniliaDataSet** (Zenodo `10.5281/zenodo.17156051`), **UNAB cocoa diseases** (Kaggle `serranosebas/enfermedades-cacao-yolov4`), **Banana Leaves Imagery** (NM-AIST DSpace `20.500.12479/3003` / DOI `10.1038/s41597-025-04456-4`), and **BananaLSD** (Mendeley `9tb7k297ff`); update `docs/DATASETS.md`. Stop and ask user if any license is unclear.
- [ ] Implement download and preparation scripts (`download_*.py`, `prepare_cacao.py` with YOLO bounding-box pod cropping, `prepare_banana.py`, `ml/configs/cacao.yaml`, `ml/configs/banana.yaml`) with perceptual-hash deduplication and grouped `70/15/15` splits (`seed=42`); generate `docs/data_reports/cacao.md` and `docs/data_reports/banana.md`.
- [ ] Train baseline (frozen) and fine-tuned `MobileNetV3-Large` models for cacao (`healthy`, `monilia` by stage, `black_pod`) and banana (`healthy`, `black_sigatoka`, `fusarium_wilt`); log metrics, confusion matrices, and Grad-CAM samples in `docs/EXPERIMENTS.md` and `docs/MODEL_CARD.md`.
- [ ] Export float16 TFLite models (`< 10 MB` each, accuracy within `1 pp` of Keras), create `ml/models/cacao/registry.json` and `ml/models/banana/registry.json`, bundle all 3 crop models into `app/`, and enable cacao and banana selection in the app UI.

### Done when
- Cacao and banana data reports, experiment logs, Grad-CAM samples, and model card sections are complete.
- Both float16 `.tflite` models (`< 10 MB`, within `1 pp` of Keras accuracy) are bundled in `app/`, and all 3 crops (Coffee, Cacao, Banana) can be selected and diagnosed offline on a physical Android phone.

---

## Phase 6: API, Auth & Sync
**Milestone:** `MVP`

### Tasks
- [ ] Implement FastAPI application structure in `api/` (`GET /health`, Pydantic v2 schemas, `slowapi` rate limiting, structured error handling, CORS) and deployable Firestore security rules (`firestore.rules`) denying all direct client reads/writes.
- [ ] Implement Firebase ID token verification dependency via `firebase-admin` (required on every endpoint except `GET /health`) and Firestore repository layer (`users`, `farms`, `plots`, `scans` collections, every document tagged and filtered by `ownerUid`).
- [ ] Implement `CRUD /farms`, `CRUD /plots`, idempotent batch `POST /scans/sync` (by client UUID), `GET /scans`, and signed Cloudinary upload parameter generation (`max 1280 px`, scoped to `users/{uid}/scans`).
- [ ] Write comprehensive `pytest + httpx` tests in `api/tests/`, including the multi-tenant isolation test proving User A cannot read, modify, or delete User B's farms, plots, or scans.
- [ ] Integrate Firebase Auth (email/password sign-up, sign-in, sign-out) and background/manual sync in `app/` using TanStack Query + `expo-sqlite` sync state (`sync pulse -> checkmark morph`), keeping offline diagnosis fully functional without an account.

### Done when
- All `api/` endpoints pass `pytest + httpx`, `ruff`, and `mypy`, including the User A vs. User B isolation test and idempotent re-sync test.
- User can sign up/sign in on the Android app, create farms/plots, upload compressed scan photos via signed Cloudinary params, and sync offline scans idempotently to the API.

---

## Phase 7: Gemini RAG Explanations
**Milestone:** `MVP`

### Tasks
- [ ] Implement `api/scripts/build_rag_index.py` to fetch public technical documents per crop (ICAFE for coffee; official public agricultural institutions for cacao and banana), chunk with section metadata, and build a local vector/embedding index at build time without committing restricted source PDFs.
- [ ] Implement `POST /explanations` in `api/` using `google-genai` (`GEMINI_MODEL` env var, free-tier Flash model): retrieve relevant sections for `(crop, class, severity)`, generate plain-Spanish (or English per request locale) explanation + actionable next steps citing source and section, and explicitly decline when a topic is not covered by the retrieved documents.
- [ ] Enforce strict privacy, caching, and rate limiting on `POST /explanations`: strip/forbid user names, emails, or GPS coordinates in prompts; cache responses by `(crop, class, severity, language)`; enforce `20 requests/user/hour` via `slowapi`.
- [ ] Connect the app's Result and Scan Detail screens to display cached or freshly fetched RAG explanations with cited sources when online, and graceful offline fallback when disconnected.

### Done when
- `POST /explanations` returns grounded explanations citing specific document titles and sections, declines out-of-scope queries in automated tests, never transmits PII/coordinates, caches by `(crop, class, severity, language)`, and enforces the `20/hour` per-user limit.
- App Result and Scan Detail screens render the cited AI explanation and next steps alongside the agronomic disclaimer.

---

## Phase 8: Testing, Field Validation & v1.0.0
**Milestone:** `MVP`

### Tasks
- [ ] Execute the Costa Rican field validation protocol across coffee, cacao, and banana photos and record the full results table, lighting/angle breakdown, and failure analysis in `docs/FIELD_VALIDATION.md`.
- [ ] Finalize `README.md` with real metrics tables, confusion matrices, Grad-CAM samples, app screenshots/demo GIF, and Render deployment verification.
- [ ] Run full end-to-end regression across `app/`, `api/`, and `ml/`; verify coverage and accessibility (WCAG AA contrast, `>= 48 dp` touch targets, TalkBack labels, reduced motion).
- [ ] Tag `v1.0.0`, trigger `.github/workflows/release.yml`, and publish the GitHub Release containing `CHANGELOG.md` notes, the installable Android `.apk`, and the three `.tflite` models + `registry.json` files.

### Done when
- `ci.yml` is green across all suites, `docs/FIELD_VALIDATION.md` and `README.md` are complete with real evaluation artifacts, and GitHub Release `v1.0.0` is live with the signed/installable APK and `.tflite` models attached.

---

## Post-MVP Roadmap (Epics)

### Milestone `v1.1`
- [ ] **Google Sign-In Integration**: Add native Google OAuth sign-in alongside email/password in Firebase Auth and the Android client.
- [ ] **OpenStreetMap Plot Map with Disease Hotspots**: Interactive offline-capable plot boundary and scan hotspot visualization using OpenStreetMap tiles.
- [ ] **Open-Meteo Weather Risk Alerts**: Conservative, rule-based microclimate disease risk estimates using Open-Meteo historical/forecast humidity, temperature, and precipitation data (with non-commercial `CC BY 4.0` attribution and clear estimation disclaimers).

### Milestone `v1.2`
- [ ] **Earth Engine Sentinel-2 NDVI per Plot**: Monthly cloud-masked Sentinel-2 NDVI time series per plot via Google Earth Engine noncommercial Community tier in `api/` (service-account credentials strictly outside Git).
- [ ] **Additional Costa Rican Crops**: Expand the `ml/` pipeline and `app/` model registry to support additional regional crops.
