import {
	categoryLabels,
	DAY_MS,
	formatDayTime,
	reports,
	statusLabels,
	type ReportDoc
} from './reports.svelte.ts';

export type ReportStatus = 'Received' | 'Verified' | 'In progress' | 'Resolved' | 'Duplicate';

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

/** One row per report doc. Group codes are lead report ids, as in the priority queue. */
function toCitizenReport(d: ReportDoc, leads: Set<string>, now: number): CitizenReport {
	return {
		id: d.id,
		code: d.id,
		summary: d.description || d.title,
		category: categoryLabels[d.category] ?? d.category,
		street: d.street,
		barangay: d.area,
		submittedAt: formatDayTime(d.createdAt),
		ageDays: Math.max(0, Math.floor((now - d.createdAt.getTime()) / DAY_MS)),
		gpsAccuracy: d.accuracy === undefined ? '—' : `±${Math.round(d.accuracy)} m`,
		residentFlag: d.danger ? 'Danger to people' : undefined,
		groupCode: d.mergedInto ?? (leads.has(d.id) ? d.id : null),
		matchScore: d.mergedInto ? (d.mergeScore ?? '—') : 'First report',
		status: d.mergedInto ? 'Duplicate' : ((statusLabels[d.status] ?? 'Received') as ReportStatus),
		notes: d.statusNote ?? ''
	};
}

/**
 * Quoted CSV cell. Residents write these fields, so a leading = + - @ (or tab/CR) gets a '
 * so spreadsheets show it as text instead of running it as a formula.
 */
export function csvCell(value: string) {
	const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
	return `"${safe.replaceAll('"', '""')}"`;
}

class ReportListState {
	/** Every report from the live Firestore store, newest first. */
	items = $derived.by(() => {
		const now = Date.now();
		const leads = new Set(reports.docs.flatMap((d) => (d.mergedInto ? [d.mergedInto] : [])));
		return [...reports.docs]
			.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
			.map((d) => toCitizenReport(d, leads, now));
	});
	searchQuery = $state('');
	selectedCategory = $state('ALL');
	selectedBarangay = $state('ALL');
	selectedStatus = $state('ALL');
	activeReportId = $state<string | null>(null);

	categories = $derived(Array.from(new Set(this.items.map((r) => r.category))).sort());
	barangays = $derived(Array.from(new Set(this.items.map((r) => r.barangay))).sort());
	statuses: ReportStatus[] = ['Received', 'Verified', 'In progress', 'Resolved', 'Duplicate'];

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
		const rows = this.filteredItems.map((r) =>
			[
				r.code,
				r.summary,
				r.category,
				r.street,
				r.barangay,
				r.submittedAt,
				r.groupCode ?? 'Ungrouped',
				r.status
			].map(csvCell)
		);
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

export const reportList = new ReportListState();
