import {
	PUBLIC_FIREBASE_API_KEY,
	PUBLIC_FIREBASE_APP_ID,
	PUBLIC_FIREBASE_AUTH_DOMAIN,
	PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	PUBLIC_FIREBASE_PROJECT_ID,
	PUBLIC_FIREBASE_STORAGE_BUCKET
} from '$app/env/public';
import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase web config from PUBLIC_FIREBASE_* env vars (declared in src/env.ts, values in
 * .env; see .env.example). Same project
 * as the mobile app. These values identify the project; they are not secrets. Access
 * is enforced by firebase/firestore.rules.
 */
const firebaseConfig: FirebaseOptions = {
	apiKey: PUBLIC_FIREBASE_API_KEY,
	authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: PUBLIC_FIREBASE_APP_ID
};

const missing = Object.entries(firebaseConfig)
	.filter(([, value]) => !value)
	.map(([key]) => key);

if (missing.length > 0) {
	console.warn(
		`[firebase] Missing config: ${missing.join(', ')}. Copy .env.example to .env and fill it in.`
	);
}

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
