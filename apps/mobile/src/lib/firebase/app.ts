import { getApp, getApps, initializeApp } from 'firebase/app';

import { firebaseConfig } from './config';

/** Reuses the existing app on Fast Refresh instead of initializing twice. */
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
