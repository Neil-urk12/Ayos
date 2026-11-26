import { collection, doc, onSnapshot, type DocumentData, type Timestamp } from 'firebase/firestore';

import { db } from '#lib/firebase.ts';

export type CategoryCode = 'road' | 'drainage' | 'streetlight' | 'sidewalk';
export type StatusCode = 'received' | 'verified' | 'in_progress' | 'resolved';

export const categoryLabels: Record<CategoryCode, string> = {
	road: 'Road damage',
	drainage: 'Drainage',
	streetlight: 'Streetlight',
	sidewalk: 'Sidewalk'
};

export const statusLabels: Record<StatusCode, string> = {
	received: 'Received',
	verified: 'Verified',
	in_progress: 'In progress',
	resolved: 'Resolved'
};

/**
 * A reports/{id} document. Residents write the first block from the mobile app
 * (apps/mobile/src/data/reports-store.tsx); staff write the rest from this dashboard.
 */
export interface ReportDoc {
	id: string;
	reporterId: string;
	title: string;
	category: CategoryCode;
	street: string;
	area: string;
	reportCount: number;
	status: StatusCode;
	reportedOn: string;
	receivedAt: string;
	danger: boolean;
	description: string;
	map: { x: number; y: number };
	accuracy?: number;
	createdAt: Date;

	// Staff fields. The *On/*At strings are what the mobile app shows as-is.
	statusNote?: string;
	assignedTo?: string;
	verifiedAt?: string;
	/** When the report was first verified, for the time-to-verify KPI. */
	verifiedAtTs?: Date;
	resolvedOn?: string;
	awaitingConfirmation?: boolean;
	/** 1–5, set by staff on the issue page. */
	severity?: number;
	/** The group (report id) this report was merged into by duplicate review. */
	mergedInto?: string;
	mergeScore?: string;
	mergedBy?: string;
	/** The report's own fields before the merge copied the group's over them; restored on unmerge. */
	preMerge?: {
		status: StatusCode;
		statusNote: string | null;
		verifiedAt: string | null;
		assignedTo: string | null;
	};
	/** Groups staff said this report is not a duplicate of. */
	notDuplicateOf?: string[];
	/** A fixed group this report was flagged as a recurrence of. */
	recurrenceOf?: string;
}

/** Metres covered by the full width/height of the mobile app's neighbourhood map. */
const MAP_SPAN_METRES = 3000;

export function mapDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
	return Math.hypot(a.x - b.x, a.y - b.y) * MAP_SPAN_METRES;
}

export const DAY_MS = 24 * 60 * 60 * 1000;

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Nov 15", matching the mobile app. */
export function formatDay(date: Date) {
	return `${months[date.getMonth()]} ${date.getDate()}`;
}

/** "Nov 15, 9:43 AM", matching the mobile app. */
export function formatDayTime(date: Date) {
	const hours = date.getHours();
	const minutes = String(date.getMinutes()).padStart(2, '0');
	return `${formatDay(date)}, ${hours % 12 || 12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
}

export const reportRef = (id: string) => doc(db, 'reports', id);

/** duplicateSuggestions/{reportId}_{groupId}: the staff decision on one suggested match. */
export const suggestionRef = (reportId: string, groupId: string) =>
	doc(db, 'duplicateSuggestions', `${reportId}_${groupId}`);

const toDate = (value: unknown): Date | undefined =>
	(value as Timestamp | undefined)?.toDate?.() ?? undefined;

function toReportDoc(id: string, data: DocumentData): ReportDoc {
	return {
		...(data as Omit<ReportDoc, 'id' | 'createdAt' | 'verifiedAtTs'>),
		id,
		reportCount: data.reportCount ?? 1,
		map: data.map ?? { x: 0.5, y: 0.5 },
		createdAt: toDate(data.createdAt) ?? new Date(),
		verifiedAtTs: toDate(data.verifiedAtTs)
	};
}

/** Live copy of every report, shared by the queue and duplicate review. */
class ReportsState {
	docs = $state<ReportDoc[]>([]);
	loaded = $state(false);
	error = $state<string | null>(null);

	/** Starts listening; returns a function that stops. Call once signed in as staff. */
	start() {
		return onSnapshot(
			collection(db, 'reports'),
			(snap) => {
				this.docs = snap.docs.map((d) =>
					toReportDoc(d.id, d.data({ serverTimestamps: 'estimate' }))
				);
				this.loaded = true;
				this.error = null;
			},
			(error) => {
				console.warn('[reports] Could not load reports:', error);
				this.error = 'Couldn’t load reports. Check your connection and staff access.';
			}
		);
	}

	stop() {
		this.docs = [];
		this.loaded = false;
	}

	byId(id: string) {
		return this.docs.find((d) => d.id === id);
	}

	/** Reports merged into `groupId`, oldest first. */
	childrenOf(groupId: string) {
		return this.docs
			.filter((d) => d.mergedInto === groupId)
			.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
	}
}

export const reports = new ReportsState();
