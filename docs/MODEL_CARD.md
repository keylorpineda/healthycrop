# HealthyCrop — Model Cards

This document provides the Model Cards (following Mitchell et al., 2019) for the three on-device TensorFlow Lite crop disease classification models shipped with **HealthyCrop**.

> [!WARNING]
> **Agronomic Decision-Support Disclaimer**: These models are intended solely for preliminary field decision support in Costa Rica and comparable tropical agroecosystems. They **do not replace a certified agronomist** or laboratory phytosanitary diagnosis. Visual symptoms of fungal, bacterial, viral, pest, and nutritional disorders can overlap. Never apply restricted agrochemicals or eradicate trees based solely on an automated prediction.

---

## 1. Shared Architecture & Export Specification

- **Developer / Author**: Keylor Pineda (`@keylorpineda`)
- **Backbone Architecture**: `MobileNetV3-Large` pretrained on ImageNet-1K (`include_top=False`), global average pooling, dropout, and crop-specific classification head.
- **Training Strategy**:
  1. **Stage 1 (Baseline / Head Warm-up)**: Freeze `MobileNetV3-Large` backbone; train classification head with class weights and online data augmentation (random horizontal/vertical flips, rotation, brightness/contrast jitter, crop/zoom).
  2. **Stage 2 (Fine-Tuning)**: Unfreeze top feature-extraction blocks at a reduced learning rate with early stopping monitored on **validation macro-F1**.
- **Input Specification**: `224 x 224 x 3` RGB tensor, EXIF-transposed before resize, normalized identically in Python (`ml/`) and React Native (`app/src/ml/`).
- **Export Target**: Float16 quantized `.tflite` (`< 10 MB` per model), verified within `<= 1.0` percentage point of Keras test accuracy.
- **Abstention / Low-Confidence Handling**: Each model defines a calibrated confidence threshold in `ml/models/<crop>/registry.json` selected on the validation split. Predictions below this threshold trigger the UI warning `"low confidence — retake the photo"` rather than an actionable diagnosis.

---

## 2. Coffee Leaf Model (`coffee`)

### 2.1 Overview
- **Model Identifier**: `coffee-v1.0.0` *(populated in Phase 2)*
- **Registry File**: `ml/models/coffee/registry.json`
- **Target Plant Organ**: Coffee leaf (*Coffea arabica* and *Coffea canephora*), underside preferred for early orange rust urediniospore detection.
- **Classes**:
  1. `healthy`
  2. `leaf_rust` (*Hemileia vastatrix*, with severity estimation)
  3. `leaf_miner` (*Leucoptera coffeella*)
  4. `cercospora` (*Cercospora coffeicola* / iron spot)
  5. `brown_leaf_spot` (*Phoma* / *Ascochyta* spp.)
  6. `red_spider_mite` (*Oligonychus yothersi*) *(final class list confirmed after Phase 1 `< 50` training image check)*

### 2.2 Training & Evaluation Data
- **Sources**: RoCoLe (Mendeley DOI `10.17632/c5yvn32dzg.2`) and BRACOL whole-leaf subset (Mendeley `yy2k5y8mxg`).
- **Split**: `70%` train / `15%` validation / `15%` test, grouped by plant (`group_id`), stratified by class (`seed=42`), perceptual-hash deduplicated.

### 2.3 Quantitative Performance *(Populated in Phase 2)*

| Metric | Keras Test Set | Float16 TFLite Test Set | Delta | Target |
| :--- | :--- | :--- | :--- | :--- |
| **Macro-F1** | *TBD (Phase 2)* | *TBD (Phase 2)* | *TBD* | `>= 0.80` |
| **Accuracy** | *TBD (Phase 2)* | *TBD (Phase 2)* | `<= 1.0 pp` | Within `1 pp` |
| **Model Size** | — | *TBD (Phase 2)* | — | `< 10 MB` |
| **Confidence Threshold** | — | *TBD (Phase 2)* | — | Validation-calibrated |

### 2.4 Interpretability (Grad-CAM)
- Representative Grad-CAM heatmaps per class (`docs/assets/gradcam/coffee_*.png`) are generated in Phase 2 to verify that the model attends to leaf lesions rather than background soil or fingers.

---

## 3. Cacao Pod Model (`cacao`)

