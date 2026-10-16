"""Image integrity verification, EXIF orientation correction, RGB conversion, and resizing."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError


@dataclass(frozen=True)
class CandidateSample:
    """A raw dataset sample prior to deduplication and splitting."""

    raw_path: Path
    label: str
    severity: str
    source: str
    group_id: str
    sample_id: str


def load_clean_rgb_image(path: Path, image_size: int = 224) -> Image.Image | None:
    """Load an image, fix EXIF orientation, convert to 3-channel RGB, and resize to `image_size`.

    Returns `None` if the image file is missing, truncated, or corrupt.
    """
    if not path.is_file():
        return None
    try:
        with Image.open(path) as img:
            img.load()
            transposed = ImageOps.exif_transpose(img)
            rgb = transposed.convert("RGB")
            if rgb.size != (image_size, image_size):
                rgb = rgb.resize((image_size, image_size), resample=Image.Resampling.BILINEAR)
            return rgb
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError):
        return None
