import { collection, onSnapshot, type Unsubscribe } from 'firebase/firestore';

import { collections, db } from './firestore';

/** A tips/{tipId} document. `audience` is a Safety tips tab, or 'all' for every tab. */
export type TipDoc = {
  id: string;
  audience: string;
  order: number;
  icon: string;
  category: string;
  title: string;
  body: string;
};

/** Calls back with every tip. Tips are edited in the Firebase console (FR-21 has no screen yet). */
export function watchTips(
  onChange: (tips: TipDoc[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, collections.tips),
    (snap) =>
      onChange(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            audience: String(data.audience ?? 'all'),
            order: Number(data.order ?? 0),
            icon: String(data.icon ?? 'shield'),
            category: String(data.category ?? ''),
            title: String(data.title ?? ''),
            body: String(data.body ?? ''),
          };
        }),
      ),
    onError,
  );
}
