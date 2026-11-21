import { colors } from '../constants/design';

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

export const seedReports: Report[] = [
  {
    id: 'AY-01482',
    title: 'Deep pothole, northbound lane',
    category: 'road',
    street: 'Gorordo Ave',
    area: 'Lahug',
    distance: 120,
    reportCount: 6,
    status: 'in_progress',
    statusNote: 'Crew scheduled this week',
    mine: true,
    reportedOn: 'Nov 15',
    reportedAgo: '2 days ago',
    receivedAt: 'Nov 15, 9:43 AM',
    verifiedAt: 'Nov 15, 11:10 AM',
    assignedTo: 'City Engineering',
    danger: true,
    photoTone: colors.photo,
    map: { x: 0.49, y: 0.24 },
  },
  {
    id: 'AY-01467',
    title: 'Clogged canal inlet',
    category: 'drainage',
    street: 'Salinas Dr',
    area: 'Lahug',
    distance: 340,
    reportCount: 3,
    status: 'verified',
    mine: true,
    reportedOn: 'Nov 12',
    reportedAgo: '5 days ago',
    receivedAt: 'Nov 12, 7:58 AM',
    verifiedAt: 'Nov 12, 3:20 PM',
    photoTone: colors.photoAlt,
    map: { x: 0.65, y: 0.47 },
  },
  {
    id: 'AY-01455',
    title: 'Broken sidewalk slab',
    category: 'sidewalk',
    street: 'Juan Luna Ave',
    area: 'Mabolo',
    distance: 1650,
    reportCount: 1,
    status: 'received',
    mine: true,
    reportedOn: 'Nov 10',
    reportedAgo: 'a week ago',
    receivedAt: 'Nov 10, 5:12 PM',
    photoTone: colors.photoWarm,
    map: { x: 0.12, y: 0.62 },
  },
  {
    id: 'AY-01431',
    title: 'Dead streetlight',
    category: 'streetlight',
    street: 'Escario St',
    area: 'Capitol Site',
    distance: 900,
    reportCount: 4,
    status: 'resolved',
    mine: true,
    reportedOn: 'Nov 3',
    reportedAgo: '2 weeks ago',
    receivedAt: 'Nov 3, 8:05 PM',
    verifiedAt: 'Nov 4, 9:30 AM',
    assignedTo: 'City Electrical',
    resolvedOn: 'Nov 14',
    awaitingConfirmation: true,
    photoTone: colors.photoAlt,
    map: { x: 0.82, y: 0.3 },
  },
  {
    id: 'AY-01398',
    title: 'Flickering pole light',
    category: 'streetlight',
    street: 'Gen. Maxilom Ave',
    area: 'Kamputhaw',
    distance: 2100,
    reportCount: 2,
    status: 'resolved',
    mine: true,
    reportedOn: 'Oct 28',
    reportedAgo: '3 weeks ago',
    receivedAt: 'Oct 28, 6:40 PM',
    verifiedAt: 'Oct 29, 10:02 AM',
    assignedTo: 'City Electrical',
    resolvedOn: 'Nov 8',
    photoTone: colors.photo,
    map: { x: 0.9, y: 0.86 },
  },
  {
    id: 'AY-01377',
    title: 'Overflowing drainage grate',
    category: 'drainage',
    street: 'M. J. Cuenco Ave',
    area: 'Tejero',
    distance: 2600,
    reportCount: 5,
    status: 'resolved',
    mine: true,
    reportedOn: 'Oct 21',
    reportedAgo: '4 weeks ago',
    receivedAt: 'Oct 21, 7:15 AM',
    verifiedAt: 'Oct 21, 1:44 PM',
    assignedTo: 'City Engineering',
    resolvedOn: 'Nov 3',
    photoTone: colors.photoAlt,
    map: { x: 0.05, y: 0.9 },
  },
  {
    id: 'AY-01350',
    title: 'Large asphalt crater',
    category: 'road',
    street: 'P. del Rosario St',
    area: 'Cogon Central',
    distance: 3100,
    reportCount: 8,
    status: 'resolved',
    mine: true,
    reportedOn: 'Oct 9',
    reportedAgo: '5 weeks ago',
    receivedAt: 'Oct 9, 4:30 PM',
    verifiedAt: 'Oct 9, 6:02 PM',
    assignedTo: 'City Engineering',
    resolvedOn: 'Oct 29',
    photoTone: colors.photoWarm,
    map: { x: 0.95, y: 0.95 },
  },
  {
    id: 'AY-01462',
    title: 'Streetlight out at corner',
    category: 'streetlight',
    street: 'Salinas Dr',
    area: 'Lahug',
    distance: 520,
    reportCount: 1,
    status: 'received',
    mine: false,
    reportedOn: 'Nov 16',
    reportedAgo: 'yesterday',
    receivedAt: 'Nov 16, 8:47 PM',
    photoTone: colors.photoAlt,
    map: { x: 0.81, y: 0.3 },
  },
  {
    id: 'AY-01459',
    title: 'Blocked roadside canal',
    category: 'drainage',
    street: 'Escario St',
    area: 'Lahug',
    distance: 610,
    reportCount: 1,
    status: 'received',
    mine: false,
    reportedOn: 'Nov 14',
    reportedAgo: '3 days ago',
    receivedAt: 'Nov 14, 2:16 PM',
    photoTone: colors.photoAlt,
    map: { x: 0.28, y: 0.37 },
  },
  {
    id: 'AY-01290',
    title: 'Cracked road edge',
    category: 'road',
    street: 'Gorordo Ave',
    area: 'Lahug',
    distance: 170,
    reportCount: 2,
    status: 'resolved',
    mine: false,
    reportedOn: 'Oct 26',
    reportedAgo: '3 weeks ago',
    receivedAt: 'Oct 26, 10:20 AM',
    verifiedAt: 'Oct 26, 1:05 PM',
    assignedTo: 'City Engineering',
    resolvedOn: 'Nov 2',
    photoTone: colors.photoAlt,
    map: { x: 0.4, y: 0.7 },
  },
];

/** The spot the "New report" GPS fix lands on, used for the duplicate check. */
export const draftLocation = {
  street: 'Gorordo Ave',
  area: 'Lahug',
  accuracy: 8,
  /** Distances from the draft pin to nearby reports, in metres. */
  nearby: { 'AY-01482': 14, 'AY-01290': 48 } as Record<string, number>,
};

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
