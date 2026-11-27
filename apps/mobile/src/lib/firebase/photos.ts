import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { doc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';

import { collections, db } from './firestore';

/**
 * Report photos live in Firestore, not Cloud Storage, so the project can stay on the free
 * Spark plan. A Firestore document is capped at 1 MiB, so photos are shrunk first:
 *
 * - reports/{id}/photos/{uid}_{n}: the photo, longest side 1024 px, as a JPEG data URI.
 * - reports/{id}.thumbnail: a 240 px copy of the reporter's first photo, for lists and the map,
 *   so loading the report list doesn't download every full photo.
 */

/** Must stay under the size checks in firebase/firestore.rules. */
export const MAX_PHOTO_CHARS = 900_000;
export const MAX_THUMBNAIL_CHARS = 60_000;

const PHOTO_SIDE = 1024;
const THUMBNAIL_SIDE = 240;

export type LocalPhoto = { uri: string; width?: number; height?: number };

/** The picker's size, or the decoded size when it reported 0 (so small photos aren't enlarged). */
async function sizeOf(photo: LocalPhoto): Promise<{ width: number; height: number }> {
  if (photo.width && photo.height) return { width: photo.width, height: photo.height };
  const probe = await ImageManipulator.manipulate(photo.uri).renderAsync();
  try {
    return { width: probe.width, height: probe.height };
  } finally {
    probe.release();
  }
}

/** Resizes so the longest side is at most `side`, then JPEG-encodes as a data URI under `maxChars`. */
async function encode(photo: LocalPhoto, side: number, maxChars: number): Promise<string> {
  const { width, height } = await sizeOf(photo);
  const context = ImageManipulator.manipulate(photo.uri);
  if (Math.max(width, height) > side) {
    context.resize(width >= height ? { width: side } : { height: side });
  }
  const image = await context.renderAsync();
  try {
    // Lower the quality until it fits; a busy 1024 px photo is usually 150–400 KB at 0.6.
    for (const compress of [0.6, 0.45, 0.3, 0.2]) {
      const { base64 } = await image.saveAsync({ format: SaveFormat.JPEG, compress, base64: true });
      const dataUri = `data:image/jpeg;base64,${base64 ?? ''}`;
      if (base64 && dataUri.length <= maxChars) return dataUri;
    }
  } finally {
    image.release();
  }
  throw new Error('The photo is too large to save, even after shrinking it.');
}

export const encodePhoto = (photo: LocalPhoto) => encode(photo, PHOTO_SIDE, MAX_PHOTO_CHARS);
export const encodeThumbnail = (photo: LocalPhoto) =>
  encode(photo, THUMBNAIL_SIDE, MAX_THUMBNAIL_CHARS);

/**
 * Saves uid's photos for a report as reports/{reportId}/photos/{uid}_{n}. Call it after the
 * user is a supporter of the report (they filed or joined it); the rules check that.
 */
export async function savePhotos(reportId: string, uid: string, photos: LocalPhoto[]) {
  if (photos.length === 0) return;
  const encoded = await Promise.all(photos.map(encodePhoto));
  // One batch so a report never ends up with only some of its photos.
  const batch = writeBatch(db);
  encoded.forEach((data, i) => {
    batch.set(doc(db, collections.reports, reportId, collections.photos, `${uid}_${i}`), {
      uid,
      data,
      createdAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

/** Puts a small copy of the reporter's first photo on the report, for lists and the map. */
export async function saveThumbnail(reportId: string, photo: LocalPhoto) {
  const thumbnail = await encodeThumbnail(photo);
  await updateDoc(doc(db, collections.reports, reportId), { thumbnail });
}
