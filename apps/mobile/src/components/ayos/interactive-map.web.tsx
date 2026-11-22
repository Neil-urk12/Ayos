import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ayos/icon';
import { MapBackdrop } from '@/components/ayos/map-backdrop';
import { categoryColors, colors, fonts, shadow } from '@/constants/design';
import { type Category, type Report } from '@/data/reports';

const categoryIcons: Record<Category, IconName> = {
  road: 'alert',
  drainage: 'droplet',
  streetlight: 'bulb',
  sidewalk: 'alert',
};

type Props = {
  reports: Report[];
  onSelectReport: (report: Report) => void;
};

export function InteractiveMap({ reports, onSelectReport }: Props) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <MapBackdrop />

      {reports.map((report) => {
        const showCount = report.reportCount > 1;
        return (
          <Pressable
            key={report.id}
            accessibilityRole="button"
            accessibilityLabel={`${report.title}, ${report.reportCount} reports`}
            onPress={() => onSelectReport(report)}
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
      })}

      <View style={styles.userHalo} pointerEvents="none">
        <View style={styles.userDot} />
      </View>
    </View>
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
    left: '42%',
    top: '52.5%',
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