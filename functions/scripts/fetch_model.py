"""Downloads the pretrained image model the duplicate check uses, ready for Cloud Functions.

MobileNetV2 (ImageNet-pretrained) from the ONNX Model Zoo, cut at its global average pool so it
returns a 1280-number embedding per photo instead of 1000 class scores. Similar-looking photos
get embeddings that point the same way, which `embedding.py` measures with cosine similarity.

Run once before testing or deploying (needs the `onnx` package from requirements-dev.txt):

    venv/Scripts/python scripts/fetch_model.py
"""

import hashlib
import sys
import urllib.request
from pathlib import Path

import onnx

MODEL_URL = (
    "https://github.com/onnx/models/raw/main/validated/vision/classification/"
    "mobilenet/model/mobilenetv2-12.onnx"
)
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
OUTPUT = MODELS_DIR / "mobilenetv2-embedding.onnx"


def main() -> int:
    MODELS_DIR.mkdir(exist_ok=True)
    print(f"Downloading {MODEL_URL}")
    with urllib.request.urlopen(MODEL_URL, timeout=120) as response:
        data = response.read()
    print(f"  {len(data) / 1e6:.1f} MB, sha256 {hashlib.sha256(data).hexdigest()[:16]}…")

    # Shape inference fills in the intermediate tensor types the extractor needs.
    model = onnx.shape_inference.infer_shapes(onnx.load_from_string(data))
    graph = model.graph
    pools = [n for n in graph.node if n.op_type == "GlobalAveragePool"]
    if not pools:
        print("No GlobalAveragePool node found; the model layout changed.", file=sys.stderr)
        return 1
    pooled = pools[-1].output[0]

    # Keep only the nodes needed for the pooled features, and make them the only output.
    extracted = onnx.utils.Extractor(model).extract_model(
        [i.name for i in graph.input if i.name not in {t.name for t in graph.initializer}],
        [pooled],
    )
    onnx.checker.check_model(extracted)
    onnx.save(extracted, OUTPUT)
    print(f"Saved {OUTPUT} (output '{pooled}')")
    return 0


if __name__ == "__main__":
    sys.exit(main())
