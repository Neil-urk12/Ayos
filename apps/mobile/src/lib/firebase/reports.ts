import { FirebaseError } from 'firebase/app';
import {
  collection,
  collectionGroup,
  deleteField,
  doc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';

import { collections, db } from './firestore';

/** Must match the reopen branch in firebase/firestore.rules exactly, or the write is denied. */
export const REOPEN_NOTE = 'Reopened after you said it is still broken';

/** Fields a resident writes when filing a report. Must match validNewReport in firestore.rules. */
export type NewReportFields = {
  title: string;
  category: string;
  street: string;
  area: string;
  reportedOn: string;
  receivedAt: string;
  danger: boolean;
  description: string;
  photoTone: string;
  map: { x: number; y: number };
  accuracy: number;
};

export type ReportSnapshot = { id: string; data: DocumentData };

const reportRef = (id: string) => doc(db, collections.reports, id);
const supporterRef = (reportId: string, uid: string) =>
  doc(db, collections.reports, reportId, collections.supporters, uid);

const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Short, readable report ids like "AY-7KQ2MX", used as the Firestore document id. */
export function newReportId() {
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }
  return `AY-${suffix}`;
}

/** Calls back with every report, including pending local writes. */
export function watchReports(
  onChange: (reports: ReportSnapshot[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, collections.reports),
    (snap) =>
      onChange(
        snap.docs.map((d) => ({ id: d.id, data: d.data({ serverTimestamps: 'estimate' }) })),
      ),
    onError,
  );
}

/** Calls back with the ids of every report the user filed or joined. */
export function watchJoinedReportIds(
  uid: string,
  onChange: (ids: Set<string>) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collectionGroup(db, collections.supporters), where('uid', '==', uid)),
    (snap) => onChange(new Set(snap.docs.map((d) => d.ref.parent.parent?.id ?? ''))),
    onError,
  );
}

/** Creates the report and the reporter's supporters/{uid} doc in one batch, as the rules require. */
export function createReport(id: string, uid: string, fields: NewReportFields) {
  const batch = writeBatch(db);
  batch.set(reportRef(id), {
    ...fields,
    reporterId: uid,
    reportCount: 1,
    status: 'received',
    createdAt: serverTimestamp(),
  });
  batch.set(supporterRef(id, uid), { uid, joinedAt: serverTimestamp() });
  return batch.commit();
}

/** Adds the user to an existing report: reportCount + 1 alongside their supporters/{uid} doc. */
export function joinReport(id: string, uid: string) {
  const batch = writeBatch(db);
  batch.update(reportRef(id), { reportCount: increment(1) });
  batch.set(supporterRef(id, uid), { uid, joinedAt: serverTimestamp() });
  return batch.commit();
}

/** Answers "LGU marked this fixed. Is it?" for a resolved report. */
export function answerFix(id: string, fixed: boolean) {
  return updateDoc(
    reportRef(id),
    fixed
      ? { awaitingConfirmation: false }
      : {
          awaitingConfirmation: false,
          status: 'in_progress',
          statusNote: REOPEN_NOTE,
          // The rules reject null/undefined here; the field has to be removed.
          resolvedOn: deleteField(),
        },
  );
}

const messages: Record<string, string> = {
  'permission-denied': 'You don’t have permission to do that. Guests can’t send or join reports.',
  unavailable: 'No internet connection. Check your connection and try again.',
  'deadline-exceeded': 'The request timed out. Check your connection and try again.',
  'not-found': 'That report no longer exists.',
};

/** Turns a Firestore error from a report write into a sentence to show the user. */
export function reportErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError && messages[error.code]) {
    return messages[error.code];
  }
  return 'Something went wrong. Please try again.';
}
