# HealthyCrop — ML Experiments Log

This document records all training, hyperparameter, ablation, and quantization experiments across Phases 1, 2, and 5.

---

## 1. Experimental Protocol

- **Fixed Random Seed**: `42` across Python `random`, `numpy`, `scikit-learn` splitters, and `tensorflow`.
- **Data Split**: `70%` train / `15%` validation / `15%` test, grouped by `group_id` and stratified by class label after cross-source perceptual-hash deduplication.
- **Input Resolution**: `224 x 224 x 3` RGB.
- **Augmentation Pipeline (Train Only)**:
  - Random horizontal and vertical flips
  - Random rotation (`±15°`)
  - Random brightness and contrast adjustment (`±15%`)
  - Random zoom / crop (`85%–100%` area)
- **Imbalance Handling**: Balanced class weights computed on the `train` split (`sklearn.utils.class_weight.compute_class_weight`). Any class with `< 50` training images is evaluated for merging prior to training.
- **Primary Selection Metric**: **Validation Macro-F1** (used for early stopping and checkpoint selection).
- **Acceptance Targets**:
  - Test Macro-F1 `>= 0.80` (if `< 0.80`, document root causes, confusion pairs, and all attempted mitigations).
  - Float16 TFLite test accuracy within `<= 1.0` percentage point of the Keras checkpoint, file size `< 10 MB`.

---

## 2. Summary of Runs

| Run ID | Phase | Crop | Stage / Variant | Backbone Unfrozen Layers | LR (Head / Fine-Tune) | Epochs (Stopped) | Val Macro-F1 | Test Macro-F1 | Test Acc (Keras / TFLite) | TFLite Size | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `coffee-001` | Phase 1 | Coffee | Baseline (frozen backbone) | `0` (frozen) | `1e-3 / —` | *Pending* | *Pending* | *Pending* | *Pending* | — | Initial frozen `MobileNetV3-Large` baseline |
| `coffee-002` | Phase 2 | Coffee | Fine-tuned top blocks | *Pending* | `1e-3 / 1e-4` | *Pending* | *Pending* | *Pending* | *Pending* | *Pending* | Float16 TFLite export candidate |
| `cacao-001` | Phase 5 | Cacao | Baseline (frozen backbone) | `0` (frozen) | `1e-3 / —` | *Pending* | *Pending* | *Pending* | *Pending* | — | Initial frozen `MobileNetV3-Large` baseline |
| `cacao-002` | Phase 5 | Cacao | Fine-tuned top blocks | *Pending* | `1e-3 / 1e-4` | *Pending* | *Pending* | *Pending* | *Pending* | *Pending* | Float16 TFLite export candidate |
| `banana-001` | Phase 5 | Banana | Baseline (frozen backbone) | `0` (frozen) | `1e-3 / —` | *Pending* | *Pending* | *Pending* | *Pending* | — | Initial frozen `MobileNetV3-Large` baseline |
| `banana-002` | Phase 5 | Banana | Fine-tuned top blocks | *Pending* | `1e-3 / 1e-4` | *Pending* | *Pending* | *Pending* | *Pending* | *Pending* | Float16 TFLite export candidate |

---

## 3. Detailed Run Logs & Confusion Matrices

*(Detailed per-class precision, recall, F1 tables and links to `docs/assets/confusion_matrices/<crop>_*.png` will be appended here as Phases 1, 2, and 5 execute.)*
