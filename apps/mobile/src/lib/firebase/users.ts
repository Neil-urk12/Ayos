import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type FieldValue,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';

import { collections, db } from './firestore';

export type UserRole = 'resident';

/** The users/{uid} document. Field names must match firebase/firestore.rules. */
export type UserProfile = {
  uid: string;
  fullName: string;
  email: string;
  lgu: string;
  role: UserRole;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

type NewUserDoc = Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

const userRef = (uid: string) => doc(db, collections.users, uid);

export function createUserProfile(input: {
  uid: string;
  fullName: string;
  email: string;
  lgu: string;
}) {
  const data: NewUserDoc = {
    uid: input.uid,
    fullName: input.fullName,
    email: input.email,
    lgu: input.lgu,
    role: 'resident',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  return setDoc(userRef(input.uid), data);
}

/** Calls back with the profile, or null if the document doesn't exist yet. */
export function watchUserProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    userRef(uid),
    // 'estimate' fills serverTimestamp() fields with a local time until the write lands.
    (snap) =>
      onChange(snap.exists() ? (snap.data({ serverTimestamps: 'estimate' }) as UserProfile) : null),
    onError,
  );
}
