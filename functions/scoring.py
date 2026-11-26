"""Duplicate-match and priority scoring. Pure functions, no Firebase calls, so they're unit-tested.

These mirror the staff dashboard so both show the same numbers:
- match score: apps/web/src/lib/state/duplicates.svelte.ts (matchScore)
- priority score: apps/web/src/lib/state/queue.svelte.ts (priorityScore, buildGroup)
- settings defaults: apps/web/src/lib/state/settings.svelte.ts (DEFAULT_SETTINGS)
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Iterable, Mapping

# Metres covered by the full width/height of the mobile app's neighbourhood map
# (apps/mobile/src/data/reports.ts MAP_SPAN_METRES). Report positions are map fractions.
MAP_SPAN_METRES = 3000
DAY_SECONDS = 86_400

DEFAULT_SEVERITY = 2
SAFETY_FILL = {"High": 0.9, "Medium": 0.6, "Low": 0.35}


@dataclass(frozen=True)
class DuplicateSettings:
    radius_meters: float = 30
    window_days: float = 30
    threshold: float = 0.75
    distance_weight: float = 0.6
    time_weight: float = 0.4
    # Only used when both reports have photos. Not on the dashboard's weights page yet;
    # set settings/priority.duplicates.imageWeight in the console to change it.
    image_weight: float = 0.4


@dataclass(frozen=True)
class PriorityWeights:
    severity: float = 0.35
    safety: float = 0.3
    age: float = 0.15
    reports: float = 0.2


@dataclass(frozen=True)
class Settings:
    weights: PriorityWeights = PriorityWeights()
    duplicates: DuplicateSettings = DuplicateSettings()


def _num(value: Any, fallback: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        return fallback
    return float(value)


def parse_settings(data: Mapping[str, Any] | None) -> Settings:
    """settings/priority, with any missing or invalid field falling back to the default."""
    data = data or {}
    w = data.get("weights") or {}
    d = data.get("duplicates") or {}
    dw, dd = PriorityWeights(), DuplicateSettings()
    return Settings(
        weights=PriorityWeights(
            severity=_num(w.get("severity"), dw.severity),
            safety=_num(w.get("safety"), dw.safety),
            age=_num(w.get("age"), dw.age),
            reports=_num(w.get("reports"), dw.reports),
        ),
        duplicates=DuplicateSettings(
            radius_meters=_num(d.get("radiusMeters"), dd.radius_meters),
            window_days=_num(d.get("windowDays"), dd.window_days),
            threshold=_num(d.get("threshold"), dd.threshold),
            distance_weight=_num(d.get("distanceWeight"), dd.distance_weight),
            time_weight=_num(d.get("timeWeight"), dd.time_weight),
            image_weight=_num(d.get("imageWeight"), dd.image_weight),
        ),
    )


def map_distance(a: Mapping[str, Any] | None, b: Mapping[str, Any] | None) -> float:
    """Metres between two map positions ({x, y} fractions of the map)."""
    a = a or {"x": 0.5, "y": 0.5}
    b = b or {"x": 0.5, "y": 0.5}
    return math.hypot(float(a["x"]) - float(b["x"]), float(a["y"]) - float(b["y"])) * MAP_SPAN_METRES


EARTH_RADIUS_METRES = 6_371_000


def _lat_lng(value: Any) -> tuple[float, float] | None:
    """(lat, lng) from a Firestore GeoPoint or a {latitude, longitude} mapping."""
    if value is None:
        return None
    if isinstance(value, Mapping):
        lat, lng = value.get("latitude"), value.get("longitude")
    else:
        lat, lng = getattr(value, "latitude", None), getattr(value, "longitude", None)
    if lat is None or lng is None:
        return None
    return float(lat), float(lng)


def gps_distance(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Metres between two (lat, lng) points (haversine), same as geofire-common in the app."""
    lat1, lng1, lat2, lng2 = map(math.radians, (*a, *b))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(
        (lng2 - lng1) / 2
    ) ** 2
    return 2 * EARTH_RADIUS_METRES * math.asin(math.sqrt(h))


