export type TimeWindow = '7d' | '30d' | '90d';

export interface CategoryMetric {
	category: string;
	reports: number;
	groups: number;
	avgScore: number;
	verifiedRate: number; // 0–100
}

export interface BarangayMetric {
	barangay: string;
	reports: number;
	criticalGroups: number;
	avgAgeDays: number;
}

export interface DailyVolumePoint {
	label: string;
	received: number;
	verified: number;
}

interface WindowDataset {
	totalReports: number;
	reportsDelta: string;
	mergeRatePct: number;
	medianVerifyHours: string;
	medianResolveDays: string;
	categories: CategoryMetric[];
	barangays: BarangayMetric[];
	trend: DailyVolumePoint[];
}

// shortcut: hardcoded sample figures (the page says so), compute from reports.svelte.ts once analytics is specced.
const DATASETS: Record<TimeWindow, WindowDataset> = {
	'7d': {
		totalReports: 54,
		reportsDelta: '+11% vs prior 7d',
		mergeRatePct: 37,
		medianVerifyHours: '2.8 h',
		medianResolveDays: '4.1 d',
		categories: [
			{ category: 'Road damage', reports: 21, groups: 7, avgScore: 76, verifiedRate: 71 },
			{ category: 'Drainage', reports: 15, groups: 5, avgScore: 73, verifiedRate: 80 },
			{ category: 'Streetlight', reports: 11, groups: 4, avgScore: 52, verifiedRate: 64 },
			{ category: 'Sidewalk', reports: 7, groups: 3, avgScore: 49, verifiedRate: 57 }
		],
		barangays: [
			{ barangay: 'Lahug', reports: 17, criticalGroups: 2, avgAgeDays: 5 },
			{ barangay: 'Sto. Niño', reports: 11, criticalGroups: 1, avgAgeDays: 3 },
			{ barangay: 'Mabolo', reports: 10, criticalGroups: 1, avgAgeDays: 4 },
			{ barangay: 'Banilad', reports: 9, criticalGroups: 1, avgAgeDays: 6 },
			{ barangay: 'Camputhaw', reports: 7, criticalGroups: 0, avgAgeDays: 4 }
		],
		trend: [
			{ label: 'Fri', received: 8, verified: 6 },
			{ label: 'Sat', received: 6, verified: 5 },
			{ label: 'Sun', received: 5, verified: 4 },
			{ label: 'Mon', received: 10, verified: 8 },
			{ label: 'Tue', received: 9, verified: 7 },
			{ label: 'Wed', received: 8, verified: 7 },
			{ label: 'Thu', received: 8, verified: 6 }
		]
	},
	'30d': {
		totalReports: 213,
		reportsDelta: '+18% vs prior 30d',
		mergeRatePct: 41,
		medianVerifyHours: '3.2 h',
		medianResolveDays: '4.6 d',
		categories: [
			{ category: 'Road damage', reports: 82, groups: 26, avgScore: 74, verifiedRate: 76 },
			{ category: 'Drainage', reports: 58, groups: 19, avgScore: 71, verifiedRate: 82 },
			{ category: 'Streetlight', reports: 43, groups: 16, avgScore: 48, verifiedRate: 68 },
			{ category: 'Sidewalk', reports: 30, groups: 12, avgScore: 46, verifiedRate: 63 }
		],
		barangays: [
			{ barangay: 'Lahug', reports: 64, criticalGroups: 4, avgAgeDays: 7 },
			{ barangay: 'Sto. Niño', reports: 42, criticalGroups: 2, avgAgeDays: 4 },
			{ barangay: 'Mabolo', reports: 39, criticalGroups: 2, avgAgeDays: 6 },
			{ barangay: 'Banilad', reports: 36, criticalGroups: 1, avgAgeDays: 8 },
			{ barangay: 'Camputhaw', reports: 32, criticalGroups: 1, avgAgeDays: 5 }
		],
		trend: [
			{ label: 'Wk 1', received: 46, verified: 34 },
			{ label: 'Wk 2', received: 52, verified: 41 },
			{ label: 'Wk 3', received: 57, verified: 46 },
			{ label: 'Wk 4', received: 58, verified: 49 }
		]
	},
	'90d': {
		totalReports: 618,
		reportsDelta: '+9% vs prior 90d',
		mergeRatePct: 44,
		medianVerifyHours: '3.6 h',
		medianResolveDays: '5.2 d',
		categories: [
			{ category: 'Road damage', reports: 244, groups: 74, avgScore: 72, verifiedRate: 81 },
			{ category: 'Drainage', reports: 176, groups: 54, avgScore: 70, verifiedRate: 85 },
			{ category: 'Streetlight', reports: 112, groups: 39, avgScore: 47, verifiedRate: 74 },
			{ category: 'Sidewalk', reports: 86, groups: 31, avgScore: 45, verifiedRate: 70 }
		],
		barangays: [
			{ barangay: 'Lahug', reports: 186, criticalGroups: 9, avgAgeDays: 8 },
			{ barangay: 'Sto. Niño', reports: 124, criticalGroups: 5, avgAgeDays: 5 },
			{ barangay: 'Mabolo', reports: 112, criticalGroups: 4, avgAgeDays: 6 },
			{ barangay: 'Banilad', reports: 104, criticalGroups: 3, avgAgeDays: 9 },
			{ barangay: 'Camputhaw', reports: 92, criticalGroups: 2, avgAgeDays: 6 }
		],
		trend: [
			{ label: 'Sep', received: 194, verified: 152 },
			{ label: 'Oct', received: 211, verified: 170 },
			{ label: 'Nov', received: 213, verified: 170 }
		]
	}
};

class AnalyticsState {
	window = $state<TimeWindow>('30d');
	selectedCategory = $state<string>('ALL');

	data = $derived(DATASETS[this.window]);

	visibleCategories = $derived(
		this.selectedCategory === 'ALL'
			? this.data.categories
			: this.data.categories.filter((c) => c.category === this.selectedCategory)
	);

	maxCategoryReports = $derived(
		Math.max(1, ...this.data.categories.map((c) => c.reports))
	);

	maxTrendReceived = $derived(
		Math.max(1, ...this.data.trend.map((t) => t.received))
	);

	exportCsv() {
		const headers = [
			'Category',
			'Reports',
			'Issue Groups',
			'Avg Priority Score',
			'Verification Rate (%)'
		];
		const rows = this.visibleCategories.map((c) => [
			`"${c.category}"`,
			c.reports,
			c.groups,
			c.avgScore,
			c.verifiedRate
		]);
		const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `ayos-analytics-${this.window}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
}

export const analytics = new AnalyticsState();