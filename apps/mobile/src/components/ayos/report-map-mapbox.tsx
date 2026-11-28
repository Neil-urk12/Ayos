import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from './icon';
import { categoryIcons, type ReportMapProps } from './report-map-shared';
import { categoryColors, colors, fonts } from '../../constants/design';
import type { Report } from '../../data/reports';
import { MAP_CENTER, reportCoordinate } from '../../lib/location';
import { Mapbox, toPosition } from '../../lib/mapbox';

/** About 1.5 km across: the "near you" area. */
const ZOOM = 14.5;

/**
 * Mapbox map with a category-coloured marker per report (FR-07). The access token comes from
 * EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN (src/lib/mapbox.ts).
 */
export function ReportMap({ reports, userPosition, onOpen, bottomInset = 0 }: ReportMapProps) {
  const cameraRef = useRef<Mapbox.Camera>(null);
  const centred = useRef(false);

  // Move to the user once, the first time their position is known.
  useEffect(() => {
    if (!userPosition || centred.current) return;
    centred.current = true;
    cameraRef.current?.setCamera({
      centerCoordinate: toPosition(userPosition),
      zoomLevel: ZOOM,
      animationDuration: 600,
    });
  }, [userPosition]);

  // Keeps the Mapbox logo and attribution above the "Near you" sheet.
  const ornamentBottom = bottomInset + 8;

  return (
    <Mapbox.MapView
      style={StyleSheet.absoluteFill}
      styleURL={Mapbox.StyleURL.Street}
      scaleBarEnabled={false}
      compassEnabled={false}
      logoPosition={{ bottom: ornamentBottom, left: 8 }}
      attributionPosition={{ bottom: ornamentBottom, right: 8 }}
    >
      <Mapbox.Camera
        ref={cameraRef}
        defaultSettings={{
          centerCoordinate: toPosition(userPosition ?? MAP_CENTER),
          zoomLevel: ZOOM,
        }}
        padding={{ paddingTop: 0, paddingRight: 0, paddingBottom: bottomInset, paddingLeft: 0 }}
      />
      <Mapbox.LocationPuck puckBearingEnabled={false} />
      {reports.map((report) => (
        <ReportMarker key={report.id} report={report} onPress={() => onOpen(report)} />
      ))}
    </Mapbox.MapView>
  );
}

function ReportMarker({ report, onPress }: { report: Report; onPress: () => void }) {
  const showCount = report.reportCount > 1;
  return (
    <Mapbox.MarkerView coordinate={toPosition(reportCoordinate(report))} allowOverlap>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${report.title}, ${report.reportCount} reports`}
        onPress={onPress}
        hitSlop={6}
      >
        <View
          style={[
            styles.marker,
            showCount ? styles.markerLarge : styles.markerSmall,
            { backgroundColor: categoryColors[report.category] },
          ]}
        >
          {showCount ? (
            <Text style={styles.markerCount}>{report.reportCount}</Text>
          ) : (
            <Icon name={categoryIcons[report.category]} size={17} color={colors.onPrimary} />
          )}
        </View>
      </Pressable>
    </Mapbox.MarkerView>
  );
}

const styles = StyleSheet.create({
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  markerSmall: { width: 34, height: 34, borderRadius: 17 },
  markerLarge: { width: 40, height: 40, borderRadius: 20 },
  markerCount: { fontFamily: fonts.bold, fontSize: 14, color: colors.onPrimary },
});
