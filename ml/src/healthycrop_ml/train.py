"""Training and evaluation pipeline for MobileNetV3-Large crop disease models."""

from __future__ import annotations

import argparse
import csv
import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

from healthycrop_ml.config import CropConfig, load_crop_config
from healthycrop_ml.evaluate import (
    EvaluationMetrics,
    compute_balanced_class_weights,
    evaluate_predictions,
    render_confusion_matrix_png,
)
from healthycrop_ml.model import build_mobilenetv3_classifier, configure_backbone_trainability
from healthycrop_ml.preprocess import image_to_normalized_tensor


@dataclass(frozen=True)
class SplitDataset:
    """In-memory normalized tensor array and integer class indices for a split."""

    x: np.ndarray
    y: np.ndarray
    paths: tuple[str, ...]


def load_split_arrays(
    manifest_csv: Path,
    processed_dir: Path,
    split_name: str,
    classes: tuple[str, ...],
    mean: tuple[float, float, float] = (127.5, 127.5, 127.5),
    std: tuple[float, float, float] = (127.5, 127.5, 127.5),
) -> SplitDataset:
    """Load all images for `split_name` from `manifest.csv` into normalized float32 arrays."""
    class_to_idx = {cls_name: idx for idx, cls_name in enumerate(classes)}
    tensors: list[np.ndarray] = []
    labels: list[int] = []
    paths: list[str] = []

    with manifest_csv.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            if row["split"].strip() != split_name:
                continue
            label_str = row["label"].strip()
            if label_str not in class_to_idx:
                continue
            rel_path = row["path"].strip()
            img_path = processed_dir / rel_path
            with Image.open(img_path) as img:
                rgb_img = img.convert("RGB")
                tensor = image_to_normalized_tensor(rgb_img, mean=mean, std=std)
            tensors.append(tensor)
            labels.append(class_to_idx[label_str])
            paths.append(rel_path)

    if not tensors:
        raise ValueError(f"No samples found for split '{split_name}' in {manifest_csv}")

    x_arr = np.stack(tensors, axis=0).astype(np.float32)
    y_arr = np.asarray(labels, dtype=np.int32)
    return SplitDataset(x=x_arr, y=y_arr, paths=tuple(paths))


def predict_class_indices(model: Any, x: np.ndarray, batch_size: int = 32) -> np.ndarray:
    """Run batch inference and return predicted integer class indices."""
    probs = np.asarray(model.predict(x, batch_size=batch_size, verbose=0), dtype=np.float32)
    return np.argmax(probs, axis=-1).astype(np.int32)


def _augment_normalized_batch(x: np.ndarray, seed: int = 42) -> np.ndarray:
    """Create a deterministic augmented view (flip + 90-deg rotation + contrast/brightness)."""
    rng = np.random.default_rng(seed)
    aug = np.copy(x)
    # Horizontal flip for 50%, vertical flip for 50%
    for idx in range(len(aug)):
        if rng.random() < 0.5:
            aug[idx] = aug[idx, :, ::-1, :]
        if rng.random() < 0.5:
            aug[idx] = aug[idx, ::-1, :, :]
        # Mild brightness/contrast jitter within [-1.0, 1.0]
        contrast = float(rng.uniform(0.92, 1.08))
        brightness = float(rng.uniform(-0.05, 0.05))
        aug[idx] = np.clip(aug[idx] * contrast + brightness, -1.0, 1.0)
    return aug


