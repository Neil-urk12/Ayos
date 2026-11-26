import type { IconName } from './icon';
import type { Category, Report } from '../../data/reports';

export type ReportMapProps = {
  /** Reports to mark (already filtered by the Map tab). */
  reports: Report[];
  /** The user's GPS position, or null without permission or a fix yet. */
  userPosition: { latitude: number; longitude: number } | null;
  onOpen: (report: Report) => void;
  /** Height covered by the "Near you" sheet, so map controls stay visible. */
  bottomInset?: number;
};

export const categoryIcons: Record<Category, IconName> = {
  road: 'alert',
  drainage: 'droplet',
  streetlight: 'bulb',
  sidewalk: 'alert',
};
