import type { FirebaseOptions } from 'firebase/app';

/**
 * Firebase web config, read from EXPO_PUBLIC_* env vars (see .env.example).
 * These values identify the project; they are not secrets. Access is enforced by
 * firestore.rules and storage.rules in firebase/.
 *
 * Expo only inlines env vars accessed as `process.env.EXPO_PUBLIC_X` literally,
 * so each one must be spelled out rather than looked up dynamically.
 */
export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missing = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.warn(
    `[firebase] Missing config: ${missing.join(', ')}. Copy .env.example to .env.local and fill it in.`,
  );
}
