// findSuggestions' time window, without the emulators: `pnpm --filter web test duplicates`.
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { findSuggestions } from './duplicates.svelte.ts';
import { DAY_MS, type ReportDoc } from './reports.svelte.ts';
import { DEFAULT_SETTINGS, settings } from './settings.svelte.ts';

vi.mock('#lib/firebase.ts', () => ({ app: {}, auth: {}, db: {} }));

const NOW = Date.UTC(2026, 10, 27);

function report(id: string, ageMs: number, extra: Partial<ReportDoc> = {}): ReportDoc {
	return {
		id,
		reporterId: 'resident',
		title: 'Deep pothole',
		category: 'road',
		street: 'Rizal St',
		area: 'Poblacion',
		reportCount: 1,
		status: 'received',
		reportedOn: 'Nov 1',
		receivedAt: 'Nov 1, 9:00 AM',
		danger: false,
		description: '',
		map: { x: 0.5, y: 0.5 },
		createdAt: new Date(NOW - ageMs),
		...extra
	} as ReportDoc;
}

const ids = (docs: ReportDoc[]) => findSuggestions(docs, new Set()).map((s) => s.id);

beforeAll(() => {
	// Any pair inside the radius and window is suggested, so only the window decides.
	settings.current = {
		...DEFAULT_SETTINGS,
		duplicates: { ...DEFAULT_SETTINGS.duplicates, windowDays: 30, threshold: 0 }
	};
});

describe('findSuggestions time window', () => {
	it('keeps a group whose gap rounds down to windowDays, drops one past it', () => {
		const resolved = { status: 'resolved' as const };
		expect(ids([report('R', 0), report('G', 30 * DAY_MS + 23 * 3_600_000, resolved)])).toEqual([
			'R->G'
		]);
		expect(ids([report('R', 0), report('G', 31 * DAY_MS, resolved)])).toEqual([]);
	});

	it('matches groups created at the same instant, whatever their order', () => {
		expect(ids([report('R', 0), report('G', 0)])).toEqual(['R->G', 'G->R']);
	});

	it('finds the in-window group past an older one of another category, oldest report first', () => {
		const docs = [
			report('NEW', 0),
			report('MID', 5 * DAY_MS, { category: 'drainage' }),
			report('OLD', 10 * DAY_MS, { status: 'resolved' }),
			report('ANCIENT', 100 * DAY_MS, { status: 'resolved' })
		];
		expect(ids(docs)).toEqual(['NEW->OLD']);
		// MID (another category) has nothing to match; a second road report lists after NEW.
		expect(ids([...docs, report('NEWEST', -DAY_MS)])).toEqual(['NEW->OLD', 'NEWEST->NEW']);
	});
});
