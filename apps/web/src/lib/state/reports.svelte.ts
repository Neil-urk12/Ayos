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
	/** GPS position from the mobile app (FR-04); missing on reports from before GPS. */
	location?: { latitude: number; longitude: number };
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
	/** Photo similarity (0–1) to each nearby group, keyed by group id, from on_report_created. */
	imageScores?: Record<string, number>;
}

/** Metres covered by the full width/height of the mobile app's neighbourhood map. */
const MAP_SPAN_METRES = 3000;

export function mapDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
	return Math.hypot(a.x - b.x, a.y - b.y) * MAP_SPAN_METRES;
}

type LatLng = { latitude: number; longitude: number };

/** Metres between two GPS points (haversine), same as the app and functions/scoring.py. */
function gpsDistance(a: LatLng, b: LatLng) {
	const rad = Math.PI / 180;
	const h =
		Math.sin(((b.latitude - a.latitude) * rad) / 2) ** 2 +
		Math.cos(a.latitude * rad) *
			Math.cos(b.latitude * rad) *
			Math.sin(((b.longitude - a.longitude) * rad) / 2) ** 2;
	return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/** Metres between two reports: GPS when both have it, else their positions on the map drawing. */
export function reportDistance(
	a: { map: { x: number; y: number }; location?: LatLng },
	b: { map: { x: number; y: number }; location?: LatLng }
) {
	return a.location && b.location ? gpsDistance(a.location, b.location) : mapDistance(a.map, b.map);
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
		location:
			typeof data.location?.latitude === 'number' && typeof data.location?.longitude === 'number'
				? {
						latitude: data.location.latitude,
						longitude: data.location.longitude
					}
				: undefined,
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
