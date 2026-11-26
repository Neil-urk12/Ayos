"""End-to-end check of the Cloud Functions in the local emulators. From the repo root:

    pnpm test:functions

Writes two reports of the same pothole (with photos) and one unrelated report, then checks
that the functions embedded the photos, suggested the duplicate, and scored priority.
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
add_report("AY-NEW001", "alice", pothole(shift=15).rotate(3), NOW, map={"x": 0.4418, "y": 0.53})

suggestion = wait_for("duplicate suggested", lambda: doc("duplicateSuggestions/AY-NEW001_AY-GROUP1"))
print(
    f"     image {suggestion['imageSimilarity']:.2f}, {suggestion['distanceM']} m, "
    f"{suggestion['timeGapDays']} days -> {suggestion['combinedScore']:.2f} ({suggestion['decision']})"
)
assert suggestion["imageSimilarity"] > 0.8, suggestion
assert suggestion["decision"] == "pending"

# The streetlight is 4.5 m from the group but looks nothing like it: no suggestion... unless it
# beats the pothole on location and time alone. The new pothole must have picked the pothole.
time.sleep(3)
assert doc("duplicateSuggestions/AY-NEW001_AY-LIGHT1") is None, "matched the different photo"
print("ok   different-looking report not suggested")

before = doc("reports/AY-GROUP1")["priorityScore"]
db.document("reports/AY-GROUP1").update({"severity": 5})
wait_for(
    "priority rescored after severity change",
    lambda: (doc("reports/AY-GROUP1") or {}).get("priorityScore", before) > before,
)
print("All function checks passed.")
