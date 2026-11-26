# Ayos Cloud Functions (Python)

| Function | Trigger | Does |
|---|---|---|
| `on_report_created` (FR-15) | reporter's first photo saved in `reports/{id}/photos` | Embeds the photo with MobileNetV2, compares it with open groups within 30 m, writes a `pending` `duplicateSuggestions/{reportId}_{groupId}` if the combined score meets the threshold |
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
venv/Scripts/python -m pip install -r requirements-dev.txt
venv/Scripts/python scripts/fetch_model.py   # downloads models/mobilenetv2-embedding.onnx
```

## Test

```bash
venv/Scripts/python -m unittest discover -s tests   # scoring, embeddings, notification text
pnpm test:functions                                  # from the repo root: end-to-end in the emulators
```

## Deploy

Cloud Functions need the **Blaze** plan. Run `scripts/fetch_model.py` first (the model file
isn't in git), then `firebase deploy --only functions`. They run in `asia-southeast1`, the
Firestore location.
