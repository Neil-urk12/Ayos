import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { Icon } from './icon';
import { categoryIcons, type ReportMapProps } from './report-map-shared';
import { categoryColors, colors, fonts } from '../../constants/design';
import type { Report } from '../../data/reports';
import { MAP_CENTER, reportCoordinate } from '../../lib/location';

/** About 1.5 km across: the "near you" area. */
const DELTA = 0.014;

const regionAround = (center: { latitude: number; longitude: number }): Region => ({
  ...center,
  latitudeDelta: DELTA,
  longitudeDelta: DELTA,
});

/**
 * Google Map (Android; Apple Maps would need iOS setup) with a category-coloured marker per
 * report (FR-07). The API key comes from GOOGLE_MAPS_API_KEY at build time (app.config.ts).
 */
export function ReportMap({ reports, userPosition, onOpen, bottomInset = 0 }: ReportMapProps) {
  const mapRef = useRef<MapView>(null);
  const centred = useRef(false);

  // Move to the user once, the first time their position is known.
  useEffect(() => {
    if (!userPosition || centred.current) return;
    centred.current = true;
    mapRef.current?.animateToRegion(regionAround(userPosition), 600);
  }, [userPosition]);

  return (
    <MapView
      ref={mapRef}
      // Google Maps on Android; iOS uses Apple Maps until a Google Maps iOS key is set up.
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      style={StyleSheet.absoluteFill}
      initialRegion={regionAround(userPosition ?? MAP_CENTER)}
      showsUserLocation
      showsMyLocationButton={false}
      toolbarEnabled={false}
      // Keeps the Google logo and controls above the "Near you" sheet.
      mapPadding={{ top: 0, right: 0, bottom: bottomInset, left: 0 }}
    >
      {reports.map((report) => (
        <ReportMarker key={report.id} report={report} onPress={() => onOpen(report)} />
      ))}
    </MapView>
  );
}

function ReportMarker({ report, onPress }: { report: Report; onPress: () => void }) {
  const showCount = report.reportCount > 1;
  // Custom marker views must render once before Android snapshots them; after that, stop
  // tracking changes so the map stays smooth with many markers.
  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setTracks(false), 500);
    return () => clearTimeout(timer);
  }, [report.reportCount, report.category]);

  return (
    <Marker
      coordinate={reportCoordinate(report)}
      onPress={onPress}
      tracksViewChanges={tracks}
      accessibilityLabel={`${report.title}, ${report.reportCount} reports`}
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
    </Marker>
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
