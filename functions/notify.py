"""Status-change and update notifications to reporters, through Firebase Cloud Messaging.

The mobile app (apps/mobile/src/lib/notifications.ts) saves each device's FCM token in
users/{uid}.fcmTokens. A notification carries data.reportId so tapping it opens that report.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable, Mapping

STATUS_LABELS = {
    "received": "Received",
    "verified": "Verified",
    "in_progress": "In progress",
    "resolved": "Resolved",
    "removed": "Removed",
}

# Must match REOPEN_NOTE in apps/mobile/src/lib/firebase/reports.ts: written by a resident,
# not an LGU update, so it isn't announced as one.
REOPEN_NOTE = "Reopened after you said it is still broken"

# Android notification channel the app creates (lib/notifications.ts).
ANDROID_CHANNEL = "status-updates"


@dataclass(frozen=True)
class Notice:
    title: str
    body: str


def describe_change(before: Mapping[str, Any], after: Mapping[str, Any]) -> Notice | None:
    """What to tell reporters about this report update, or None if nothing worth a notification."""
    title = after.get("title") or "Your report"
    status, old_status = after.get("status"), before.get("status")
    note = (after.get("statusNote") or "").strip()
    old_note = (before.get("statusNote") or "").strip()

    merged_into = after.get("mergedInto")
    if merged_into and merged_into != before.get("mergedInto"):
        return Notice(
            f"{title}: combined with {merged_into}",
            "LGU staff found the same problem reported by others. You'll get its updates now.",
        )

    if status != old_status and status in STATUS_LABELS:
        label = STATUS_LABELS[status]
        if status == "resolved":
            body = "The LGU marked it fixed. Is it? Open the report to confirm."
        elif note and note != REOPEN_NOTE:
            body = note
        else:
            body = f"Status changed to {label}."
        return Notice(f"{title}: {label}", body)

    if note and note != old_note and note != REOPEN_NOTE:
        return Notice(f"{title}: update from the LGU", note)

    return None


def recipients(
    reporter_id: str | None, supporter_ids: Iterable[str], actor_id: str | None
) -> list[str]:
    """Everyone who filed or joined the report, minus whoever made the change."""
    seen: list[str] = []
    for uid in [reporter_id, *supporter_ids]:
        if uid and uid != actor_id and uid not in seen:
            seen.append(uid)
    return seen


def send(
    report_id: str, notice: Notice, tokens_by_uid: Mapping[str, list[str]]
) -> dict[str, list[str]]:
    """Sends the notice to every token; returns {uid: [tokens FCM says are no longer valid]}."""
    from firebase_admin import messaging

    pairs = [(uid, token) for uid, tokens in tokens_by_uid.items() for token in tokens]
    stale: dict[str, list[str]] = {}
    # FCM accepts up to 500 tokens per multicast.
    for start in range(0, len(pairs), 500):
        chunk = pairs[start : start + 500]
        message = messaging.MulticastMessage(
            tokens=[token for _, token in chunk],
            notification=messaging.Notification(title=notice.title, body=notice.body),
            data={"reportId": report_id},
            android=messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(channel_id=ANDROID_CHANNEL),
            ),
        )
        response = messaging.send_each_for_multicast(message)
        for (uid, token), result in zip(chunk, response.responses):
            if not result.success and isinstance(
                result.exception, (messaging.UnregisteredError, messaging.SenderIdMismatchError)
            ):
                stale.setdefault(uid, []).append(token)
    return stale
