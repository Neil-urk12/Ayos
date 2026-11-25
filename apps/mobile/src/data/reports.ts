export type Category = 'road' | 'drainage' | 'streetlight' | 'sidewalk';
export type ReportStatus = 'received' | 'verified' | 'in_progress' | 'resolved';

export type Report = {
  id: string;
  title: string;
  category: Category;
  street: string;
  area: string;
  /** Distance from the user's current location, in metres. */
  distance: number;
  /** Everyone who reported this issue, the user included when `mine` is true. */
  reportCount: number;
  status: ReportStatus;
  statusNote?: string;
  mine: boolean;
  /** Short date for lists, e.g. "Nov 15". */
  reportedOn: string;
  reportedAgo: string;
  receivedAt: string;
  verifiedAt?: string;
  assignedTo?: string;
  resolvedOn?: string;
  /** Resolved by the LGU but the user has not confirmed the fix yet. */
  awaitingConfirmation?: boolean;
  danger?: boolean;
  description?: string;
  photoTone: string;
  /** Position on the neighbourhood map, as fractions of its width and height. */
  map: { x: number; y: number };
  /** Set by LGU staff when they merge this report into another report's group. */
  mergedInto?: string;
};

export type ReportDraft = {
  category: Category;
  description: string;
  danger: boolean;
  street: string;
  area: string;
  accuracy: number;
  photoTakenAt: string;
};

export const categoryLabels: Record<Category, string> = {
  road: 'Road damage',
  drainage: 'Drainage',
  streetlight: 'Streetlight',
  sidewalk: 'Sidewalk',
};

export const categoryOrder: Category[] = ['road', 'drainage', 'streetlight', 'sidewalk'];

export const statusLabels: Record<ReportStatus, string> = {
  received: 'Received',
  verified: 'Verified',
  in_progress: 'In progress',
  resolved: 'Resolved',
};

/**
 * The spot the "New report" GPS fix lands on, used for new reports, distances and the
 * duplicate check. shortcut: fixed until the app reads real GPS.
 */
export const draftLocation = {
  street: 'Gorordo Ave',
  area: 'Lahug',
  accuracy: 8,
  map: { x: 0.44, y: 0.53 },
};

/** Metres covered by the full width/height of the neighbourhood map. */
const MAP_SPAN_METRES = 3000;

/** Distance between two map positions, in metres. */
export function mapDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y) * MAP_SPAN_METRES;
}

export function othersCount(report: Report) {
  return report.mine ? report.reportCount - 1 : report.reportCount;
}

export function formatDistance(metres: number) {
  if (metres < 1000) return `${Math.round(metres)} m`;
  const km = metres / 1000;
  return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDay(date: Date) {
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

export function formatTime(date: Date) {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
}

/** "just now", "3 hours ago", "yesterday", "5 days ago", "2 weeks ago", ... */
export function formatAgo(date: Date, now = new Date()) {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return minutes === 1 ? 'a minute ago' : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? 'an hour ago' : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? 'a week ago' : `${weeks} weeks ago`;
  return formatDay(date);
}
