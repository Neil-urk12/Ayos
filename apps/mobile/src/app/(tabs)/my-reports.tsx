import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ayos/button';
import { Icon } from '../../components/ayos/icon';
import { ReportRow } from '../../components/ayos/report-row';
import { StatusBadge } from '../../components/ayos/status-badge';
import { colors, fonts, radius, type } from '../../constants/design';
import { othersCount, type Report } from '../../data/reports';
import { useReports } from '../../data/reports-store';

type Tab = 'open' | 'resolved';

function metaFor(report: Report) {
  const others = othersCount(report);
  const parts = [
    report.street,
    report.resolvedOn ? `fixed ${report.resolvedOn}` : report.reportedOn,
  ];
  if (others > 0) parts.push(`+${others} ${others === 1 ? 'other' : 'others'}`);
  return parts.join(' · ');
}

export default function MyReportsScreen() {
  const { reports, confirmFix } = useReports();
  const [tab, setTab] = useState<Tab>('open');

  const mine = reports.filter((r) => r.mine);
  const open = mine.filter((r) => r.status !== 'resolved');
  const resolved = mine.filter((r) => r.status === 'resolved');
  const toConfirm = resolved.filter((r) => r.awaitingConfirmation);
  const listed = tab === 'open' ? open : resolved;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title} accessibilityRole="header">
        My reports
      </Text>

      <View style={styles.tabs} accessibilityRole="tablist">
        {(
          [
            ['open', `Open (${open.length})`],
            ['resolved', `Resolved (${resolved.length})`],
          ] as const
        ).map(([key, label]) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(key)}
              style={styles.tab}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
              <View style={[styles.tabLine, active && styles.tabLineActive]} />
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'open' &&
          toConfirm.map((report) => (
            <View key={report.id} style={[styles.card, styles.confirm]}>
              <View style={styles.confirmHeader}>
                <Icon name="check-circle" size={22} color={colors.success} />
                <Text style={styles.confirmTitle}>LGU marked this fixed. Is it?</Text>
              </View>
              <Text style={styles.confirmMeta}>
                {report.title} · {report.street} · fixed {report.resolvedOn}
              </Text>
              <View style={styles.confirmActions}>
                <Button
                  label="Yes, fixed"
                  variant="success"
                  size="md"
                  onPress={() => confirmFix(report.id, true)}
                  style={styles.confirmButton}
                />
                <Button
                  label="Still broken"
                  variant="secondary"
                  size="md"
                  onPress={() => confirmFix(report.id, false)}
                  style={styles.confirmButton}
                />
              </View>
            </View>
          ))}

        {listed.length === 0 ? (
          <Text style={styles.empty}>
            {tab === 'open'
              ? 'No open reports. Tap + to report a problem.'
              : 'Nothing resolved yet.'}
          </Text>
        ) : (
          listed.map((report) => (
            <View key={report.id} style={[styles.card, styles.rowCard]}>
              <ReportRow
                title={report.title}
                meta={metaFor(report)}
                photoTone={report.photoTone}
                photoUri={report.thumbnail}
                thumbSize={56}
                showPhotoIcon={false}
                footer={
                  <View style={styles.badge}>
                    <StatusBadge status={report.status} />
                  </View>
                }
                trailing={<Icon name="chevron-right" size={20} color={colors.textMuted} />}
                onPress={() => router.push({ pathname: '/report/[id]', params: { id: report.id } })}
              />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: { ...type.title, fontSize: 32, lineHeight: 38, paddingHorizontal: 16, paddingTop: 28 },
  tabs: {
    flexDirection: 'row',
    gap: 22,
    paddingHorizontal: 16,
    marginTop: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderStrong,
  },
  tab: { paddingTop: 4 },
  tabText: {
    fontFamily: fonts.medium,
    fontSize: 17,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  tabTextActive: { fontFamily: fonts.semibold, color: colors.text },
  tabLine: { height: 3, borderRadius: 1.5, backgroundColor: 'transparent' },
  tabLineActive: { backgroundColor: colors.primary },
  content: { padding: 16, gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirm: { padding: 14, gap: 10 },
  confirmHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  confirmTitle: { flex: 1, fontFamily: fonts.semibold, fontSize: 16.5, color: colors.text },
  confirmMeta: { ...type.meta, fontSize: 14.5, color: colors.textSecondary },
  confirmActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  confirmButton: { flex: 1 },
  rowCard: { padding: 12 },
  badge: { marginTop: 4 },
  empty: { ...type.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: 40 },
});
