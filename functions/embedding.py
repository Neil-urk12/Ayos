"""Image embeddings with a pretrained MobileNetV2 (ONNX), for comparing report photos.

The model file comes from scripts/fetch_model.py. Each photo becomes a unit-length vector of
1280 numbers; the cosine similarity of two vectors (0 = unrelated, 1 = same picture) is the
"image similarity" in the duplicate check.
"""

from __future__ import annotations

import base64
import io
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

MODEL_PATH = Path(__file__).resolve().parent / "models" / "mobilenetv2-embedding.onnx"
MODEL_NAME = "mobilenetv2-12-gap"

# ImageNet preprocessing the model was trained with.
_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
_SIZE = 224


class ModelMissingError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def _session():
    # Imported here so the scoring tests don't need onnxruntime installed.
    import onnxruntime as ort

    if not MODEL_PATH.exists():
        raise ModelMissingError(
            f"{MODEL_PATH.name} is missing. Run `python scripts/fetch_model.py` in functions/."
        )
    return ort.InferenceSession(str(MODEL_PATH), providers=["CPUExecutionProvider"])


def decode_data_uri(data_uri: str) -> bytes:
    """The bytes of a `data:image/...;base64,...` string (how the app stores photos)."""
    _, _, payload = data_uri.partition(",")
    return base64.b64decode(payload or data_uri)


def _preprocess(image_bytes: bytes) -> np.ndarray:
    image = ImageOps.exif_transpose(Image.open(io.BytesIO(image_bytes))).convert("RGB")
    # Resize the shorter side to 256, then centre-crop 224×224.
    scale = 256 / min(image.size)
    image = image.resize(
        (max(_SIZE, round(image.width * scale)), max(_SIZE, round(image.height * scale))),
        Image.BILINEAR,
    )
    left, top = (image.width - _SIZE) // 2, (image.height - _SIZE) // 2
    image = image.crop((left, top, left + _SIZE, top + _SIZE))
    pixels = (np.asarray(image, dtype=np.float32) / 255.0 - _MEAN) / _STD
    return pixels.transpose(2, 0, 1)[np.newaxis, ...]


def embed(image_bytes: bytes) -> np.ndarray:
    """Unit-length embedding of a photo."""
    session = _session()
    (features,) = session.run(None, {session.get_inputs()[0].name: _preprocess(image_bytes)})
    vector = features.reshape(-1).astype(np.float32)
    norm = float(np.linalg.norm(vector))
    return vector / norm if norm > 0 else vector


def similarity(a: np.ndarray | list[float], b: np.ndarray | list[float]) -> float:
    """Cosine similarity of two unit vectors, clamped to 0–1 for the combined score."""
    value = float(np.dot(np.asarray(a, dtype=np.float32), np.asarray(b, dtype=np.float32)))
    return min(1.0, max(0.0, value))
