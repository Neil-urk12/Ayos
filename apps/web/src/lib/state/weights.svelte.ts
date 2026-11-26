import { doc, setDoc } from 'firebase/firestore';

import { db } from '#lib/firebase.ts';
import { DEFAULT_SETTINGS, settings, type Settings } from './settings.svelte.ts';

export interface WeightFactor {
	/** Same keys as settings/priority `weights`. */
	id: keyof Settings['weights'];
	label: string;
	description: string;
	weight: number; // 0.00 – 1.00
}

class WeightsState {
	factors = $state<WeightFactor[]>([
		{
			id: 'severity',
			label: 'Severity',
			description: 'Staff-verified physical damage rating (1 to 5 scale).',
			weight: DEFAULT_SETTINGS.weights.severity
		},
		{
			id: 'safety',
			label: 'Public safety impact',
			description: 'Proximity to schools, jeepney stops, or resident danger flags.',
			weight: DEFAULT_SETTINGS.weights.safety
		},
		{
			id: 'age',
			label: 'Issue age',
			description: 'Days elapsed since the first report in the group was submitted.',
			weight: DEFAULT_SETTINGS.weights.age
		},
		{
			id: 'reports',
			label: 'Corroborating reports',
			description: 'Number of distinct citizen reports merged into the issue group.',
			weight: DEFAULT_SETTINGS.weights.reports
		}
	]);

	criticalThreshold = $state(DEFAULT_SETTINGS.criticalThreshold);
	duplicateScoreThreshold = $state(DEFAULT_SETTINGS.duplicates.threshold);
	clusterRadiusMeters = $state(DEFAULT_SETTINGS.duplicates.radiusMeters);
	recurrenceWindowDays = $state(DEFAULT_SETTINGS.duplicates.windowDays);
	savedNotice = $state<string | null>(null);
	noticeIsError = $state(false);
	saving = $state(false);

	totalWeight = $derived(
		Number(this.factors.reduce((sum, item) => sum + Number(item.weight || 0), 0).toFixed(2))
	);

	isBalanced = $derived(Math.abs(this.totalWeight - 1.0) < 0.005);

	// Live preview using the sample "Deep pothole, northbound lane" inputs (Severity 4/5, High safety, 9 days, 6 reports)
	previewScore = $derived.by(() => {
		const normalizedInputs: Record<WeightFactor['id'], number> = {
			severity: 80, // 4 / 5
			safety: 90, // High
			age: 85, // 9 days
			reports: 95 // 6 reports
		};
		const raw = this.factors.reduce(
			(acc, f) => acc + normalizedInputs[f.id] * Number(f.weight || 0),
			0
		);
		return Math.min(100, Math.max(0, Math.round(raw)));
	});

	/** Shows `s` in the form, replacing any unsaved edits. */
	load(s: Settings) {
		for (const factor of this.factors) {
			factor.weight = s.weights[factor.id];
		}
		this.criticalThreshold = s.criticalThreshold;
		this.duplicateScoreThreshold = s.duplicates.threshold;
		this.clusterRadiusMeters = s.duplicates.radiusMeters;
		this.recurrenceWindowDays = s.duplicates.windowDays;
	}

	resetDefaults() {
		this.load(DEFAULT_SETTINGS);
		this.notify('Default weights restored. Save to apply them.');
	}

	notify(message: string, isError = false) {
		this.savedNotice = message;
		this.noticeIsError = isError;
	}

	async saveChanges() {
		// Same ranges as the page's inputs. Typed values skip min/max, empty ones bind as null,
		// and a 0 radius/window divides by zero in duplicate matching.
		const checks: [unknown, number, number][] = [
			...this.factors.map((f): [unknown, number, number] => [f.weight, 0, 1]),
			[this.criticalThreshold, 50, 100],
			[this.duplicateScoreThreshold, 0.5, 0.99],
			[this.clusterRadiusMeters, 10, 200],
			[this.recurrenceWindowDays, 7, 90]
		];
		const inRange = ([v, min, max]: [unknown, number, number]) =>
			typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
		if (!checks.every(inRange)) {
			this.notify(
				'Values out of range: weights 0–1, critical cutoff 50–100, match score 0.50–0.99, radius 10–200 m, window 7–90 days.',
				true
			);
			return;
		}
		// Until Firestore answers, the form holds defaults; saving them would overwrite real values.
		if (!settings.loaded || !this.isBalanced || this.saving) return;

		this.saving = true;
		try {
			// merge keeps fields this page doesn't edit (distanceWeight, timeWeight).
			await setDoc(
				doc(db, 'settings', 'priority'),
				{
					weights: Object.fromEntries(this.factors.map((f) => [f.id, f.weight])),
					criticalThreshold: this.criticalThreshold,
					duplicates: {
						threshold: this.duplicateScoreThreshold,
						radiusMeters: this.clusterRadiusMeters,
						windowDays: this.recurrenceWindowDays
					}
				},
				{ merge: true }
			);
			this.notify(
				`Saved priority weights (total ${this.totalWeight.toFixed(2)}) and triage thresholds.`
			);
		} catch (error) {
			console.warn('[weights] Could not save settings:', error);
			this.notify(
				(error as { code?: string }).code === 'permission-denied'
					? 'Only LGU admins can change priority weights.'
					: 'Couldn’t save the weights. Check your connection and try again.',
				true
			);
		} finally {
			this.saving = false;
		}
	}
}

export const weights = new WeightsState();