def run_training_pipeline(
    cfg: CropConfig,
    processed_dir: Path,
    run_id: str,
    head_epochs: int = 25,
    head_lr: float = 2e-3,
    fine_tune_epochs: int = 0,
    fine_tune_lr: float = 1e-4,
    fine_tune_top_layers: int = 0,
    batch_size: int = 64,
    patience: int = 6,
    weights: str | None = "imagenet",
    checkpoint_out: Path | None = None,
    confusion_png_out: Path | None = None,
    metrics_json_out: Path | None = None,
) -> dict[str, Any]:
    """Train MobileNetV3-Large (frozen head warm-up + optional top-layer fine-tuning)."""
    import keras
    from keras import layers

    keras.utils.set_random_seed(cfg.seed)
    manifest_csv = processed_dir / "manifest.csv"

    print(f"[{run_id}] Loading preprocessed splits from {manifest_csv}...")
    train_ds = load_split_arrays(
        manifest_csv, processed_dir, "train", cfg.classes, cfg.mean, cfg.std
    )
    val_ds = load_split_arrays(manifest_csv, processed_dir, "val", cfg.classes, cfg.mean, cfg.std)
    test_ds = load_split_arrays(manifest_csv, processed_dir, "test", cfg.classes, cfg.mean, cfg.std)
    print(f"[{run_id}] Loaded train={len(train_ds.y)}, val={len(val_ds.y)}, test={len(test_ds.y)}")

    model = build_mobilenetv3_classifier(
        num_classes=len(cfg.classes),
        image_size=cfg.image_size,
        weights=weights,
        dropout_rate=0.25,
        learning_rate=head_lr,
        fine_tune_top_layers=0,
        use_augmentation=True,
    )

    backbone_layer: Any = None
    for layer in model.layers:
        if hasattr(layer, "layers") and len(layer.layers) > 10:
            backbone_layer = layer
            break

    best_val_f1 = -1.0
    best_weights = model.get_weights()
    epoch_history: list[dict[str, Any]] = []
    start_time = time.time()

    if head_epochs > 0 and backbone_layer is not None:
        print(f"[{run_id}] Extracting frozen MobileNetV3-Large features for fast head training...")
        aug_x = _augment_normalized_batch(train_ds.x, seed=cfg.seed)
        x_train_combined = np.concatenate([train_ds.x, aug_x], axis=0)
        y_train_combined = np.concatenate([train_ds.y, train_ds.y], axis=0)

        train_feats = np.asarray(
            backbone_layer.predict(x_train_combined, batch_size=batch_size, verbose=0),
            dtype=np.float32,
        )
        val_feats = np.asarray(
            backbone_layer.predict(val_ds.x, batch_size=batch_size, verbose=0),
            dtype=np.float32,
        )

        feat_dim = int(train_feats.shape[-1])
        head_in = keras.Input(shape=(feat_dim,), dtype="float32")
        head_norm_layer = layers.LayerNormalization(name="head_norm")
        head_drop_layer = layers.Dropout(0.25, name="head_dropout")
        head_dense_layer = layers.Dense(
            len(cfg.classes),
            activation="softmax",
            kernel_regularizer=keras.regularizers.L2(1e-4),
            name="class_probs",
        )
        head_out = head_dense_layer(head_drop_layer(head_norm_layer(head_in)))
        head_model = keras.Model(inputs=head_in, outputs=head_out)
        head_model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=head_lr),
            loss=keras.losses.SparseCategoricalCrossentropy(),
            metrics=[keras.metrics.SparseCategoricalAccuracy(name="accuracy")],
        )

        class_weights = compute_balanced_class_weights(
            y_train_combined.tolist(), num_classes=len(cfg.classes)
        )

        best_head_weights = head_model.get_weights()
        wait = 0
        for epoch in range(1, head_epochs + 1):
            hist = head_model.fit(
                train_feats,
                y_train_combined,
                batch_size=batch_size,
                epochs=1,
                class_weight=class_weights,
                verbose=0,
            )
            train_loss = float(hist.history["loss"][0])
            train_acc = float(hist.history["accuracy"][0])

            val_preds = predict_class_indices(head_model, val_feats, batch_size=batch_size)
            val_eval = evaluate_predictions(val_ds.y.tolist(), val_preds.tolist(), cfg.classes)

            if val_eval.macro_f1 > best_val_f1 + 1e-5:
                best_val_f1 = val_eval.macro_f1
                best_head_weights = head_model.get_weights()
                wait = 0
            else:
                wait += 1

            epoch_history.append(
                {
                    "stage": "frozen_head",
                    "epoch": epoch,
                    "train_loss": round(train_loss, 4),
                    "train_acc": round(train_acc, 4),
                    "val_acc": round(val_eval.accuracy, 4),
                    "val_macro_f1": round(val_eval.macro_f1, 4),
                    "best_val_macro_f1": round(best_val_f1, 4),
                }
            )
            print(
                f"[{run_id}][frozen_head E{epoch:02d}/{head_epochs:02d}] "
                f"train_loss={train_loss:.4f} train_acc={train_acc:.4f} "
                f"val_acc={val_eval.accuracy:.4f} val_macro_f1={val_eval.macro_f1:.4f} "
                f"(best={best_val_f1:.4f})"
            )
            if wait >= patience:
                print(
                    f"[{run_id}][frozen_head] Early stopping triggered at epoch {epoch} "
                    f"(patience={patience})."
                )
                break

        head_model.set_weights(best_head_weights)
        model.get_layer("head_norm").set_weights(head_norm_layer.get_weights())
        model.get_layer("class_probs").set_weights(head_dense_layer.get_weights())
        best_weights = model.get_weights()

    if fine_tune_epochs > 0 and fine_tune_top_layers > 0 and backbone_layer is not None:
        configure_backbone_trainability(backbone_layer, fine_tune_top_layers=fine_tune_top_layers)
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=fine_tune_lr),
            loss=keras.losses.SparseCategoricalCrossentropy(),
            metrics=[keras.metrics.SparseCategoricalAccuracy(name="accuracy")],
        )
        ft_weights = compute_balanced_class_weights(
            train_ds.y.tolist(), num_classes=len(cfg.classes)
        )
        wait = 0
        for epoch in range(1, fine_tune_epochs + 1):
            hist = model.fit(
                train_ds.x,
                train_ds.y,
                batch_size=32,
                epochs=1,
                class_weight=ft_weights,
                verbose=0,
            )
            train_loss = float(hist.history["loss"][0])
            train_acc = float(hist.history["accuracy"][0])

            val_preds = predict_class_indices(model, val_ds.x, batch_size=32)
            val_eval = evaluate_predictions(val_ds.y.tolist(), val_preds.tolist(), cfg.classes)

            if val_eval.macro_f1 > best_val_f1 + 1e-5:
                best_val_f1 = val_eval.macro_f1
                best_weights = model.get_weights()
                wait = 0
            else:
                wait += 1

            epoch_history.append(
                {
                    "stage": "fine_tune",
                    "epoch": epoch,
                    "train_loss": round(train_loss, 4),
                    "train_acc": round(train_acc, 4),
                    "val_acc": round(val_eval.accuracy, 4),
                    "val_macro_f1": round(val_eval.macro_f1, 4),
                    "best_val_macro_f1": round(best_val_f1, 4),
                }
            )
            print(
                f"[{run_id}][fine_tune E{epoch:02d}/{fine_tune_epochs:02d}] "
                f"train_loss={train_loss:.4f} train_acc={train_acc:.4f} "
                f"val_acc={val_eval.accuracy:.4f} val_macro_f1={val_eval.macro_f1:.4f} "
                f"(best={best_val_f1:.4f})"
            )
            if wait >= patience:
                print(
                    f"[{run_id}][fine_tune] Early stopping triggered at epoch {epoch} "
                    f"(patience={patience})."
                )
                break

        model.set_weights(best_weights)

    elapsed_sec = round(time.time() - start_time, 2)

    val_preds = predict_class_indices(model, val_ds.x, batch_size=batch_size)
    val_metrics: EvaluationMetrics = evaluate_predictions(
        val_ds.y.tolist(), val_preds.tolist(), cfg.classes
    )

    test_preds = predict_class_indices(model, test_ds.x, batch_size=batch_size)
    test_metrics: EvaluationMetrics = evaluate_predictions(
        test_ds.y.tolist(), test_preds.tolist(), cfg.classes
    )

    print(
        f"[{run_id}] Final Best Checkpoint -> "
        f"val_macro_f1={val_metrics.macro_f1:.4f}, "
        f"test_acc={test_metrics.accuracy:.4f}, test_macro_f1={test_metrics.macro_f1:.4f}"
    )

    if checkpoint_out is not None:
        checkpoint_out.parent.mkdir(parents=True, exist_ok=True)
        model.save(checkpoint_out)
        print(f"[{run_id}] Saved Keras checkpoint to {checkpoint_out}")

    if confusion_png_out is not None:
        render_confusion_matrix_png(
            confusion=test_metrics.confusion_matrix,
            classes=cfg.classes,
            title=f"HealthyCrop — {cfg.crop.title()} Test Confusion Matrix ({run_id})",
            output_png=confusion_png_out,
        )
        print(f"[{run_id}] Saved confusion matrix PNG to {confusion_png_out}")

    result_payload: dict[str, Any] = {
        "run_id": run_id,
        "crop": cfg.crop,
        "seed": cfg.seed,
        "head_epochs": head_epochs,
        "head_lr": head_lr,
        "fine_tune_epochs": fine_tune_epochs,
        "fine_tune_lr": fine_tune_lr,
        "fine_tune_top_layers": fine_tune_top_layers,
        "batch_size": batch_size,
        "patience": patience,
        "elapsed_seconds": elapsed_sec,
        "val_metrics": val_metrics.to_dict(),
        "test_metrics": test_metrics.to_dict(),
        "epoch_history": epoch_history,
    }

    if metrics_json_out is not None:
        metrics_json_out.parent.mkdir(parents=True, exist_ok=True)
        metrics_json_out.write_text(json.dumps(result_payload, indent=2) + "\n", encoding="utf-8")
        print(f"[{run_id}] Saved metrics JSON to {metrics_json_out}")

    return result_payload


