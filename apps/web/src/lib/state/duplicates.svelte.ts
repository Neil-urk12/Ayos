import { SvelteSet } from 'svelte/reactivity';
import { arrayUnion, increment, runTransaction, serverTimestamp } from 'firebase/firestore';

import { db } from '#lib/firebase.ts';
import { staff } from './auth.svelte.ts';
import {
	categoryLabels,
	DAY_MS,
	mapDistance,
	reportRef,
	reports,
	statusLabels,
	suggestionRef,
	type ReportDoc
} from './reports.svelte.ts';
import { settings } from './settings.svelte.ts';

export type DuplicateDecision = 'merged' | 'rejected' | 'recurrence' | 'skipped';

/** What each decision is stored as in duplicateSuggestions/{id}.decision. */
const decisionValues: Record<Exclude<DuplicateDecision, 'skipped'>, string> = {
	merged: 'confirmed',
	rejected: 'rejected',
	recurrence: 'recurrence'
};

export interface DuplicateSuggestion {
	id: string;
	newReport: {
		code: string;
		quote: string;
		category: string;
		street: string;
		reportedAt: string;
		gpsAccuracy: string;
		note: string;
		photoLabel: string;
	};
	existingGroup: {
		code: string;
		reportCount: number;
		title: string;
		category: string;
		street: string;
		firstReported: string;
		status: string;
		photos: string[];
	};
	metrics: {
		badge: string;
		/** null until report photos are uploaded and compared. */
		imageSimilarity: number | null;
		distanceMeters: number;
		maxRadiusMeters: number;
		timeGapDays: number;
		maxWindowDays: number;
		combinedScore: number;
	};
	schematicCoords: {
		newDot: { x: string; y: string };
		groupDot: { x: string; y: string };
	};
}

/** Closeness in space and time, 0–1, with the weights from settings/priority. */
function matchScore(distance: number, gapDays: number) {
	const d = settings.current.duplicates;
	return (
		d.distanceWeight * (1 - distance / d.radiusMeters) + d.timeWeight * (1 - gapDays / d.windowDays)
	);
}

/** Position on the location schematic, as a % string, relative to the new report at 50%. */
function schematicOffset(metres: number, centre: number) {
	const pct = centre + (metres / settings.current.duplicates.radiusMeters) * 20;
	return `${Math.min(95, Math.max(5, Math.round(pct)))}%`;
}

function buildSuggestion(
	report: ReportDoc,
	group: ReportDoc,
	distance: number,
	gapDays: number,
	score: number
): DuplicateSuggestion {
	const members = [group, ...reports.childrenOf(group.id)];
	return {
		id: `${report.id}->${group.id}`,
		newReport: {
			code: report.id,
			quote: report.description ? `"${report.description}"` : 'No description given.',
			category: categoryLabels[report.category] ?? report.category,
			street: report.street,
			reportedAt: report.receivedAt,
			gpsAccuracy:
				report.accuracy !== undefined
					? `GPS accuracy ±${report.accuracy} m`
					: 'GPS accuracy not recorded',
			note: report.danger ? 'Resident marked: danger to people' : 'Not marked as a danger',
			photoLabel: `New report photo · ${report.id}`
		},
		existingGroup: {
			code: group.id,
			reportCount: group.reportCount,
			title: group.title,
			category: categoryLabels[group.category] ?? group.category,
			street: group.street,
			firstReported: group.reportedOn,
			status: statusLabels[group.status],
			photos: members.map((m, i) => `Photo ${i + 1} of ${members.length} · ${m.id}`)
		},
		metrics: {
			badge: group.status === 'resolved' ? 'Possible recurrence' : 'Likely duplicate',
			imageSimilarity: null,
			distanceMeters: Math.round(distance),
			maxRadiusMeters: settings.current.duplicates.radiusMeters,
			timeGapDays: gapDays,
			maxWindowDays: settings.current.duplicates.windowDays,
			combinedScore: score
		},
		schematicCoords: {
			newDot: { x: '50%', y: '51%' },
			groupDot: {
				x: schematicOffset((group.map.x - report.map.x) * 3000, 50),
				y: schematicOffset((group.map.y - report.map.y) * 3000, 51)
			}
		}
	};
}

