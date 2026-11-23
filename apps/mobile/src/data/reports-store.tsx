import { createContext, useContext, useState, type ReactNode } from 'react';

import { colors } from '../constants/design';
import {
  categoryLabels,
  draftLocation,
  formatDay,
  formatTime,
  seedReports,
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

let nextNumber = 1483;

/**
 * In-memory report store with mock data. Swap for the real API once the backend exists.
 */
export function ReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>(seedReports);
  const [draft, setDraft] = useState<ReportDraft | null>(null);

  const update = (id: string, patch: (report: Report) => Partial<Report>) =>
    setReports((current) => current.map((r) => (r.id === id ? { ...r, ...patch(r) } : r)));

  const value: ReportsContextValue = {
    reports,
    draft,
    getReport: (id) => reports.find((r) => r.id === id),
    saveDraft: setDraft,
    findSimilar: (d) =>
      reports
        .filter((r) => r.category === d.category && draftLocation.nearby[r.id] !== undefined)
        .map((report) => ({ report, distance: draftLocation.nearby[report.id] }))
        .sort((a, b) => {
          const aOpen = a.report.status !== 'resolved' ? 0 : 1;
          const bOpen = b.report.status !== 'resolved' ? 0 : 1;
          return aOpen - bOpen || a.distance - b.distance;
        }),
    submitNew: (draft) => {
      const now = new Date();
      const id = `AY-0${nextNumber++}`;
      const report: Report = {
        id,
        title: `${categoryLabels[draft.category]} on ${draft.street}`,
        category: draft.category,
        street: draft.street,
        area: draft.area,
        distance: 0,
        reportCount: 1,
        status: 'received',
        mine: true,
        reportedOn: formatDay(now),
        reportedAgo: 'just now',
        receivedAt: `${formatDay(now)}, ${formatTime(now)}`,
        danger: draft.danger,
        description: draft.description,
        photoTone: colors.photo,
        map: { x: 0.44, y: 0.53 },
      };
      setReports((current) => [report, ...current]);
      return id;
    },
    joinExisting: (id) => {
      update(id, (r) => (r.mine ? {} : { mine: true, reportCount: r.reportCount + 1 }));
      return id;
    },
    confirmFix: (id, fixed) =>
      update(id, () =>
        fixed
          ? { awaitingConfirmation: false }
          : {
              awaitingConfirmation: false,
              status: 'in_progress',
              // Must match firebase/firestore.rules (reopen branch) exactly, or the write is denied.
              statusNote: 'Reopened after you said it is still broken',
              // shortcut: in-memory only; the Firestore write must use deleteField(), the rules reject null/undefined.
              resolvedOn: undefined,
            },
      ),
  };

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
}

export function useReports() {
  const context = useContext(ReportsContext);
  if (!context) throw new Error('useReports must be used inside <ReportsProvider>');
  return context;
}
