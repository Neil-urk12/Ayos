import { defineEnvVars } from '@sveltejs/kit/env';

/** Firebase web config (see .env.example). Not secrets, so they're public and inlined. */
const firebaseVar = (description: string) => ({
	public: true as const,
	static: true as const,
	// Optional, so a missing value warns in src/lib/firebase.ts instead of failing the build.
	schema: (value: string | undefined) => value,
	description
});

export const variables = defineEnvVars({
	PUBLIC_FIREBASE_API_KEY: firebaseVar('Firebase web app apiKey'),
	PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseVar('Firebase web app authDomain'),
	PUBLIC_FIREBASE_PROJECT_ID: firebaseVar('Firebase projectId'),
	PUBLIC_FIREBASE_STORAGE_BUCKET: firebaseVar('Firebase storageBucket'),
	PUBLIC_FIREBASE_MESSAGING_SENDER_ID: firebaseVar('Firebase messagingSenderId'),
	PUBLIC_FIREBASE_APP_ID: firebaseVar('Firebase web app appId')
});
