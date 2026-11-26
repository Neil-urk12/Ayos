export type ReportStatus = 'In progress' | 'Verified' | 'Received' | 'Duplicate';

export interface CitizenReport {
	id: string;
	code: string;
	summary: string;
	category: string;
	street: string;
	barangay: string;
	submittedAt: string;
	ageDays: number;
	gpsAccuracy: string;
	residentFlag?: string;
	groupCode: string | null;
	matchScore: string;
	status: ReportStatus;
	notes: string;
}

const INITIAL_REPORTS: CitizenReport[] = [
	{
		id: 'rep-1',
		code: 'AY-01482',
		summary: 'About 1 m wide, near the jeepney stop.',
		category: 'Road damage',
		street: 'Gorordo Ave',
		barangay: 'Lahug',
		submittedAt: 'Nov 15, 9:43 AM',
		ageDays: 2,
		gpsAccuracy: '±8 m',
		residentFlag: 'Danger to people',
		groupCode: 'G-0317',
		matchScore: '0.88',
		status: 'In progress',
		notes: 'Matched to northbound lane pothole group; photo shows standing water edge.'
	},
	{
		id: 'rep-2',
		code: 'AY-01489',
		summary: 'Metal cover missing beside drainage grate.',
		category: 'Drainage',
		street: 'Colon St',
		barangay: 'Sto. Niño',
		submittedAt: 'Nov 15, 10:12 AM',
		ageDays: 1,
		gpsAccuracy: '±6 m',
		residentFlag: 'Hazard at night',
		groupCode: 'G-0294',
		matchScore: '0.86',
		status: 'Verified',
		notes: 'Verified against existing manhole report; barricade requested.'
	},
	{
		id: 'rep-3',
		code: 'AY-01468',
		summary: 'Broken concrete slab along pedestrian edge.',
		category: 'Sidewalk',
		street: 'Juan Luna Ave',
		barangay: 'Mabolo',
		submittedAt: 'Nov 14, 3:40 PM',
		ageDays: 3,
		gpsAccuracy: '±10 m',
		groupCode: 'G-0302',
		matchScore: '0.80',
		status: 'Received',
		notes: 'Awaiting field inspection for sidewalk edge alignment.'
	},
	{
		id: 'rep-4',
		code: 'AY-01455',
		summary: 'Post lamp blinks on and off every few minutes.',
		category: 'Streetlight',
		street: 'V. Rama Ave',
		barangay: 'Guadalupe',
		submittedAt: 'Nov 13, 7:55 PM',
		ageDays: 4,
		gpsAccuracy: '±7 m',
		groupCode: 'G-0311',
		matchScore: 'First report',
		status: 'Received',
		notes: 'Single report logged; low immediate traffic impact.'
	},
	{
		id: 'rep-5',
		code: 'AY-01451',
		summary: 'Deepening crater after morning rain.',
		category: 'Road damage',
		street: 'Gorordo Ave',
		barangay: 'Lahug',
		submittedAt: 'Nov 13, 9:15 AM',
		ageDays: 4,
		gpsAccuracy: '±5 m',
		residentFlag: 'Danger to people',
		groupCode: 'G-0317',
		matchScore: '0.90',
		status: 'In progress',
		notes: 'Corroborating report merged into G-0317.'
	},
	{
		id: 'rep-6',
		code: 'AY-01425',
		summary: 'Longitudinal crack across patched lane.',
		category: 'Road damage',
		street: 'Banilad Rd',
		barangay: 'Banilad',
		submittedAt: 'Nov 9, 10:15 AM',
		ageDays: 8,
		gpsAccuracy: '±9 m',
		groupCode: 'G-0299',
		matchScore: 'First report',
		status: 'Received',
		notes: 'Scheduled for routine surface evaluation.'
	},
	{
		id: 'rep-7',
		code: 'AY-01412',
		summary: 'Leaves and silt blocking inlet grill.',
		category: 'Drainage',
		street: 'Salinas Dr',
		barangay: 'Lahug',
		submittedAt: 'Nov 7, 11:00 AM',
		ageDays: 10,
		gpsAccuracy: '±8 m',
		groupCode: 'G-0255',
		matchScore: '0.77',
		status: 'In progress',
		notes: 'Part of active canal inlet clearing cluster.'
	},
	{
		id: 'rep-8',
		code: 'AY-01391',
		summary: 'Large pothole slowing northbound jeepneys.',
		category: 'Road damage',
		street: 'Gorordo Ave',
		barangay: 'Lahug',
		submittedAt: 'Nov 6, 7:12 AM',
		ageDays: 11,
		gpsAccuracy: '±5 m',
		residentFlag: 'Danger to people',
		groupCode: 'G-0317',
		matchScore: 'First report',
		status: 'In progress',
		notes: 'Initial report that established group G-0317.'
	}
];

class ReportsState {
	items = $state<CitizenReport[]>(INITIAL_REPORTS);
	searchQuery = $state('');
	selectedCategory = $state('ALL');
	selectedBarangay = $state('ALL');
	selectedStatus = $state('ALL');
	activeReportId = $state<string | null>(null);

	categories = $derived(Array.from(new Set(this.items.map((r) => r.category))).sort());
	barangays = $derived(Array.from(new Set(this.items.map((r) => r.barangay))).sort());
	statuses: ReportStatus[] = ['In progress', 'Verified', 'Received', 'Duplicate'];

	filteredItems = $derived(
		this.items.filter((rep) => {
			const q = this.searchQuery.trim().toLowerCase();
			const matchQuery =
				!q ||
				rep.code.toLowerCase().includes(q) ||
				rep.summary.toLowerCase().includes(q) ||
				rep.street.toLowerCase().includes(q) ||
				rep.barangay.toLowerCase().includes(q) ||
				(rep.groupCode?.toLowerCase().includes(q) ?? false);

			const matchCat = this.selectedCategory === 'ALL' || rep.category === this.selectedCategory;
			const matchBrgy = this.selectedBarangay === 'ALL' || rep.barangay === this.selectedBarangay;
			const matchStatus = this.selectedStatus === 'ALL' || rep.status === this.selectedStatus;

			return matchQuery && matchCat && matchBrgy && matchStatus;
		})
	);

	activeReport = $derived(
		this.activeReportId === null
			? null
			: this.items.find((r) => r.id === this.activeReportId) ?? null
	);

	groupedCount = $derived(this.filteredItems.filter((r) => r.groupCode !== null).length);
	flaggedCount = $derived(this.filteredItems.filter((r) => Boolean(r.residentFlag)).length);

	selectReport(id: string) {
		this.activeReportId = this.activeReportId === id ? null : id;
	}

	clearFilters() {
		this.searchQuery = '';
		this.selectedCategory = 'ALL';
		this.selectedBarangay = 'ALL';
		this.selectedStatus = 'ALL';
	}

	exportCsv() {
		const headers = [
			'Report Code',
			'Summary',
			'Category',
			'Street',
			'Barangay',
			'Submitted',
			'Group',
			'Status'
		];
		const rows = this.filteredItems.map((r) => [
			`"${r.code}"`,
			`"${r.summary.replaceAll('"', '""')}"`,
			`"${r.category}"`,
			`"${r.street}"`,
			`"${r.barangay}"`,
			`"${r.submittedAt}"`,
			`"${r.groupCode ?? 'Ungrouped'}"`,
			`"${r.status}"`
		]);
		const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'all-reports.csv';
		link.click();
		URL.revokeObjectURL(url);
	}
}

export const reports = new ReportsState();