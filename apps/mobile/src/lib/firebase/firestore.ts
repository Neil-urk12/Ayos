import { getFirestore } from 'firebase/firestore';

import { app } from './app';

export const db = getFirestore(app);

/** Firestore collection names, kept in one place so rules and code stay in sync. */
export const collections = {
  users: 'users',
  reports: 'reports',
  /** Subcollection under reports/{id}: one doc per resident who joined the report. */
  supporters: 'supporters',
} as const;
