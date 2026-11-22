import { getAuth } from 'firebase/auth';

import { app } from './app';

/**
 * Web: getAuth persists the session in IndexedDB by default.
 * Android/iOS use auth.native.ts, which persists it in AsyncStorage.
 */
export const auth = getAuth(app);
