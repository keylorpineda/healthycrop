"""Unit tests for cacao MobileNetV3-Large training CLI and configuration."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from healthycrop_ml.config import load_crop_config
from healthycrop_ml.model import build_mobilenetv3_classifier


def test_cacao_config_and_model_head_shape() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    cfg = load_crop_config(repo_root / "ml" / "configs" / "cacao.yaml")
    assert cfg.crop == "cacao"
    assert cfg.classes == ("healthy", "monilia", "black_pod")

    model = build_mobilenetv3_classifier(
        num_classes=len(cfg.classes),
        image_size=cfg.image_size,
        weights=None,
    )
    assert model.output_shape == (None, 3)


def test_train_cacao_cli_defaults(monkeypatch: Any) -> None:
    import sys

    scripts_dir = str(Path(__file__).resolve().parents[1] / "scripts")
    if scripts_dir not in sys.path:
        sys.path.insert(0, scripts_dir)
    import train_cacao

    captured: list[str] = []

    def fake_main(argv: list[str] | None = None) -> int:
        if argv is not None:
            captured.extend(argv)
        return 0

    monkeypatch.setattr(train_cacao, "main", fake_main)
    rc = train_cacao.run_cacao_cli(["--head-epochs", "5"])
    assert rc == 0
    assert "--config" in captured
    assert "--run-id" in captured
    assert "cacao-v0.1.0-baseline" in captured
