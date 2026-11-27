# Ayos Cloud Functions (Python)

| Function | Trigger | Does |
|---|---|---|
| `on_report_created` (FR-15) | reporter's first photo saved in `reports/{id}/photos` | Embeds the photo with MobileNetV2, compares it with open groups within 30 m, saves the similarity to each as `imageScores: {groupId: 0–1}` on the report; the dashboard combines it with distance and time |
| `recalculate_priority` (FR-18) | any `reports/{id}` write | Rescores the group's `priorityScore` (0–100) when severity, count, status, danger or grouping changes |
| `recalculate_priority_on_settings` (FR-18) | `settings/priority` write | Rescores every group with the new weights |
| `recalculate_priority_daily` (FR-18) | every day 00:05 Manila | Rescores every group (age is part of the score) |
| `notify_reporters` (FR-12, FR-20) | `reports/{id}` update | Sends an FCM notification to the reporter and supporters on a status change, merge, or LGU update |

Scores use the same formulas and `settings/priority` values as the staff dashboard.
Image similarity adds `duplicates.imageWeight` (default 0.4) to the dashboard's distance and
time weights.

## Setup

```bash
cd functions
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
python -m pip install -r requirements-dev.txt
python scripts/fetch_model.py   # downloads models/mobilenetv2-embedding.onnx
```

## Test

With the venv activated:

```bash
python -m unittest discover -s tests   # scoring, embeddings, notification text
pnpm test:functions                     # from the repo root: end-to-end in the emulators
```

## Deploy

Cloud Functions need the **Blaze** plan. They run in `asia-southeast1`, the Firestore location.

1. In `functions/` with the venv activated: `python scripts/fetch_model.py` (the model file
   isn't in git).
2. `firebase deploy --only firestore:indexes`, then wait until the `reports` index
   (category + createdAt) shows **Enabled** in the Firebase console. `on_report_created`'s
   query fails until it's built (the emulator doesn't need indexes, so tests won't catch this).
3. `firebase deploy --only functions`.
