"""Unit tests for scoring, embeddings and notification text. Run from functions/:

    venv/Scripts/python -m unittest discover -s tests -v
"""

import io
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import embedding  # noqa: E402
import notify  # noqa: E402
import scoring  # noqa: E402

NOW = datetime(2026, 11, 26, 12, tzinfo=timezone.utc)
D = scoring.DuplicateSettings()


def report(**overrides):
    data = {
        "category": "road",
        "map": {"x": 0.44, "y": 0.53},
        "createdAt": NOW,
        "reportCount": 1,
        "status": "received",
    }
    data.update(overrides)
    return data


class ScoringTest(unittest.TestCase):
    def test_settings_fall_back_to_defaults(self):
        s = scoring.parse_settings({"weights": {"severity": 0.5, "age": "x"}, "duplicates": None})
        self.assertEqual(s.weights.severity, 0.5)
        self.assertEqual(s.weights.age, 0.15)
        self.assertEqual(s.duplicates.radius_meters, 30)

    def test_map_distance_in_metres(self):
        self.assertAlmostEqual(scoring.map_distance({"x": 0, "y": 0}, {"x": 0.01, "y": 0}), 30)

    def test_match_score_without_photos_matches_dashboard(self):
        # Dashboard: 0.6 * (1 - 6/30) + 0.4 * (1 - 3/30)
        self.assertAlmostEqual(scoring.match_score(6, 3, None, D), 0.6 * 0.8 + 0.4 * 0.9)

    def test_image_similarity_moves_the_score(self):
        same = scoring.match_score(10, 5, 0.95, D)
        different = scoring.match_score(10, 5, 0.2, D)
        self.assertGreater(same, D.threshold)
        self.assertLess(different, D.threshold)

    def test_best_match_filters_like_the_dashboard(self):
        new = report(notDuplicateOf=["AY-REJECT"])
        groups = [
            ("AY-NEW", new),  # itself
            ("AY-OTHER", report(category="drainage", createdAt=NOW - timedelta(days=1))),
            ("AY-FAR", report(map={"x": 0.5, "y": 0.53}, createdAt=NOW - timedelta(days=1))),
            ("AY-OLD", report(createdAt=NOW - timedelta(days=60))),
            ("AY-LATER", report(createdAt=NOW + timedelta(days=1))),
            ("AY-MERGED", report(mergedInto="AY-X", createdAt=NOW - timedelta(days=1))),
            ("AY-REJECT", report(createdAt=NOW - timedelta(days=1))),
            ("AY-MATCH", report(map={"x": 0.441, "y": 0.53}, createdAt=NOW - timedelta(days=2))),
        ]
        match = scoring.best_match(new, "AY-NEW", groups, lambda _: None, D)
        self.assertIsNotNone(match)
        self.assertEqual(match.group_id, "AY-MATCH")
        self.assertEqual(match.days, 2)
        self.assertAlmostEqual(match.distance, 3, places=5)

    def test_best_match_drops_visually_different_photos(self):
        new = report()
        # 6 m and 3 days apart: a match on location alone (0.84), so the photo decides.
        groups = [("AY-G", report(map={"x": 0.442, "y": 0.53}, createdAt=NOW - timedelta(days=3)))]
        self.assertIsNotNone(scoring.best_match(new, "AY-NEW", groups, lambda _: 0.95, D))
        self.assertIsNone(scoring.best_match(new, "AY-NEW", groups, lambda _: 0.1, D))

    def test_priority_matches_dashboard_formula(self):
        w = scoring.PriorityWeights()
        # 100 * (0.35*2/5 + 0.3*0.6 + 0.15*min(1, 3*0.07) + 0.2*min(1, 2*0.15)) = 41.15 -> 41
        self.assertEqual(scoring.priority_score(2, "Medium", 3, 2, w), 41)
        # 100 * (0.35 + 0.3*0.9 + 0.15 + 0.2) = 97
        self.assertEqual(scoring.priority_score(5, "High", 100, 100, w), 97)

    def test_group_priority_uses_oldest_member_and_any_danger(self):
        w = scoring.PriorityWeights()
        lead = report(createdAt=NOW - timedelta(days=3), reportCount=2, severity=4)
        child = report(createdAt=NOW - timedelta(days=10), danger=True)
        expected = scoring.priority_score(4, "High", 10, 2, w)
        self.assertEqual(scoring.group_priority(lead, [child], NOW, w), expected)


