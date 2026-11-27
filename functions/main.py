"""Ayos Cloud Functions (Python).

- on_report_created (FR-15): when a new report's first photo is saved, embeds it with a
  pretrained MobileNetV2, compares it with nearby open issue groups, and saves the photo
  similarity to each one as imageScores on the report. The staff dashboard combines it with
  distance and time gap to decide what to suggest.
- recalculate_priority* (FR-18): keeps priorityScore (0–100) on each issue group's lead
  report up to date when the group, the weights or the day changes.
- notify_reporters (FR-12, FR-20): sends status-change and LGU-update notifications to
  everyone who filed or joined a report, through Firebase Cloud Messaging.

An issue group is a lead report plus the reports merged into it (mergedInto == lead id),
the same model the staff dashboard uses.

Deploying needs the Blaze plan. Test locally with the emulators (see functions/README.md).
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from firebase_admin import firestore, initialize_app
from firebase_functions import firestore_fn, options, scheduler_fn
from google.cloud.firestore_v1 import FieldFilter

import embedding
import notify
import scoring

# Must match the Firestore database location (asia-southeast1) for Firestore triggers.
options.set_global_options(region="asia-southeast1", max_instances=10)

initialize_app()

log = logging.getLogger("ayos")

REPORTS = "reports"
PHOTOS = "photos"
SUPPORTERS = "supporters"
USERS = "users"
EMBEDDINGS = "embeddings"

# Changes to these on a report can change its group's priority score.
PRIORITY_FIELDS = ("severity", "reportCount", "status", "danger", "mergedInto", "createdAt")


def _db():
    return firestore.client()


def _data(snap: Any) -> dict[str, Any]:
    """A snapshot's fields; {} when there is no document (e.g. `before` on a create)."""
    return (snap.to_dict() or {}) if snap is not None and snap.exists else {}


def _settings() -> scoring.Settings:
    snap = _db().collection("settings").document("priority").get()
    return scoring.parse_settings(snap.to_dict() if snap.exists else None)


# ---------------------------------------------------------------------------------------------
# FR-15: duplicate detection
# ---------------------------------------------------------------------------------------------


def _group_embeddings(group_ids: list[str]) -> dict[str, list[list[float]]]:
    """Embeddings of every report in each group (the lead and its merged reports)."""
    db = _db()
    member_ids: dict[str, list[str]] = {gid: [gid] for gid in group_ids}
    for gid in group_ids:
        children = db.collection(REPORTS).where(filter=FieldFilter("mergedInto", "==", gid)).stream()
        member_ids[gid].extend(child.id for child in children)

    all_ids = sorted({mid for ids in member_ids.values() for mid in ids})
    refs = [db.collection(EMBEDDINGS).document(mid) for mid in all_ids]
    vectors = {snap.id: snap.get("vector") for snap in db.get_all(refs) if snap.exists}
    return {gid: [vectors[mid] for mid in ids if mid in vectors] for gid, ids in member_ids.items()}


@firestore_fn.on_document_created(
    document="reports/{reportId}/photos/{photoId}",
    memory=options.MemoryOption.GB_1,
    timeout_sec=120,
)
def on_report_created(event: firestore_fn.Event[firestore_fn.DocumentSnapshot | None]) -> None:
    """Runs once per new report: the app saves the reporter's photos right after the report."""
    if event.data is None:
        return
    report_id = event.params["reportId"]
    db = _db()
    report_snap = db.collection(REPORTS).document(report_id).get()
    if not report_snap.exists:
        return
    report = report_snap.to_dict()
    # Only the reporter's first photo starts the check; joiners' photos and later angles don't.
    if event.params["photoId"] != f"{report.get('reporterId')}_0":
        return

    vector: list[float] | None = None
    try:
        vector = embedding.embed(embedding.decode_data_uri(event.data.get("data"))).tolist()
        db.collection(EMBEDDINGS).document(report_id).set(
            {
                "vector": vector,
                "model": embedding.MODEL_NAME,
                "createdAt": firestore.SERVER_TIMESTAMP,
            }
        )
    except Exception:  # Bad image or missing model: fall back to distance + time only.
        log.exception("Could not embed the photo for %s", report_id)

    settings = _settings().duplicates
    # Only reports inside the time window can match, so don't read older ones. The extra day
    # covers the dashboard's gap rounding down; the dashboard applies the exact window.
    oldest = report["createdAt"] - timedelta(days=settings.window_days + 1)
    candidates = [
        (snap.id, snap.to_dict())
        for snap in db.collection(REPORTS)
        .where(filter=FieldFilter("category", "==", report.get("category")))
        .where(filter=FieldFilter("createdAt", ">=", oldest))
        # Only what's read below; skips the thumbnails (up to 60 KB each).
        .select(["location", "map", "mergedInto"])
        .stream()
    ]
    nearby_ids = [
        gid
        for gid, group in candidates
        if gid != report_id
        and not group.get("mergedInto")
        and scoring.report_distance(report, group) <= settings.radius_meters
    ]
    group_vectors = _group_embeddings(nearby_ids) if vector and nearby_ids else {}
    # Every compared group, not just matches, so a low score can rule a match out too.
    scores = {
        gid: round(max(embedding.similarity(vector, v) for v in vectors), 4)
        for gid, vectors in group_vectors.items()
        if vectors
    }
    if scores:
        db.collection(REPORTS).document(report_id).update({"imageScores": scores})
    log.info("Compared %s with %d nearby groups", report_id, len(scores))


