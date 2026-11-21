export type IssueStatus = 'In progress' | 'Verified' | 'Received';

export interface GroupReportItem {
	id: string;
	code: string;
	submitted: string;
	matchScore: string;
	mergedBy: string;
	canUnmerge: boolean;
}

export interface IssueGroup {
	id: number;
	groupCode: string;
	title: string;
	category: string;
	street: string;
	barangay: string;
	firstReportedLabel: string;
	reports: number;
	ageDays: number;
	score: number;
	status: IssueStatus;
	photoCount: number;
	severityScore: number; // 1–5
	severitySelect: string;
	safetyImpact: string;
	residentUpdate: string;
	reportItems: GroupReportItem[];
}

const INITIAL_ISSUES: IssueGroup[] = [
	{
		id: 1,
		groupCode: 'G-0317',
		title: 'Deep pothole, northbound lane',
		category: 'Road damage',
		street: 'Gorordo Ave',
		barangay: 'Lahug',
		firstReportedLabel: 'first reported Nov 6 (9 days ago)',
		reports: 6,
		ageDays: 9,
		score: 88,
		status: 'In progress',
		photoCount: 6,
		severityScore: 4,
		severitySelect: '4 · Major: affects traffic',
		safetyImpact: 'High',
		residentUpdate: 'Repair crew scheduled for Nov 18. Please keep to the inner lane.',
		reportItems: [
			{
				id: 'r1',
				code: 'AY-01391',
				submitted: 'Nov 6, 7:12 AM',
				matchScore: 'First report',
				mergedBy: '—',
				canUnmerge: false
			},
			{
				id: 'r2',
				code: 'AY-01398',
				submitted: 'Nov 6, 5:40 PM',
				matchScore: '0.92',
				mergedBy: 'Engr. [NAME]',
				canUnmerge: true
			},
			{
				id: 'r3',
				code: 'AY-01420',
				submitted: 'Nov 8, 8:05 AM',
				matchScore: '0.84',
				mergedBy: 'Engr. [NAME]',
				canUnmerge: true
			},
			{
				id: 'r4',
				code: 'AY-01433',
				submitted: 'Nov 9, 6:30 PM',
				matchScore: '0.79',
				mergedBy: 'Staff [NAME]',
				canUnmerge: true
			},
			{
				id: 'r5',
				code: 'AY-01451',
				submitted: 'Nov 13, 9:15 AM',
				matchScore: '0.90',
				mergedBy: 'Staff [NAME]',
				canUnmerge: true
			},
			{
				id: 'r6',
				code: 'AY-01482',
				submitted: 'Nov 15, 9:43 AM',
				matchScore: '0.88',
				mergedBy: 'Engr. [NAME]',
				canUnmerge: true
			}
		]
	},
	{
		id: 2,
		groupCode: 'G-0294',
		title: 'Open manhole, no cover',
		category: 'Drainage',
		street: 'Colon St',
		barangay: 'Sto. Niño',
		firstReportedLabel: 'first reported Nov 14 (1 day ago)',
		reports: 4,
		ageDays: 1,
		score: 84,
		status: 'Verified',
		photoCount: 4,
		severityScore: 4,
		severitySelect: '4 · Major: affects traffic',
		safetyImpact: 'High',
		residentUpdate: 'Barricade placed on site; replacement cover ordered.',
		reportItems: [
			{
				id: 'r21',
				code: 'AY-01460',
				submitted: 'Nov 14, 8:20 AM',
				matchScore: 'First report',
				mergedBy: '—',
				canUnmerge: false
			},
			{
				id: 'r22',
				code: 'AY-01465',
				submitted: 'Nov 14, 1:15 PM',
				matchScore: '0.89',
				mergedBy: 'Engr. [NAME]',
				canUnmerge: true
			},
			{
				id: 'r23',
				code: 'AY-01471',
				submitted: 'Nov 14, 6:50 PM',
				matchScore: '0.85',
				mergedBy: 'Staff [NAME]',
				canUnmerge: true
			},
			{
				id: 'r24',
				code: 'AY-01489',
				submitted: 'Nov 15, 10:12 AM',
				matchScore: '0.86',
				mergedBy: 'Engr. [NAME]',
				canUnmerge: true
			}
		]
	},
	{
		id: 3,
		groupCode: 'G-0281',
		title: 'Row of streetlights out',
		category: 'Streetlight',
		street: 'Escario St',
		barangay: 'Camputhaw',
		firstReportedLabel: 'first reported Nov 10 (5 days ago)',
		reports: 3,
		ageDays: 5,
		score: 71,
		status: 'Verified',
		photoCount: 3,
		severityScore: 3,
		severitySelect: '3 · Moderate: night visibility',
		safetyImpact: 'Medium',
		residentUpdate: 'Electrical maintenance team assigned for evening inspection.',
		reportItems: [
			{
				id: 'r31',
				code: 'AY-01410',
				submitted: 'Nov 10, 7:45 PM',
				matchScore: 'First report',
				mergedBy: '—',
				canUnmerge: false
			},
			{
				id: 'r32',
				code: 'AY-01418',
				submitted: 'Nov 11, 8:10 PM',
				matchScore: '0.81',
				mergedBy: 'Staff [NAME]',
				canUnmerge: true
			},
			{
				id: 'r33',
				code: 'AY-01440',
				submitted: 'Nov 12, 7:05 PM',
				matchScore: '0.78',
				mergedBy: 'Staff [NAME]',
				canUnmerge: true
			}
		]
	},
	{
		id: 4,
		groupCode: 'G-0255',
		title: 'Flooding at canal inlet',
		category: 'Drainage',
		street: 'Salinas Dr',
		barangay: 'Lahug',
		firstReportedLabel: 'first reported Nov 3 (12 days ago)',
		reports: 3,
		ageDays: 12,
		score: 67,
		status: 'In progress',
		photoCount: 3,
		severityScore: 3,
		severitySelect: '3 · Moderate: standing water',
		safetyImpact: 'High',
		residentUpdate: 'Debris clearing scheduled along canal inlet.',
		reportItems: [
			{
				id: 'r41',
				code: 'AY-01370',
				submitted: 'Nov 3, 2:10 PM',
				matchScore: 'First report',
				mergedBy: '—',
				canUnmerge: false
			},
			{
				id: 'r42',
				code: 'AY-01385',
				submitted: 'Nov 5, 4:25 PM',
				matchScore: '0.83',
				mergedBy: 'Engr. [NAME]',
				canUnmerge: true
			},
			{
				id: 'r43',
				code: 'AY-01412',
				submitted: 'Nov 7, 11:00 AM',
				matchScore: '0.77',
				mergedBy: 'Staff [NAME]',
				canUnmerge: true
			}
		]
	},
	{
		id: 5,
		groupCode: 'G-0302',
		title: 'Collapsed sidewalk edge',
		category: 'Sidewalk',
		street: 'Juan Luna Ave',
		barangay: 'Mabolo',
		firstReportedLabel: 'first reported Nov 12 (3 days ago)',
		reports: 2,
		ageDays: 3,
		score: 52,
		status: 'Received',
		photoCount: 2,
		severityScore: 2,
		severitySelect: '2 · Minor: pedestrian detour',
		safetyImpact: 'Medium',
		residentUpdate: 'Logged for site assessment by district engineering.',
		reportItems: [
			{
				id: 'r51',
				code: 'AY-01444',
				submitted: 'Nov 12, 9:30 AM',
				matchScore: 'First report',
				mergedBy: '—',
				canUnmerge: false
			},
			{
				id: 'r52',
				code: 'AY-01468',
				submitted: 'Nov 14, 3:40 PM',
				matchScore: '0.80',
				mergedBy: 'Staff [NAME]',
				canUnmerge: true
			}
		]
	},
	{
		id: 6,
		groupCode: 'G-0299',
		title: 'Cracked asphalt patch',
		category: 'Road damage',
		street: 'Banilad Rd',
		barangay: 'Banilad',
		firstReportedLabel: 'first reported Nov 9 (6 days ago)',
		reports: 1,
		ageDays: 6,
		score: 41,
		status: 'Received',
		photoCount: 2,
		severityScore: 2,
		severitySelect: '2 · Minor: surface wear',
		safetyImpact: 'Low',
		residentUpdate: 'Queued for routine pavement patching review.',
		reportItems: [
			{
				id: 'r61',
				code: 'AY-01425',
				submitted: 'Nov 9, 10:15 AM',
				matchScore: 'First report',
				mergedBy: '—',
				canUnmerge: false
			}
		]
	},
	{
		id: 7,
		groupCode: 'G-0311',
		title: 'Flickering streetlight',
		category: 'Streetlight',
		street: 'V. Rama Ave',
		barangay: 'Guadalupe',
		firstReportedLabel: 'first reported Nov 13 (2 days ago)',
		reports: 1,
		ageDays: 2,
		score: 28,
		status: 'Received',
		photoCount: 1,
		severityScore: 1,
		severitySelect: '1 · Low: intermittent',
		safetyImpact: 'Low',
		residentUpdate: 'Queued for bulb/starter check.',
		reportItems: [
			{
				id: 'r71',
				code: 'AY-01455',
				submitted: 'Nov 13, 7:55 PM',
				matchScore: 'First report',
				mergedBy: '—',
				canUnmerge: false
			}
		]
	}
];

