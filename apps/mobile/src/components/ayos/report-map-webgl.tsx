import { useMemo } from 'react';

import { MapboxWeb, type WebMarker, type WebMarkerIcon } from './mapbox-web';
import { categoryIcons, type ReportMapProps } from './report-map-shared';
import { categoryColors } from '../../constants/design';
import { MAP_CENTER, reportCoordinate } from '../../lib/location';

/** About 1.5 km across: the "near you" area. */
const ZOOM = 14.5;

const webIcon = (name: string): WebMarkerIcon =>
  name === 'droplet' || name === 'bulb' ? name : 'alert';

/** The report map in Expo Go: Mapbox GL JS in a WebView (see mapbox-web.tsx). */
export function ReportMap({ reports, userPosition, onOpen, bottomInset = 0 }: ReportMapProps) {
  const markers = useMemo<WebMarker[]>(
    () =>
      reports.map((report) => ({
        ...reportCoordinate(report),
        id: report.id,
        color: categoryColors[report.category],
        label: `${report.title}, ${report.reportCount} reports`,
        count: report.reportCount,
        icon: webIcon(categoryIcons[report.category]),
      })),
    [reports],
  );

  return (
    <MapboxWeb
      center={userPosition ?? MAP_CENTER}
      zoom={ZOOM}
      markers={markers}
      user={userPosition}
      followUserOnce
      bottomInset={bottomInset}
      onMarkerPress={(id) => {
        const report = reports.find((r) => r.id === id);
        if (report) onOpen(report);
      }}
    />
  );
}
