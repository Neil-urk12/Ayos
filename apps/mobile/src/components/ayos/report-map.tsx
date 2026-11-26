import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from './icon';
import { MapBackdrop } from './map-backdrop';
import { categoryIcons, type ReportMapProps } from './report-map-shared';
import { categoryColors, colors, fonts, shadow } from '../../constants/design';
import type { Report } from '../../data/reports';
import { toMapPosition } from '../../lib/location';

/**
 * Web version of the report map. react-native-maps doesn't run in the browser, so the web
 * build keeps the drawn street grid with markers at each report's map position.
 * The phone app uses report-map.native.tsx (Google Maps).
 */
export function ReportMap({ reports, userPosition, onOpen }: ReportMapProps) {
  const user = userPosition ? toMapPosition(userPosition) : { x: 0.42, y: 0.525 };
  return (
    <>
      <MapBackdrop />
      {reports.map((report) => (
        <ReportMarker key={report.id} report={report} onPress={() => onOpen(report)} />
      ))}
      <View
        style={[styles.userHalo, { left: `${user.x * 100}%`, top: `${user.y * 100}%` }]}
        pointerEvents="none"
      >
        <View style={styles.userDot} />
      </View>
    </>
  );
}

function ReportMarker({ report, onPress }: { report: Report; onPress: () => void }) {
  const showCount = report.reportCount > 1;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${report.title}, ${report.reportCount} reports`}
      onPress={onPress}
      style={[
        styles.marker,
        showCount ? styles.markerLarge : styles.markerSmall,
        {
          left: `${report.map.x * 100}%`,
          top: `${report.map.y * 100}%`,
          backgroundColor: categoryColors[report.category],
        },
      ]}
    >
      {showCount ? (
        <Text style={styles.markerCount}>{report.reportCount}</Text>
      ) : (
        <Icon name={categoryIcons[report.category]} size={17} color={colors.onPrimary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadow.raised,
  },
  markerLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  markerSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    transform: [{ translateX: -17 }, { translateY: -17 }],
  },
  markerCount: { fontFamily: fonts.bold, fontSize: 14, color: colors.onPrimary },
  userHalo: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  userDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    borderWidth: 3,
    borderColor: colors.surface,
  },
});