### 3.1 Overview
- **Model Identifier**: `cacao-v1.0.0` *(populated in Phase 5)*
- **Registry File**: `ml/models/cacao/registry.json`
- **Target Plant Organ**: Cacao pod / fruit (*Theobroma cacao*) attached to tree or freshly harvested.
- **Classes**:
  1. `healthy` (`h0`)
  2. `monilia` (*Moniliophthora roreri*, frost/internal rot stages `m1`, `m2`, `m3`)
  3. `black_pod` (*Phytophthora palmivora* / *P. capsici*)

### 3.2 Training & Evaluation Data
- **Sources**: CocoaMoniliaDataSet (Zenodo DOI `10.5281/zenodo.17156051`) and UNAB cocoa diseases (Kaggle `serranosebas/enfermedades-cacao-yolov4`, cropped per labeled pod).
- **Split**: `70%` train / `15%` validation / `15%` test, grouped by parent photograph/pod (`group_id`), stratified by class (`seed=42`).

### 3.3 Quantitative Performance *(Populated in Phase 5)*

| Metric | Keras Test Set | Float16 TFLite Test Set | Delta | Target |
| :--- | :--- | :--- | :--- | :--- |
| **Macro-F1** | *TBD (Phase 5)* | *TBD (Phase 5)* | *TBD* | `>= 0.80` |
| **Accuracy** | *TBD (Phase 5)* | *TBD (Phase 5)* | `<= 1.0 pp` | Within `1 pp` |
| **Model Size** | — | *TBD (Phase 5)* | — | `< 10 MB` |
| **Confidence Threshold** | — | *TBD (Phase 5)* | — | Validation-calibrated |

### 3.4 Interpretability (Grad-CAM)
- Representative Grad-CAM heatmaps per class (`docs/assets/gradcam/cacao_*.png`) are generated in Phase 5.

---

## 4. Banana Leaf Model (`banana`)

### 4.1 Overview
- **Model Identifier**: `banana-v1.0.0` *(populated in Phase 5)*
- **Registry File**: `ml/models/banana/registry.json`
- **Target Plant Organ**: Banana leaf (*Musa* spp.).
- **Classes**:
  1. `healthy`
  2. `black_sigatoka` (*Pseudocercospora fijiensis* / *Mycosphaerella fijiensis*)
  3. `fusarium_wilt` (*Fusarium oxysporum* f. sp. *cubense*)

### 4.2 Training & Evaluation Data
- **Sources**: Banana Leaves Imagery (NM-AIST DSpace `20.500.12479/3003`, DOI `10.1038/s41597-025-04456-4`) and mapped classes from BananaLSD (Mendeley `9tb7k297ff`).
- **Split**: `70%` train / `15%` validation / `15%` test, grouped by `group_id`, stratified by class (`seed=42`).

### 4.3 Quantitative Performance *(Populated in Phase 5)*

| Metric | Keras Test Set | Float16 TFLite Test Set | Delta | Target |
| :--- | :--- | :--- | :--- | :--- |
| **Macro-F1** | *TBD (Phase 5)* | *TBD (Phase 5)* | *TBD* | `>= 0.80` |
| **Accuracy** | *TBD (Phase 5)* | *TBD (Phase 5)* | `<= 1.0 pp` | Within `1 pp` |
| **Model Size** | — | *TBD (Phase 5)* | — | `< 10 MB` |
| **Confidence Threshold** | — | *TBD (Phase 5)* | — | Validation-calibrated |

### 4.4 Interpretability (Grad-CAM)
- Representative Grad-CAM heatmaps per class (`docs/assets/gradcam/banana_*.png`) are generated in Phase 5.

---

## 5. Known Limitations & Out-of-Scope Inputs

1. **Out-of-Distribution Inputs**: Scanning non-plant objects, stems/roots, unsupported crops, or multiple overlapping leaves degrades confidence and may trigger false positives if above the confidence threshold.
2. **Illumination & Moisture**: Specular glare from wet leaves/pods after tropical rain or harsh midday shadows can obscure chlorotic halos or early spore pustules.
3. **Co-Infections & Nutrient Deficiencies**: A single leaf may exhibit both fungal infection (e.g., *Cercospora*) and micronutrient deficiency (nitrogen/magnesium chlorosis); single-label classification predicts the dominant visual pattern.
