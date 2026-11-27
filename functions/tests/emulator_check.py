"""End-to-end check of the Cloud Functions in the local emulators. From the repo root:

    pnpm test:functions

Writes two reports of the same pothole (with photos) and one unrelated report, then checks
that the functions embedded the photos, scored photo similarity, and scored priority.
"""

import base64
import io
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from google.auth.credentials import AnonymousCredentials  # noqa: E402
from google.cloud import firestore  # noqa: E402

from test_logic import jpeg, pothole, streetlight  # noqa: E402

assert os.environ.get("FIRESTORE_EMULATOR_HOST"), "Run inside `firebase emulators:exec`."
# The emulator needs no real credentials.
db = firestore.Client(
    project=os.environ.get("GCLOUD_PROJECT", "demo-ayos"), credentials=AnonymousCredentials()
)
NOW = datetime.now(timezone.utc)


def data_uri(image) -> str:
    return "data:image/jpeg;base64," + base64.b64encode(jpeg(image)).decode()


def add_report(report_id, uid, image, created, **fields):
    db.collection("reports").document(report_id).set(
        {
            "reporterId": uid,
            "title": "Road damage on Gorordo Ave",
            "category": "road",
            "street": "Gorordo Ave",
            "area": "Lahug",
            "reportCount": 1,
            "status": "received",
            "danger": False,
            "description": "",
            "map": {"x": 0.44, "y": 0.53},
            "createdAt": created,
            **fields,
        }
    )
    db.collection("reports").document(report_id).collection("supporters").document(uid).set(
        {"uid": uid}
    )
    db.collection("reports").document(report_id).collection("photos").document(f"{uid}_0").set(
        {"uid": uid, "data": data_uri(image), "createdAt": created}
    )


def wait_for(description, check, timeout=90):
    deadline = time.time() + timeout
    while time.time() < deadline:
        value = check()
        if value:
            print(f"ok   {description}")
            return value
        time.sleep(1)
    print(f"FAIL {description} (waited {timeout}s)")
    sys.exit(1)


def doc(path):
    snap = db.document(path).get()
    return snap.to_dict() if snap.exists else None


add_report("AY-GROUP1", "carol", pothole(), NOW - timedelta(days=2))
wait_for("group photo embedded", lambda: doc("embeddings/AY-GROUP1"))
wait_for("group priority scored", lambda: (doc("reports/AY-GROUP1") or {}).get("priorityScore"))

add_report(
    "AY-LIGHT1", "dave", streetlight(), NOW - timedelta(days=1), map={"x": 0.4415, "y": 0.53}
)
wait_for("streetlight photo embedded", lambda: doc("embeddings/AY-LIGHT1"))
add_report("AY-NEW001", "alice", pothole(shift=15).rotate(3), NOW, map={"x": 0.4418, "y": 0.53})

scores = wait_for("photos compared", lambda: (doc("reports/AY-NEW001") or {}).get("imageScores"))
print(f"     image similarity {scores}")
assert scores.get("AY-GROUP1", 0) > 0.8, scores
# The streetlight is closer than the pothole group but looks nothing like the new pothole. Its
# score must be saved too, so the dashboard can rule it out instead of matching on location.
assert "AY-LIGHT1" in scores, scores
assert scores["AY-LIGHT1"] < scores["AY-GROUP1"], scores
print("ok   different-looking report scored lower")

before = doc("reports/AY-GROUP1")["priorityScore"]
db.document("reports/AY-GROUP1").update({"severity": 5})
wait_for(
    "priority rescored after severity change",
    lambda: (doc("reports/AY-GROUP1") or {}).get("priorityScore", before) > before,
)
print("All function checks passed.")
