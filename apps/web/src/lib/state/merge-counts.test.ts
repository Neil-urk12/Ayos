// Merge and unmerge keep each group's reportCount right. Runs the real dashboard state against
// the Auth and Firestore emulators: from the repo root, `pnpm test:web`.
import { initializeApp as initAdmin } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminDb, Timestamp } from 'firebase-admin/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { terminate } from 'firebase/firestore';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { auth, db } from '#lib/firebase.ts';
import { staff } from './auth.svelte.ts';
import { duplicates } from './duplicates.svelte.ts';
import { queue } from './queue.svelte.ts';
import { reports } from './reports.svelte.ts';

vi.mock('#lib/firebase.ts', async () => {
	const { initializeApp } = await import('firebase/app');
	const { connectAuthEmulator, getAuth } = await import('firebase/auth');
	const { connectFirestoreEmulator, getFirestore } = await import('firebase/firestore');
	const app = initializeApp({ projectId: 'demo-ayos', apiKey: 'demo' });
	const auth = getAuth(app);
	connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, {
		disableWarnings: true
	});
	const db = getFirestore(app);
	const [host, port] = process.env.FIRESTORE_EMULATOR_HOST!.split(':');
	connectFirestoreEmulator(db, host, Number(port));
	return { app, auth, db };
});

const PROJECT_ID = 'demo-ayos';
const DAY_MS = 86_400_000;
const adminDb = () => getAdminDb();

function report(ageDays: number, extra: Record<string, unknown> = {}) {
	return {
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
		createdAt: Timestamp.fromMillis(Date.now() - ageDays * DAY_MS),
		...extra
	};
}

/** reportCount and mergedInto of every report, read past the dashboard's local copy. */
async function counts() {
	const snap = await adminDb().collection('reports').get();
	return Object.fromEntries(
		snap.docs.map((d) => [d.id, [d.get('reportCount'), d.get('mergedInto') ?? null]])
	);
}

let stopReports = () => {};

beforeAll(async () => {
	const fs = process.env.FIRESTORE_EMULATOR_HOST;
	const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
	if (!fs || !authHost)
		throw new Error('Run with the emulators: pnpm test:web from the repo root.');
	await fetch(`http://${fs}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, {
		method: 'DELETE'
	});
	await fetch(`http://${authHost}/emulator/v1/projects/${PROJECT_ID}/accounts`, {
		method: 'DELETE'
	});

	initAdmin({ projectId: PROJECT_ID });
	const user = await getAdminAuth().createUser({
		email: 'staff@test.local',
		password: 'secret123'
	});
	await getAdminAuth().setCustomUserClaims(user.uid, { staff: true });

	// A is the oldest group. B is a newer report at the same spot with C already merged into it,
	// so B's count (2) includes C's (1).
	const batch = adminDb().batch();
	batch.set(adminDb().doc('reports/A'), report(3));
	batch.set(adminDb().doc('reports/B'), report(2, { reportCount: 2 }));
	batch.set(adminDb().doc('reports/C'), report(1, { mergedInto: 'B' }));
	await batch.commit();

	staff.init();
	await signInWithEmailAndPassword(auth, 'staff@test.local', 'secret123');
	stopReports = reports.start();
	await vi.waitFor(
		() => {
			expect(staff.user).not.toBeNull();
			expect(reports.docs).toHaveLength(3);
		},
		{ timeout: 10_000 }
	);
});

afterAll(async () => {
	stopReports();
	await signOut(auth);
	await terminate(db);
});

describe('merge and unmerge counts', () => {
	it('merging moves the report and its children; unmerging takes back only its own count', async () => {
		expect(duplicates.current?.id).toBe('B->A');
		await duplicates.resolve('merged');
		expect(duplicates.lastActionMessage).toBe('Merged B into A.');
		expect(await counts()).toEqual({ A: [3, null], B: [1, 'A'], C: [1, 'A'] });

		await queue.unmergeReport('A', 'B');
		expect(queue.feedback).toBe('Unmerged B from A.');
		expect(await counts()).toEqual({ A: [2, null], B: [1, null], C: [1, 'A'] });
	});

	it('unmerging the same report twice subtracts its count once', async () => {
		// Two staff at once, then a stale tab.
		await Promise.all([queue.unmergeReport('A', 'C'), queue.unmergeReport('A', 'C')]);
		await queue.unmergeReport('A', 'C');
		expect(queue.feedback).toBe("Couldn't unmerge C: C is no longer merged into A.");
		expect(await counts()).toEqual({ A: [1, null], B: [1, null], C: [1, null] });
	});
});
