export interface WeightFactor {
	id: 'severity' | 'safety' | 'age' | 'corroboration';
	label: string;
	description: string;
	weight: number; // 0.00 – 1.00
	defaultWeight: number;
}

class WeightsState {
	factors = $state<WeightFactor[]>([
		{
			id: 'severity',
			label: 'Severity',
			description: 'Staff-verified physical damage rating (1 to 5 scale).',
			weight: 0.35,
			defaultWeight: 0.35
		},
		{
			id: 'safety',
			label: 'Public safety impact',
			description: 'Proximity to schools, jeepney stops, or resident danger flags.',
			weight: 0.30,
			defaultWeight: 0.30
		},
		{
			id: 'age',
			label: 'Issue age',
			description: 'Days elapsed since the first report in the group was submitted.',
			weight: 0.15,
			defaultWeight: 0.15
		},
		{
			id: 'corroboration',
			label: 'Corroborating reports',
			description: 'Number of distinct citizen reports merged into the issue group.',
			weight: 0.20,
			defaultWeight: 0.20
		}
	]);

	criticalThreshold = $state(80);
	duplicateScoreThreshold = $state(0.75);
	clusterRadiusMeters = $state(30);
	recurrenceWindowDays = $state(30);
	savedNotice = $state<string | null>(null);

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
			corroboration: 95 // 6 reports
		};
		const raw = this.factors.reduce(
			(acc, f) => acc + normalizedInputs[f.id] * Number(f.weight || 0),
			0
		);
		return Math.min(100, Math.max(0, Math.round(raw)));
	});

	resetDefaults() {
		for (const factor of this.factors) {
			factor.weight = factor.defaultWeight;
		}
		this.criticalThreshold = 80;
		this.duplicateScoreThreshold = 0.75;
		this.clusterRadiusMeters = 30;
		this.recurrenceWindowDays = 30;
		this.savedNotice = 'Restored default LGU calibration weights.';
	}

	saveChanges() {
		if (!this.isBalanced) return;
		this.savedNotice = `Saved priority weights (total ${this.totalWeight.toFixed(2)}) and triage thresholds.`;
	}
}

export const weights = new WeightsState();