def report_distance(a: Mapping[str, Any], b: Mapping[str, Any]) -> float:
    """Metres between two reports: GPS (FR-04) when both have it, else their map positions."""
    pa, pb = _lat_lng(a.get("location")), _lat_lng(b.get("location"))
    if pa and pb:
        return gps_distance(pa, pb)
    return map_distance(a.get("map"), b.get("map"))


def gap_days(newer: datetime, older: datetime) -> int:
    return math.floor((newer - older).total_seconds() / DAY_SECONDS)


def match_score(
    distance: float, days: float, image_similarity: float | None, d: DuplicateSettings
) -> float:
    """Combined score, 0–1. Without photos it's the dashboard's distance + time score."""
    closeness = d.distance_weight * (1 - distance / d.radius_meters)
    recency = d.time_weight * (1 - days / d.window_days)
    if image_similarity is None:
        return closeness + recency
    total = d.image_weight + d.distance_weight + d.time_weight
    if total <= 0:
        return closeness + recency
    return (d.image_weight * image_similarity + closeness + recency) / total


@dataclass(frozen=True)
class Candidate:
    group_id: str
    distance: float
    days: int
    image_similarity: float | None
    score: float


def best_match(
    report: Mapping[str, Any],
    report_id: str,
    groups: Iterable[tuple[str, Mapping[str, Any]]],
    similarity_for: Any,
    d: DuplicateSettings,
) -> Candidate | None:
    """The best-scoring older open group nearby in the same category, at or above the threshold.

    `groups` are (id, data) of reports that aren't merged into another. `similarity_for(group_id)`
    returns the image similarity to that group, or None when either side has no photo.
    Same filters as findSuggestions on the dashboard.
    """
    created: datetime = report["createdAt"]
    not_duplicate_of = set(report.get("notDuplicateOf") or [])
    best: Candidate | None = None
    for group_id, group in groups:
        if group_id == report_id or group.get("category") != report.get("category"):
            continue
        if group.get("mergedInto") or group_id in not_duplicate_of:
            continue
        group_created: datetime | None = group.get("createdAt")
        if group_created is None or group_created > created:
            continue
        distance = report_distance(report, group)
        days = gap_days(created, group_created)
        if distance > d.radius_meters or days > d.window_days:
            continue
        similarity = similarity_for(group_id)
        score = match_score(distance, days, similarity, d)
        if score >= d.threshold and (best is None or score > best.score):
            best = Candidate(group_id, distance, days, similarity, score)
    return best


def safety_impact(members: Iterable[Mapping[str, Any]]) -> str:
    return "High" if any(m.get("danger") for m in members) else "Medium"


def priority_score(
    severity: float, impact: str, age_days: float, count: float, w: PriorityWeights
) -> int:
    """Priority score, 0–100. Same formula and bars as the dashboard's priority queue."""
    raw = 100 * (
        w.severity * (severity / 5)
        + w.safety * SAFETY_FILL.get(impact, SAFETY_FILL["Medium"])
        + w.age * min(1, age_days * 0.07)
        + w.reports * min(1, count * 0.15)
    )
    # JavaScript's Math.round rounds .5 up; Python's round() rounds to even.
    return math.floor(raw + 0.5)


def group_priority(
    lead: Mapping[str, Any], children: Iterable[Mapping[str, Any]], now: datetime, w: PriorityWeights
) -> int:
    """Priority for an issue group: the lead report plus the reports merged into it."""
    members = [lead, *children]
    first = min(m["createdAt"] for m in members if m.get("createdAt") is not None)
    age = max(0, gap_days(now, first))
    severity = lead.get("severity") or DEFAULT_SEVERITY
    count = lead.get("reportCount") or 1
    return priority_score(severity, safety_impact(members), age, count, w)
