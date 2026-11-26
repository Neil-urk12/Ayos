// Fills a fresh Firestore with the starting data the apps read:
//   tips/{tipId}       the road safety tips from apps/mobile/src/data/default-tips.json
//   settings/priority  default priority weights and duplicate thresholds
// Existing data is left alone, so it's safe to run again. Edit both afterwards in the
// Firebase console.
//
// Usage (same key as set-staff):
//   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json pnpm seed
import { readFile } from 'node:fs/promises';

import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

// Keep in sync with DEFAULT_SETTINGS in src/lib/state/settings.svelte.ts.
const DEFAULT_SETTINGS = {
	weights: { severity: 0.35, safety: 0.3, age: 0.15, reports: 0.2 },
	criticalThreshold: 80,
	duplicates: {
		radiusMeters: 30,
		windowDays: 30,
		threshold: 0.75,
		distanceWeight: 0.6,
		timeWeight: 0.4
	}
};

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const tipsFile = new URL('../../mobile/src/data/default-tips.json', import.meta.url);
const tips = JSON.parse(await readFile(tipsFile, 'utf8'));

const existingTips = await db.collection('tips').limit(1).get();
if (existingTips.empty) {
	const batch = db.batch();
	for (const { id, ...tip } of tips) {
		batch.set(db.collection('tips').doc(id), { ...tip, updatedAt: FieldValue.serverTimestamp() });
	}
	await batch.commit();
	console.log(`Added ${tips.length} tips.`);
} else {
	console.log('tips already has documents; left unchanged.');
}

const settingsRef = db.collection('settings').doc('priority');
if (!(await settingsRef.get()).exists) {
	await settingsRef.set({ ...DEFAULT_SETTINGS, updatedAt: FieldValue.serverTimestamp() });
	console.log('Added settings/priority with default weights and thresholds.');
} else {
	console.log('settings/priority already exists; left unchanged.');
}
