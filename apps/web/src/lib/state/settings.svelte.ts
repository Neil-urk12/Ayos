import { doc, onSnapshot } from 'firebase/firestore';

import { db } from '#lib/firebase.ts';

/**
 * settings/priority in Firestore: priority weights and duplicate thresholds. Edited by an
 * LGU admin in the Firebase console until FR-21 has a screen; seeded by scripts/seed.mjs.
 * Any missing field falls back to these defaults (placeholders until agreed with the LGU).
 */
export const DEFAULT_SETTINGS = {
	weights: { severity: 0.35, safety: 0.3, age: 0.15, reports: 0.2 },
	duplicates: {
		/** Reports further apart than this are never suggested. */
		radiusMeters: 30,
		/** Reports further apart in time than this are never suggested. */
		windowDays: 30,
		/** Combined score at or above which a match is suggested. */
		threshold: 0.75,
		/** How distance and time gap make up the combined score; should sum to 1. */
		distanceWeight: 0.6,
		timeWeight: 0.4
	}
};

export type Settings = typeof DEFAULT_SETTINGS;

function num(value: unknown, fallback: number) {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function merge(data: Record<string, unknown> | undefined): Settings {
	const w = (data?.weights ?? {}) as Record<string, unknown>;
	const d = (data?.duplicates ?? {}) as Record<string, unknown>;
	const dw = DEFAULT_SETTINGS.weights;
	const dd = DEFAULT_SETTINGS.duplicates;
	return {
		weights: {
			severity: num(w.severity, dw.severity),
			safety: num(w.safety, dw.safety),
			age: num(w.age, dw.age),
			reports: num(w.reports, dw.reports)
		},
		duplicates: {
			radiusMeters: num(d.radiusMeters, dd.radiusMeters),
			windowDays: num(d.windowDays, dd.windowDays),
			threshold: num(d.threshold, dd.threshold),
			distanceWeight: num(d.distanceWeight, dd.distanceWeight),
			timeWeight: num(d.timeWeight, dd.timeWeight)
		}
	};
}

class SettingsState {
	current = $state<Settings>(DEFAULT_SETTINGS);

	/** Starts listening; returns a function that stops. Call once signed in as staff. */
	start() {
		return onSnapshot(
			doc(db, 'settings', 'priority'),
			(snap) => (this.current = merge(snap.data())),
			(error) => {
				console.warn('[settings] Could not load settings; using defaults:', error);
				this.current = DEFAULT_SETTINGS;
			}
		);
	}
}

export const settings = new SettingsState();