/** For each unreviewed report, its best-scoring older group nearby in the same category. */
function findSuggestions(docs: ReportDoc[], skipped: ReadonlySet<string>): DuplicateSuggestion[] {
	const { radiusMeters, windowDays, threshold } = settings.current.duplicates;
	const groups = docs.filter((d) => !d.mergedInto);
	const suggestions: DuplicateSuggestion[] = [];

	for (const report of groups) {
		if (report.status === 'resolved' || report.recurrenceOf) continue;
		let best: { group: ReportDoc; distance: number; gapDays: number; score: number } | null = null;

		for (const group of groups) {
			if (group.id === report.id || group.category !== report.category) continue;
			if (group.createdAt.getTime() > report.createdAt.getTime()) continue;
			if (report.notDuplicateOf?.includes(group.id)) continue;
			if (skipped.has(`${report.id}->${group.id}`)) continue;

			const distance = mapDistance(report.map, group.map);
			const gapDays = Math.floor((report.createdAt.getTime() - group.createdAt.getTime()) / DAY_MS);
			if (distance > radiusMeters || gapDays > windowDays) continue;

			const score = matchScore(distance, gapDays);
			if (score >= threshold && (!best || score > best.score)) {
				best = { group, distance, gapDays, score };
			}
		}

		if (best) {
			suggestions.push(
				buildSuggestion(report, best.group, best.distance, best.gapDays, best.score)
			);
		}
	}

	// Oldest waiting first.
	return suggestions.sort(
		(a, b) =>
			(reports.byId(a.newReport.code)?.createdAt.getTime() ?? 0) -
			(reports.byId(b.newReport.code)?.createdAt.getTime() ?? 0)
	);
}

class DuplicateReviewState {
	/** Suggestions skipped this session, as "reportId->groupId". */
	skipped = new SvelteSet<string>();
	currentIndex = $state(0);
	activePhotoIndex = $state(0);
	lastActionMessage = $state<string | null>(null);

	suggestions = $derived(findSuggestions(reports.docs, this.skipped));
	totalCount = $derived(this.suggestions.length);

	current = $derived<DuplicateSuggestion | undefined>(
		this.suggestions.length > 0
			? this.suggestions[this.currentIndex % this.suggestions.length]
			: undefined
	);
	displayNumber = $derived(this.totalCount === 0 ? 0 : (this.currentIndex % this.totalCount) + 1);

	/** "Oldest waiting 6 h" for the queue KPI, or null when nothing is waiting. */
	oldestWaitingLabel = $derived.by(() => {
		const first = this.suggestions[0] && reports.byId(this.suggestions[0].newReport.code);
		if (!first) return null;
		const hours = Math.floor((Date.now() - first.createdAt.getTime()) / 3_600_000);
		return hours < 48
			? `Oldest waiting ${hours} h`
			: `Oldest waiting ${Math.floor(hours / 24)} days`;
	});

	nextPhoto() {
		if (!this.current) return;
		const totalPhotos = this.current.existingGroup.photos.length;
		if (totalPhotos === 0) return;
		this.activePhotoIndex = (this.activePhotoIndex + 1) % totalPhotos;
	}

	previous() {
		if (this.totalCount <= 1) return;
		this.activePhotoIndex = 0;
		this.currentIndex = (this.currentIndex - 1 + this.totalCount) % this.totalCount;
	}

