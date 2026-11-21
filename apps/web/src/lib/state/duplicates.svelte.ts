export type DuplicateDecision = 'merged' | 'rejected' | 'recurrence' | 'skipped';

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
		imageSimilarity: number;
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

const SAMPLE_SUGGESTIONS: DuplicateSuggestion[] = [
	{
		id: 'sug-1',
		newReport: {
			code: 'AY-01482',
			quote: '"About 1 m wide, near the jeepney stop."',
			category: 'Road damage',
			street: 'Gorordo Ave',
			reportedAt: 'Nov 15, 9:43 AM',
			gpsAccuracy: 'GPS accuracy ±8 m',
			note: 'Resident marked: danger to people',
			photoLabel: 'New report photo · AY-01482'
		},
		existingGroup: {
			code: 'G-0317',
			reportCount: 5,
			title: 'Deep pothole, northbound lane',
			category: 'Road damage',
			street: 'Gorordo Ave',
			firstReported: 'Nov 6',
			status: 'In progress',
			photos: [
				'Photo 1 of 5 · Initial inspection',
				'Photo 2 of 5 · Lane width angle',
				'Photo 3 of 5 · Curb reference',
				'Photo 4 of 5 · Close-up depth',
				'Photo 5 of 5 · Follow-up check'
			]
		},
		metrics: {
			badge: 'Likely duplicate',
			imageSimilarity: 0.91,
			distanceMeters: 14,
			maxRadiusMeters: 30,
			timeGapDays: 2,
			maxWindowDays: 30,
			combinedScore: 0.88
		},
		schematicCoords: {
			newDot: { x: '50%', y: '51%' },
			groupDot: { x: '56%', y: '54%' }
		}
	},
	{
		id: 'sug-2',
		newReport: {
			code: 'AY-01489',
			quote: '"Metal cover missing beside drainage grate."',
			category: 'Drainage',
			street: 'Colon St',
			reportedAt: 'Nov 15, 10:12 AM',
			gpsAccuracy: 'GPS accuracy ±6 m',
			note: 'Resident marked: hazard at night',
			photoLabel: 'New report photo · AY-01489'
		},
		existingGroup: {
			code: 'G-0294',
			reportCount: 4,
			title: 'Open manhole, no cover',
			category: 'Drainage',
			street: 'Colon St',
			firstReported: 'Nov 14',
			status: 'Verified',
			photos: [
				'Photo 1 of 3 · Street view',
				'Photo 2 of 3 · Drain opening',
				'Photo 3 of 3 · Corner landmark'
			]
		},
		metrics: {
			badge: 'Likely duplicate',
			imageSimilarity: 0.86,
			distanceMeters: 9,
			maxRadiusMeters: 30,
			timeGapDays: 1,
			maxWindowDays: 30,
			combinedScore: 0.84
		},
		schematicCoords: {
			newDot: { x: '48%', y: '49%' },
			groupDot: { x: '53%', y: '51%' }
		}
	}
];

class DuplicateReviewState {
	suggestions = $state<DuplicateSuggestion[]>(SAMPLE_SUGGESTIONS);
	totalCount = $state(12);
	currentIndex = $state(0);
	activePhotoIndex = $state(0);
	lastActionMessage = $state<string | null>(null);

	current = $derived(this.suggestions[this.currentIndex % this.suggestions.length]);
	displayNumber = $derived(Math.min(this.currentIndex + 1, this.totalCount));

	nextPhoto() {
		const totalPhotos = this.current.existingGroup.photos.length;
		this.activePhotoIndex = (this.activePhotoIndex + 1) % totalPhotos;
	}

	resolve(decision: DuplicateDecision) {
		const target = this.current;
		const labels: Record<DuplicateDecision, string> = {
			merged: `Merged ${target.newReport.code} into ${target.existingGroup.code}.`,
			rejected: `Marked ${target.newReport.code} as not a duplicate.`,
			recurrence: `Flagged ${target.newReport.code} as a recurrence of ${target.existingGroup.code}.`,
			skipped: `Skipped ${target.newReport.code} for now.`
		};

		this.lastActionMessage = labels[decision];
		this.activePhotoIndex = 0;

		if (this.currentIndex + 1 < this.totalCount) {
			this.currentIndex += 1;
		} else {
			this.currentIndex = 0;
		}
	}
}

export const duplicates = new DuplicateReviewState();