# ---------------------------------------------------------------------------------------------
# FR-18: priority scores
# ---------------------------------------------------------------------------------------------


def _recalculate_group(lead_id: str, weights: scoring.PriorityWeights, now: datetime) -> None:
    db = _db()
    lead_ref = db.collection(REPORTS).document(lead_id)
    lead_snap = lead_ref.get()
    if not lead_snap.exists:
        return
    lead = lead_snap.to_dict()
    if lead.get("mergedInto") or lead.get("createdAt") is None:
        return
    children = [
        c.to_dict()
        for c in db.collection(REPORTS).where(filter=FieldFilter("mergedInto", "==", lead_id)).stream()
    ]
    score = scoring.group_priority(lead, children, now, weights)
    # Only write a change, so this function's own write doesn't trigger another one.
    if lead.get("priorityScore") != score:
        lead_ref.update({"priorityScore": score, "priorityUpdatedAt": firestore.SERVER_TIMESTAMP})


def _recalculate_all() -> int:
    db = _db()
    weights = _settings().weights
    now = datetime.now(timezone.utc)
    docs = {snap.id: snap.to_dict() for snap in db.collection(REPORTS).stream()}
    children: dict[str, list[dict[str, Any]]] = {}
    for data in docs.values():
        if data.get("mergedInto"):
            children.setdefault(data["mergedInto"], []).append(data)

    batch, pending, updated = db.batch(), 0, 0
    for report_id, lead in docs.items():
        if lead.get("mergedInto") or lead.get("createdAt") is None:
            continue
        score = scoring.group_priority(lead, children.get(report_id, []), now, weights)
        if lead.get("priorityScore") == score:
            continue
        batch.update(
            db.collection(REPORTS).document(report_id),
            {"priorityScore": score, "priorityUpdatedAt": firestore.SERVER_TIMESTAMP},
        )
        pending += 1
        updated += 1
        if pending == 400:  # A batch holds at most 500 writes.
            batch.commit()
            batch, pending = db.batch(), 0
    if pending:
        batch.commit()
    return updated


@firestore_fn.on_document_written(document="reports/{reportId}")
def recalculate_priority(event: firestore_fn.Event[firestore_fn.Change | None]) -> None:
    """Rescores the affected group(s) when a report's severity, count, status or group changes."""
    before = _data(event.data.before) if event.data else {}
    after = _data(event.data.after) if event.data else {}
    if before and after and all(before.get(f) == after.get(f) for f in PRIORITY_FIELDS):
        return  # Only other fields changed, e.g. this function's own priorityScore write.

    report_id = event.params["reportId"]
    leads = {after.get("mergedInto") or (report_id if after else None), before.get("mergedInto")}
    weights = _settings().weights
    now = datetime.now(timezone.utc)
    for lead_id in filter(None, leads):
        _recalculate_group(lead_id, weights, now)


@firestore_fn.on_document_written(document="settings/priority")
def recalculate_priority_on_settings(event: firestore_fn.Event[Any]) -> None:
    """Admins changed the weights: rescore every group."""
    log.info("Weights changed; rescored %d groups", _recalculate_all())


@scheduler_fn.on_schedule(schedule="every day 00:05", timezone=scheduler_fn.Timezone("Asia/Manila"))
def recalculate_priority_daily(event: scheduler_fn.ScheduledEvent) -> None:
    """Age is part of the score, so rescore every group once a day."""
    log.info("Daily rescore updated %d groups", _recalculate_all())


# ---------------------------------------------------------------------------------------------
# FR-12, FR-20: notifications
# ---------------------------------------------------------------------------------------------


@firestore_fn.on_document_updated_with_auth_context(document="reports/{reportId}")
def notify_reporters(event: firestore_fn.AuthEvent[firestore_fn.Change | None]) -> None:
    if event.data is None:
        return
    before, after = _data(event.data.before), _data(event.data.after)
    notice = notify.describe_change(before, after)
    if notice is None:
        return

    report_id = event.params["reportId"]
    db = _db()
    report_ref = db.collection(REPORTS).document(report_id)
    supporter_ids = [s.id for s in report_ref.collection(SUPPORTERS).stream()]
    # Don't notify the person who made the change (a resident reopening their own report).
    actor = event.auth_id if event.auth_type == "app_user" else None
    uids = notify.recipients(after.get("reporterId"), supporter_ids, actor)
    if not uids:
        return

    users = db.get_all([db.collection(USERS).document(uid) for uid in uids])
    tokens = {u.id: list(u.get("fcmTokens") or []) for u in users if u.exists}
    tokens = {uid: t for uid, t in tokens.items() if t}
    if not tokens:
        log.info("No devices to notify for %s", report_id)
        return

    stale = notify.send(report_id, notice, tokens)
    for uid, bad in stale.items():
        db.collection(USERS).document(uid).update({"fcmTokens": firestore.ArrayRemove(bad)})
    log.info("Notified %d users about %s: %s", len(tokens), report_id, notice.title)