	async resolve(decision: DuplicateDecision) {
		const target = this.current;
		if (!target) return;
		const reportId = target.newReport.code;
		const groupId = target.existingGroup.code;
		const report = reports.byId(reportId);
		const group = reports.byId(groupId);
		if (!report || !group) return;

		const labels: Record<DuplicateDecision, string> = {
			merged: `Merged ${reportId} into ${groupId}.`,
			rejected: `Marked ${reportId} as not a duplicate.`,
			recurrence: `Flagged ${reportId} as a recurrence of ${groupId}.`,
			skipped: `Skipped ${reportId} for now.`
		};
		this.activePhotoIndex = 0;

		if (decision === 'skipped') {
			this.skipped.add(target.id);
			this.lastActionMessage = labels.skipped;
			return;
		}

		if (decision === 'merged' && group.status === 'resolved') {
			// Merging would mark the new report fixed, with no way for its reporter to dispute it.
			this.lastActionMessage = `${groupId} is resolved. Use "Recurrence of a fixed issue" instead.`;
			return;
		}

		try {
			await runTransaction(db, async (tx) => {
				if (decision === 'merged') {
					// Read both inside the transaction so a join, merge or status change that lands
					// meanwhile is seen (the transaction retries if either changes).
					const [snap, groupSnap] = await Promise.all([
						tx.get(reportRef(reportId)),
						tx.get(reportRef(groupId))
					]);
					if (!snap.exists()) throw new Error(`${reportId} no longer exists.`);
					if (!groupSnap.exists()) throw new Error(`${groupId} no longer exists.`);
					const fresh = snap.data();
					const lead = groupSnap.data();
					// Merging into a report that is itself merged would hide this one from the queue.
					if (lead.mergedInto)
						throw new Error(`${groupId} was merged into ${lead.mergedInto}. Review it again.`);
					if (lead.status === 'resolved')
						throw new Error(`${groupId} is resolved. Use "Recurrence of a fixed issue" instead.`);
					// Another staff member merged it first; merging again would count it twice.
					if (fresh.mergedInto)
						throw new Error(`${reportId} was already merged into ${fresh.mergedInto}.`);
					const reportCount: number = fresh.reportCount ?? 1;
					// The report follows the group's status from now on, so its reporter sees progress.
					// Its own values are kept in preMerge for unmerge.
					const patch: Record<string, unknown> = {
						mergedInto: groupId,
						mergeScore: target.metrics.combinedScore.toFixed(2),
						mergedBy: staff.displayName,
						mergedAt: serverTimestamp(),
						status: lead.status,
						preMerge: {
							status: fresh.status ?? 'received',
							statusNote: fresh.statusNote ?? null,
							verifiedAt: fresh.verifiedAt ?? null,
							assignedTo: fresh.assignedTo ?? null
						}
					};
					if (lead.statusNote) patch.statusNote = lead.statusNote;
					if (lead.verifiedAt) patch.verifiedAt = lead.verifiedAt;
					if (lead.assignedTo) patch.assignedTo = lead.assignedTo;
					// Anything already merged into the report moves with it. Take their counts back
					// off the report so a later unmerge subtracts only the report's own count.
					const children = reports.childrenOf(reportId);
					if (children.length > 0) {
						patch.reportCount = reportCount - children.reduce((n, c) => n + c.reportCount, 0);
					}
					tx.update(reportRef(reportId), patch);
					for (const child of children) {
						// They follow the new group's status too, like the report itself.
						tx.update(reportRef(child.id), { mergedInto: groupId, status: lead.status });
					}
					// reportCount on the group counts everyone in it; unmerge takes it back off.
					tx.update(reportRef(groupId), { reportCount: increment(reportCount) });
				} else if (decision === 'rejected') {
					tx.update(reportRef(reportId), { notDuplicateOf: arrayUnion(groupId) });
				} else {
					tx.update(reportRef(reportId), { recurrenceOf: groupId });
				}
				// Keep the decision and the evidence for the duplicate-detection evaluation.
				tx.set(suggestionRef(reportId, groupId), {
					reportId,
					candidateGroupId: groupId,
					imageSimilarity: target.metrics.imageSimilarity,
					distanceM: target.metrics.distanceMeters,
					timeGapDays: target.metrics.timeGapDays,
					combinedScore: target.metrics.combinedScore,
					decision: decisionValues[decision],
					reviewedBy: staff.user?.uid ?? '',
					reviewedAt: serverTimestamp()
				});
			});
			this.lastActionMessage = labels[decision];
			// The suggestion drops out of the list; keep the position pointing at the next one.
			if (this.currentIndex >= this.totalCount) this.currentIndex = 0;
		} catch (error) {
			this.lastActionMessage = `Couldn't save: ${error instanceof Error ? error.message : error}`;
		}
	}
}

export const duplicates = new DuplicateReviewState();
