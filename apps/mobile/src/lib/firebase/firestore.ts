import { getFirestore } from 'firebase/firestore';

import { app } from './app';

export const db = getFirestore(app);

/** Firestore collection names, kept in one place so rules and code stay in sync. */
export const collections = {
  users: 'users',
  reports: 'reports',
  /** Subcollection under reports/{id}: one doc per resident who joined the report. */
  supporters: 'supporters',
  /** Subcollection under reports/{id}: one doc per photo, stored as a base64 data URI. */
  photos: 'photos',
  /** Road safety tips shown on the Safety tips tab. */
  tips: 'tips',
} as const;
