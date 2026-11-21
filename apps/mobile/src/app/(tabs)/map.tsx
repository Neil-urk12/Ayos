import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ayos/icon';
import { MapBackdrop } from '@/components/ayos/map-backdrop';
import { ReportRow } from '@/components/ayos/report-row';
import { StatusBadge } from '@/components/ayos/status-badge';
import { categoryColors, colors, fonts, radius, shadow, type } from '@/constants/design';
import {
  categoryLabels,
  categoryOrder,
  formatDistance,
  type Category,
  type Report,
} from '@/data/reports';
import { useReports } from '@/data/reports-store';

type Filter = 'all' | Category;

const categoryIcons: Record<Category, IconName> = {
  road: 'alert',
  drainage: 'droplet',
  streetlight: 'bulb',
  sidewalk: 'alert',
};

const NEAR_RADIUS = 1000;
const WIDE_RADIUS = 3000;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { reports } = useReports();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  const needle = query.trim().toLowerCase();
  const visible = reports.filter(
    (r) =>
      r.status !== 'resolved' &&
      (filter === 'all' || r.category === filter) &&
      (!needle || `${r.title} ${r.street} ${r.area}`.toLowerCase().includes(needle)),
  );

  const radiusLimit = expanded ? WIDE_RADIUS : NEAR_RADIUS;
  const nearby = visible
    .filter((r) => r.distance <= radiusLimit)
    .sort((a, b) => a.distance - b.distance);
  const listed = expanded ? nearby : nearby.slice(0, 2);

  const openReport = (report: Report) => router.push(`/report/${report.id}`);

  return (
    <View style={styles.screen}>
      <MapBackdrop />

      {visible.map((report) => (
        <Marker key={report.id} report={report} onPress={() => openReport(report)} />
      ))}

      <View style={styles.userHalo} pointerEvents="none">
        <View style={styles.userDot} />
      </View>

      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Icon name="search" size={20} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search a street or barangay"
              placeholderTextColor={colors.placeholder}
              accessibilityLabel="Search a street or barangay"
              returnKeyType="search"
              style={styles.searchInput}
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {(['all', ...categoryOrder] as Filter[]).map((option) => {
            const active = filter === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setFilter(option)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {option === 'all' ? 'All' : categoryLabels[option]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.sheet, expanded && styles.sheetExpanded]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Collapse list' : 'Expand list'}
          onPress={() => setExpanded((value) => !value)}
          style={styles.handleArea}
          hitSlop={8}
        >
          <View style={styles.handle} />
        </Pressable>

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle} accessibilityRole="header">
            Near you
          </Text>
          <Text style={styles.sheetNote}>Within {formatDistance(radiusLimit)}</Text>
        </View>

        <ScrollView
          scrollEnabled={expanded}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {listed.length === 0 ? (
            <Text style={styles.empty}>No open reports here yet.</Text>
          ) : (
            listed.map((report) => (
              <ReportRow
                key={report.id}
                title={report.title}
                meta={`${report.street} · ${formatDistance(report.distance)} · ${report.reportCount} ${
                  report.reportCount === 1 ? 'report' : 'reports'
                }`}
                photoTone={report.photoTone}
                trailing={<StatusBadge status={report.status} />}
                onPress={() => openReport(report)}
              />
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function Marker({ report, onPress }: { report: Report; onPress: () => void }) {
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
  screen: { flex: 1, backgroundColor: colors.map },
  top: { position: 'absolute', top: 0, left: 0, right: 0, gap: 12 },
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  search: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadow.card,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  chips: { gap: 8, paddingHorizontal: 16 },
  chip: {
    height: 36,
    paddingHorizontal: 15,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipActive: { backgroundColor: colors.text, borderColor: colors.text },
  chipText: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.text },
  chipTextActive: { color: colors.onPrimary, fontFamily: fonts.semibold },
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
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 16,
    ...shadow.raised,
  },
  sheetExpanded: { top: '30%' },
  handleArea: { alignItems: 'center', paddingTop: 10, paddingBottom: 14 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: { ...type.heading, fontSize: 22 },
  sheetNote: { ...type.meta, fontSize: 14 },
  list: { gap: 14, paddingBottom: 18 },
  empty: { ...type.meta, paddingVertical: 12 },
});