class QueueState {
	items = $state<IssueGroup[]>(INITIAL_ISSUES);
	selectedCategory = $state<string>('ALL');
	selectedBarangay = $state<string>('ALL');
	selectedIssueId = $state<number | null>(null);
	feedback = $state<string | null>(null);

	categories = $derived(Array.from(new Set(this.items.map((i) => i.category))).sort());
	barangays = $derived(Array.from(new Set(this.items.map((i) => i.barangay))).sort());

	filteredItems = $derived(
		this.items
			.filter((item) => {
				const matchCat = this.selectedCategory === 'ALL' || item.category === this.selectedCategory;
				const matchBrgy =
					this.selectedBarangay === 'ALL' || item.barangay === this.selectedBarangay;
				return matchCat && matchBrgy;
			})
			.sort((a, b) => b.score - a.score)
	);

	selectedIssue = $derived(
		this.selectedIssueId === null
			? null
			: (this.items.find((item) => item.id === this.selectedIssueId) ?? null)
	);

	criticalCount = $derived(this.filteredItems.filter((i) => i.score >= 80).length);

	openIssue(id: number) {
		this.feedback = null;
		this.selectedIssueId = id;
	}

	closeIssue() {
		this.feedback = null;
		this.selectedIssueId = null;
	}

	unmergeReport(issueId: number, reportCode: string) {
		const issue = this.items.find((i) => i.id === issueId);
		if (!issue) return;
		issue.reportItems = issue.reportItems.filter((r) => r.code !== reportCode);
		issue.reports = Math.max(1, issue.reportItems.length);
		this.feedback = `Unmerged ${reportCode} from ${issue.groupCode}.`;
	}

	sendUpdate(issueId: number) {
		const issue = this.items.find((i) => i.id === issueId);
		if (!issue) return;
		this.feedback = `Update sent to all ${issue.reports} reporters on ${issue.groupCode}.`;
	}

	exportCsv() {
		const headers = [
			'Rank',
			'Group Code',
			'Issue Group',
			'Category',
			'Street',
			'Barangay',
			'Reports',
			'Age Days',
			'Score',
			'Status'
		];
		const rows = this.filteredItems.map((item, idx) => [
			idx + 1,
			`"${item.groupCode}"`,
			`"${item.title.replaceAll('"', '""')}"`,
			`"${item.category}"`,
			`"${item.street}"`,
			`"${item.barangay}"`,
			item.reports,
			item.ageDays,
			item.score,
			`"${item.status}"`
		]);
		const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'priority-queue.csv';
		a.click();
		URL.revokeObjectURL(url);
	}
}

export const queue = new QueueState();
