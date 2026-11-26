import { FirebaseError } from 'firebase/app';
import type { DocumentData } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import { colors } from '../constants/design';
import {
  answerFix,
  createReport,
  joinReport,
  mergedIntoOnServer,
  newReportId,
  reportErrorMessage,
  watchJoinedReportIds,
  watchReports,
  type ReportSnapshot,
} from '../lib/firebase/reports';
import { useAuth } from './auth-store';
import {
  categoryLabels,
  draftLocation,
  formatAgo,
  formatDay,
  formatTime,
  mapDistance,
  type Report,
  type ReportDraft,
} from './reports';

export type SimilarReport = { report: Report; distance: number };

type ReportsContextValue = {
  reports: Report[];
  draft: ReportDraft | null;
  getReport: (id: string) => Report | undefined;
  saveDraft: (draft: ReportDraft) => void;
  findSimilar: (draft: ReportDraft) => SimilarReport[];
  /** Files a draft as a new report and returns its id. */
  submitNew: (draft: ReportDraft) => string;
  /** Adds the draft to an existing report and returns that report's id. */
  joinExisting: (id: string) => string;
  confirmFix: (id: string, fixed: boolean) => void;
};

const ReportsContext = createContext<ReportsContextValue | null>(null);

/** Reports this close to the draft pin, in the same category, count as "already reported?". */
const SIMILAR_RADIUS_METRES = 50;

function toReport(id: string, data: DocumentData, mine: boolean): Report {
  const createdAt: Date = data.createdAt?.toDate?.() ?? new Date();
  const map = data.map ?? draftLocation.map;
  return {
    id,
    title: data.title ?? '',
    category: data.category,
    street: data.street ?? '',
    area: data.area ?? '',
    distance: mapDistance(map, draftLocation.map),
    reportCount: data.reportCount ?? 1,
    status: data.status ?? 'received',
    statusNote: data.statusNote,
    mine,
    reportedOn: data.reportedOn ?? formatDay(createdAt),
    reportedAgo: formatAgo(createdAt),
    receivedAt: data.receivedAt ?? '',
    verifiedAt: data.verifiedAt,
    assignedTo: data.assignedTo,
    resolvedOn: data.resolvedOn,
    awaitingConfirmation: data.awaitingConfirmation,
    danger: data.danger,
    description: data.description,
    photoTone: data.photoTone ?? colors.photo,
    map,
    mergedInto: data.mergedInto,
  };
}

function createdMs(data: DocumentData): number {
  return data.createdAt?.toMillis?.() ?? Date.now();
}

function showWriteError(title: string) {
  return (error: unknown) => {
    console.warn(`[reports] ${title}:`, error);
    Alert.alert(title, reportErrorMessage(error));
  };
}

/** Reports from Firestore (reports/{id}), kept live with onSnapshot. */
export function ReportsProvider({ children }: { children: ReactNode }) {
  const { user, signedIn, isGuest } = useAuth();
  const uid = signedIn && user ? user.uid : null;

  // Tagged with the uid they were loaded for, so another account's data is never shown.
  const [loaded, setLoaded] = useState<{ uid: string; docs: ReportSnapshot[] } | null>(null);
  const [joined, setJoined] = useState<{ uid: string; ids: Set<string> } | null>(null);
  const [draft, setDraft] = useState<ReportDraft | null>(null);

  useEffect(() => {
    if (!uid) return;
    return watchReports(
      (docs) => setLoaded({ uid, docs }),
      (error) => console.warn('[reports] Could not load reports:', error.message),
    );
  }, [uid]);

  useEffect(() => {
    // Guests can't file or join reports, so they have none of their own.
    if (!uid || isGuest) return;
    return watchJoinedReportIds(
      uid,
      (ids) => setJoined({ uid, ids }),
      (error) => console.warn('[reports] Could not load your reports:', error.message),
    );
  }, [uid, isGuest]);

  const docs = loaded && loaded.uid === uid ? loaded.docs : [];
  const joinedIds = joined && joined.uid === uid ? joined.ids : new Set<string>();
  // Newest first, like the old in-memory list.
  const reports = [...docs]
    .sort((a, b) => createdMs(b.data) - createdMs(a.data))
    .map(({ id, data }) =>
      toReport(id, data, joinedIds.has(id) || (uid !== null && data.reporterId === uid)),
    );

  const value: ReportsContextValue = {
    reports,
    draft,
    getReport: (id) => reports.find((r) => r.id === id),
    saveDraft: setDraft,
    findSimilar: (d) =>
      reports
        // Merged reports are part of another report's group; match the group instead.
        .filter((r) => r.category === d.category && !r.mergedInto)
        .map((report) => ({ report, distance: mapDistance(report.map, draftLocation.map) }))
        .filter(({ distance }) => distance <= SIMILAR_RADIUS_METRES)
        .sort((a, b) => {
          const aOpen = a.report.status !== 'resolved' ? 0 : 1;
          const bOpen = b.report.status !== 'resolved' ? 0 : 1;
          return aOpen - bOpen || a.distance - b.distance;
        }),
    submitNew: (draft) => {
      const id = newReportId();
      if (!uid) return id;
      const now = new Date();
      // The write shows up in the reports snapshot straight away (pending), so the
      // report screen can open on it before the server confirms.
      createReport(id, uid, {
        title: `${categoryLabels[draft.category]} on ${draft.street}`,
        category: draft.category,
        street: draft.street,
        area: draft.area,
        reportedOn: formatDay(now),
        receivedAt: `${formatDay(now)}, ${formatTime(now)}`,
        danger: draft.danger,
        description: draft.description,
        photoTone: colors.photo,
        map: draftLocation.map,
        accuracy: draft.accuracy,
      }).catch(showWriteError('Couldn’t send your report'));
      return id;
    },
    joinExisting: (id) => {
      const report = reports.find((r) => r.id === id);
      if (uid && report && !report.mine) {
        joinReport(id, uid).catch(async (error) => {
          if (!(error instanceof FirebaseError && error.code === 'permission-denied')) {
            showWriteError('Couldn’t add your report')(error);
            return;
          }
          // Guests can't reach this screen, so a denial means either the user is already a
          // supporter (the joined-ids snapshot hadn't loaded yet) or staff merged the report
          // meanwhile. Only the second loses the join, so only that one is worth telling.
          const group = await mergedIntoOnServer(id).catch(() => undefined);
          if (group) {
            Alert.alert(
              'Couldn’t add your report',
              `This report was just combined with ${group}. Open ${group} and add yours there.`,
            );
          }
        });
      }
      return id;
    },
    confirmFix: (id, fixed) => {
      answerFix(id, fixed).catch(showWriteError('Couldn’t save your answer'));
    },
  };

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
}

export function useReports() {
  const context = useContext(ReportsContext);
  if (!context) throw new Error('useReports must be used inside <ReportsProvider>');
  return context;
}
