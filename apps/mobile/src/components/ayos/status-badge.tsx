import { StyleSheet, Text, View } from 'react-native';

import { fonts, radius } from '../../constants/design';
import { statusLabels, type ReportStatus } from '../../data/reports';

const tones: Record<ReportStatus, { bg: string; fg: string }> = {
  received: { bg: '#EEF0F3', fg: '#374151' },
  verified: { bg: '#E3ECFF', fg: '#1E40AF' },
  in_progress: { bg: '#FEF3C7', fg: '#92400E' },
  resolved: { bg: '#DCFCE7', fg: '#166534' },
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  const tone = tones[status];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{statusLabels[status]}</Text>
    </View>
  );
}

export function statusColor(status: ReportStatus) {
  return tones[status].fg;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  text: { fontFamily: fonts.semibold, fontSize: 13 },
});