def jpeg(image: Image.Image) -> bytes:
    out = io.BytesIO()
    image.save(out, format="JPEG", quality=85)
    return out.getvalue()


def pothole(shift: int = 0) -> Image.Image:
    """A grey road with a dark oval, the kind of photo residents send."""
    image = Image.new("RGB", (640, 480), (120, 120, 118))
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 380, 640, 480), fill=(90, 140, 70))
    draw.line((0, 200 + shift, 640, 220 + shift), fill=(235, 235, 225), width=12)
    draw.ellipse((220 + shift, 240, 430 + shift, 340), fill=(40, 35, 30))
    return image


def streetlight() -> Image.Image:
    image = Image.new("RGB", (640, 480), (25, 30, 60))
    draw = ImageDraw.Draw(image)
    draw.rectangle((300, 80, 330, 480), fill=(160, 160, 170))
    draw.ellipse((260, 40, 370, 120), fill=(255, 230, 120))
    for i in range(0, 640, 40):
        draw.rectangle((i, 440, i + 20, 480), fill=(200, 40, 40))
    return image


@unittest.skipUnless(embedding.MODEL_PATH.exists(), "run scripts/fetch_model.py first")
class EmbeddingTest(unittest.TestCase):
    def test_embedding_is_unit_length(self):
        vector = embedding.embed(jpeg(pothole()))
        self.assertEqual(vector.shape, (1280,))
        self.assertAlmostEqual(float(np.linalg.norm(vector)), 1.0, places=4)

    def test_same_scene_scores_higher_than_a_different_one(self):
        original = embedding.embed(jpeg(pothole()))
        retaken = embedding.embed(
            jpeg(ImageEnhance.Brightness(pothole(shift=15)).enhance(1.15).rotate(3))
        )
        other = embedding.embed(jpeg(streetlight()))
        same = embedding.similarity(original, retaken)
        different = embedding.similarity(original, other)
        self.assertGreater(same, 0.8)
        self.assertGreater(same, different + 0.15)

    def test_reads_the_apps_data_uri_format(self):
        import base64

        uri = "data:image/jpeg;base64," + base64.b64encode(jpeg(pothole())).decode()
        self.assertEqual(embedding.decode_data_uri(uri)[:2], b"\xff\xd8")


class NotifyTest(unittest.TestCase):
    def test_status_change(self):
        notice = notify.describe_change(
            {"status": "received", "title": "Pothole"}, {"status": "verified", "title": "Pothole"}
        )
        self.assertEqual(notice.title, "Pothole: Verified")

    def test_status_change_carries_the_staff_note(self):
        notice = notify.describe_change(
            {"status": "verified"}, {"status": "in_progress", "statusNote": "Crew on Monday"}
        )
        self.assertEqual(notice.body, "Crew on Monday")

    def test_resolved_asks_for_confirmation(self):
        notice = notify.describe_change({"status": "in_progress"}, {"status": "resolved"})
        self.assertIn("Is it?", notice.body)

    def test_new_update_without_status_change(self):
        notice = notify.describe_change(
            {"status": "verified", "statusNote": "Old"}, {"status": "verified", "statusNote": "New"}
        )
        self.assertEqual(notice.body, "New")

    def test_merge(self):
        notice = notify.describe_change({"status": "received"}, {"status": "verified", "mergedInto": "AY-G"})
        self.assertIn("combined with AY-G", notice.title)

    def test_resident_reopen_note_is_not_an_lgu_update(self):
        notice = notify.describe_change(
            {"status": "resolved"}, {"status": "in_progress", "statusNote": notify.REOPEN_NOTE}
        )
        self.assertEqual(notice.body, "Status changed to In progress.")

    def test_unrelated_changes_send_nothing(self):
        self.assertIsNone(
            notify.describe_change({"status": "verified", "reportCount": 1}, {"status": "verified", "reportCount": 2})
        )

    def test_recipients_skip_the_actor_and_duplicates(self):
        self.assertEqual(notify.recipients("alice", ["alice", "bob", "carol"], "carol"), ["alice", "bob"])


if __name__ == "__main__":
    unittest.main()
