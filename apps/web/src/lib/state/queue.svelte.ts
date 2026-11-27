import {
	arrayUnion,
	deleteField,
	increment,
	runTransaction,
	serverTimestamp,
	updateDoc,
	writeBatch
} from 'firebase/firestore';

import { db } from '#lib/firebase.ts';
import { staff } from './auth.svelte.ts';
import {
	categoryLabels,
	DAY_MS,
	formatDay,
	formatDayTime,
	reportRef,
	reports,
	statusLabels,
	suggestionRef,
	type ReportDoc,
	type StatusCode
} from './reports.svelte.ts';
import { csvCell } from './report-list.svelte.ts';
import { settings, type Settings } from './settings.svelte.ts';

export type IssueStatus = 'In progress' | 'Verified' | 'Received' | 'Resolved';

export interface GroupReportItem {
	id: string;
	code: string;
	submitted: string;
	matchScore: string;
	mergedBy: string;
	canUnmerge: boolean;
}

export interface IssueGroup {
	/** The group's lead report id (reports/{id}); merged reports point at it via mergedInto. */
	id: string;
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

const statusCodes: Record<IssueStatus, StatusCode> = {
	Received: 'received',
	Verified: 'verified',
	'In progress': 'in_progress',
	Resolved: 'resolved'
};

/** The staff severity dropdown's options, by severity. */
const severityOptions: Record<number, string> = {
	4: '4 · Major: affects traffic',
	3: '3 · Moderate: night visibility',
	2: '2 · Minor: pedestrian detour',
	1: '1 · Low: intermittent'
};

/** Used until staff set a severity on the issue page. */
const DEFAULT_SEVERITY = 2;

/** Bar fill (0–1) for each safety impact level; also its contribution to the score. */
const safetyFill: Record<string, number> = { High: 0.9, Medium: 0.6, Low: 0.35 };

/**
 * Priority score, 0–100, with the weights from settings/priority (or `w`, for the weights
 * page preview). Same bars as the breakdown on the issue page.
 */
export function priorityScore(
	severity: number,
	safetyImpact: string,
	ageDays: number,
	count: number,
	w: Settings['weights'] = settings.current.weights
) {
	return Math.round(
		100 *
			(w.severity * (severity / 5) +
				w.safety * safetyFill[safetyImpact] +
				w.age * Math.min(1, ageDays * 0.07) +
				w.reports * Math.min(1, count * 0.15))
	);
}

function buildGroup(lead: ReportDoc, drafts: Record<string, string>, now: number): IssueGroup {
	const children = reports.childrenOf(lead.id);
	const members = [lead, ...children];
	const firstMs = Math.min(...members.map((m) => m.createdAt.getTime()));
	const ageDays = Math.max(0, Math.floor((now - firstMs) / DAY_MS));
	const severity = lead.severity ?? DEFAULT_SEVERITY;
	const safetyImpact = members.some((m) => m.danger) ? 'High' : 'Medium';
	// reportCount on the lead already includes merged reports (added on merge).
	const count = lead.reportCount;
	// Residents of a merged report can reopen it themselves (the rules don't let them touch
	// the lead), so a resolved group with an unresolved member is open again.
	const reopened = lead.status === 'resolved' && children.some((c) => c.status !== 'resolved');
	const ageLabel = ageDays === 0 ? 'today' : `${ageDays} ${ageDays === 1 ? 'day' : 'days'} ago`;

	return {
		id: lead.id,
		groupCode: lead.id,
		title: lead.title,
		category: categoryLabels[lead.category] ?? lead.category,
		street: lead.street,
		barangay: lead.area,
		firstReportedLabel: `first reported ${formatDay(new Date(firstMs))} (${ageLabel})`,
		reports: count,
		ageDays,
		score: priorityScore(severity, safetyImpact, ageDays, count),
		status: (reopened ? 'In progress' : statusLabels[lead.status]) as IssueStatus,
		photoCount: members.length,
		severityScore: severity,
		severitySelect: severityOptions[severity] ?? severityOptions[DEFAULT_SEVERITY],
		safetyImpact,
		residentUpdate: drafts[lead.id] ?? lead.statusNote ?? '',
		reportItems: [
			{
				id: lead.id,
				code: lead.id,
				submitted: lead.receivedAt,
				matchScore: 'First report',
				mergedBy: '—',
				canUnmerge: false
			},
			...children.map((child) => ({
				id: child.id,
				code: child.id,
				submitted: child.receivedAt,
				matchScore: child.mergeScore ?? '—',
				mergedBy: child.mergedBy ?? '—',
				canUnmerge: true
			}))
		]
	};
}

function errorText(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

class QueueState {
	selectedCategory = $state<string>('ALL');
	selectedBarangay = $state<string>('ALL');
	selectedIssueId = $state<string | null>(null);
	feedback = $state<string | null>(null);
	/** Unsent "Update to residents" text, by group id. */
	drafts = $state<Record<string, string>>({});

	/** Every issue group: reports that aren't merged into another one. */
	items = $derived.by(() => {
		const now = Date.now();
		return reports.docs.filter((d) => !d.mergedInto).map((d) => buildGroup(d, this.drafts, now));
	});

	categories = $derived(Array.from(new Set(this.items.map((i) => i.category))).sort());
	barangays = $derived(Array.from(new Set(this.items.map((i) => i.barangay))).sort());

	/** Open groups (not resolved) matching the filters, highest score first. */
	filteredItems = $derived(
		this.items
			.filter((item) => {
				const open = item.status !== 'Resolved';
				const matchCat = this.selectedCategory === 'ALL' || item.category === this.selectedCategory;
				const matchBrgy =
					this.selectedBarangay === 'ALL' || item.barangay === this.selectedBarangay;
				return open && matchCat && matchBrgy;
			})
			.sort((a, b) => b.score - a.score)
	);

	selectedIssue = $derived(
		this.selectedIssueId === null
			? null
			: (this.items.find((item) => item.id === this.selectedIssueId) ?? null)
	);

	criticalCount = $derived(
		this.filteredItems.filter((i) => i.score >= settings.current.criticalThreshold).length
	);

	/** Reports behind the listed groups. */
	reportTotal = $derived(this.filteredItems.reduce((sum, i) => sum + i.reports, 0));

	/** Median hours from submission to verification over the last 30 days, or null. */
	medianVerifyHours = $derived.by(() => {
		const since = Date.now() - 30 * DAY_MS;
		const hours = reports.docs
			.filter((d) => d.verifiedAtTs && d.verifiedAtTs.getTime() >= since)
			.map((d) => (d.verifiedAtTs!.getTime() - d.createdAt.getTime()) / 3_600_000)
			.sort((a, b) => a - b);
		if (hours.length === 0) return null;
		const mid = Math.floor(hours.length / 2);
		return hours.length % 2 ? hours[mid] : (hours[mid - 1] + hours[mid]) / 2;
	});

	openIssue(id: string) {
		this.feedback = null;
		this.selectedIssueId = id;
	}

	closeIssue() {
		this.feedback = null;
		this.selectedIssueId = null;
	}

	/** The lead report and every report merged into it. */
	#members(issueId: string) {
		const lead = reports.byId(issueId);
		return lead ? [lead, ...reports.childrenOf(issueId)] : [];
	}

	/** Sets the status on the group and every merged report, so each resident sees it. */
	async setStatus(issueId: string, label: IssueStatus) {
		const status = statusCodes[label];
		const now = new Date();
		const batch = writeBatch(db);
		for (const member of this.#members(issueId)) {
			const patch: Record<string, unknown> = { status };
			if (status !== 'received' && !member.verifiedAt) {
				patch.verifiedAt = formatDayTime(now);
				patch.verifiedAtTs = now;
			}
			if (status === 'resolved') {
				patch.resolvedOn = formatDay(now);
				// The mobile app asks the reporter "LGU marked this fixed. Is it?"
				patch.awaitingConfirmation = true;
			} else {
				patch.resolvedOn = deleteField();
				patch.awaitingConfirmation = deleteField();
			}
			batch.update(reportRef(member.id), patch);
		}
		try {
			await batch.commit();
			this.feedback = `Status set to ${label} on ${issueId}.`;
		} catch (error) {
			this.feedback = `Couldn't update the status: ${errorText(error)}`;
		}
	}

	async setSeverity(issueId: string, option: string) {
		const severity = Number.parseInt(option, 10);
		if (!Number.isInteger(severity)) return;
		try {
			await updateDoc(reportRef(issueId), { severity });
		} catch (error) {
			this.feedback = `Couldn't save the severity: ${errorText(error)}`;
		}
	}

	setDraft(issueId: string, text: string) {
		this.drafts[issueId] = text;
	}

	/** Splits a merged report back out into its own group. */
	async unmergeReport(issueId: string, reportCode: string) {
		try {
			await runTransaction(db, async (tx) => {
				// Read inside the transaction: another staff member or a stale tab may have unmerged
				// it already, and subtracting its count twice would leave the group undercounted.
				const snap = await tx.get(reportRef(reportCode));
				const child = snap.data() as ReportDoc | undefined;
				if (!child) throw new Error(`${reportCode} no longer exists.`);
				if (child.mergedInto !== issueId)
					throw new Error(`${reportCode} is no longer merged into ${issueId}.`);
				const patch: Record<string, unknown> = {
					mergedInto: deleteField(),
					mergeScore: deleteField(),
					mergedBy: deleteField(),
					mergedAt: deleteField(),
					// Don't suggest the same match again in duplicate review.
					notDuplicateOf: arrayUnion(issueId)
				};
				// Put back the report's own status; the group's was copied over it on merge and kept
				// in sync since. Reports merged before preMerge existed keep the group's values.
				const pre = child.preMerge;
				if (pre) {
					Object.assign(patch, {
						preMerge: deleteField(),
						status: pre.status,
						statusNote: pre.statusNote ?? deleteField(),
						assignedTo: pre.assignedTo ?? deleteField(),
						// Duplicate review never offers resolved reports, so these were never its own.
						resolvedOn: deleteField(),
						awaitingConfirmation: deleteField()
					});
					// If it was verified before the merge, verifiedAtTs is still its own; else both came later.
					if (pre.verifiedAt) patch.verifiedAt = pre.verifiedAt;
					else Object.assign(patch, { verifiedAt: deleteField(), verifiedAtTs: deleteField() });
				}
				tx.update(reportRef(reportCode), patch);
				tx.update(reportRef(issueId), { reportCount: increment(-(child.reportCount ?? 1)) });
				// Undoing a merge means the match was wrong; record that for the evaluation.
				tx.set(
					suggestionRef(reportCode, issueId),
					{
						reportId: reportCode,
						candidateGroupId: issueId,
						decision: 'rejected',
						unmerged: true,
						reviewedBy: staff.user?.uid ?? '',
						reviewedAt: serverTimestamp()
					},
					{ merge: true }
				);
			});
			this.feedback = `Unmerged ${reportCode} from ${issueId}.`;
		} catch (error) {
			this.feedback = `Couldn't unmerge ${reportCode}: ${errorText(error)}`;
		}
	}

	/** Posts the update as the status note on every report in the group. */
	async sendUpdate(issueId: string) {
		const issue = this.items.find((i) => i.id === issueId);
		if (!issue) return;
		const note = issue.residentUpdate.trim();
		if (!note) {
			this.feedback = 'Write an update before sending it.';
			return;
		}
		const batch = writeBatch(db);
		for (const member of this.#members(issueId)) {
			batch.update(reportRef(member.id), { statusNote: note });
		}
		try {
			await batch.commit();
			delete this.drafts[issueId];
			this.feedback = `Update sent to all ${issue.reports} reporters on ${issue.groupCode}.`;
		} catch (error) {
			this.feedback = `Couldn't send the update: ${errorText(error)}`;
		}
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
			csvCell(item.groupCode),
			csvCell(item.title),
			csvCell(item.category),
			csvCell(item.street),
			csvCell(item.barangay),
			item.reports,
			item.ageDays,
			item.score,
			csvCell(item.status)
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