def main(argv: list[str] | None = None) -> int:
    """CLI entrypoint for training a crop disease model."""
    repo_root = Path(__file__).resolve().parents[3]
    parser = argparse.ArgumentParser(description="Train MobileNetV3-Large crop disease model.")
    parser.add_argument(
        "--config",
        type=Path,
        default=repo_root / "ml" / "configs" / "coffee.yaml",
        help="Path to crop YAML config.",
    )
    parser.add_argument(
        "--processed-dir",
        type=Path,
        default=repo_root / "ml" / "data" / "processed" / "coffee",
        help="Path to processed crop dataset directory.",
    )
    parser.add_argument(
        "--run-id",
        type=str,
        default="coffee-v0.1.0-baseline",
        help="Unique experiment run identifier.",
    )
    parser.add_argument("--head-epochs", type=int, default=35)
    parser.add_argument("--head-lr", type=float, default=2e-3)
    parser.add_argument("--fine-tune-epochs", type=int, default=0)
    parser.add_argument("--fine-tune-lr", type=float, default=1e-4)
    parser.add_argument("--fine-tune-top-layers", type=int, default=0)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--patience", type=int, default=8)
    parser.add_argument(
        "--checkpoint-out",
        type=Path,
        default=repo_root / "ml" / "models" / "coffee" / "coffee_baseline.keras",
    )
    parser.add_argument(
        "--confusion-out",
        type=Path,
        default=repo_root / "docs" / "assets" / "confusion_matrices" / "coffee_baseline.png",
    )
    parser.add_argument(
        "--metrics-out",
        type=Path,
        default=repo_root / "ml" / "data" / "processed" / "coffee" / "baseline_metrics.json",
    )
    args = parser.parse_args(argv)

    cfg = load_crop_config(args.config)
    run_training_pipeline(
        cfg=cfg,
        processed_dir=args.processed_dir,
        run_id=args.run_id,
        head_epochs=args.head_epochs,
        head_lr=args.head_lr,
        fine_tune_epochs=args.fine_tune_epochs,
        fine_tune_lr=args.fine_tune_lr,
        fine_tune_top_layers=args.fine_tune_top_layers,
        batch_size=args.batch_size,
        patience=args.patience,
        weights="imagenet",
        checkpoint_out=args.checkpoint_out,
        confusion_png_out=args.confusion_out,
        metrics_json_out=args.metrics_out,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
