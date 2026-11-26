import { Link, Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../components/ayos/button';
import { PhotoThumb } from '../components/ayos/photo-thumb';
import { ScreenHeader } from '../components/ayos/screen-header';
import { StatusBadge } from '../components/ayos/status-badge';
import { colors, fonts, radius, type } from '../constants/design';
import { formatDistance, othersCount, statusLabels } from '../data/reports';
import { useAuth } from '../data/auth-store';
import { useReports } from '../data/reports-store';

export default function DuplicateCheckScreen() {
  const insets = useSafeAreaInsets();
  const { draft, findSimilar, joinExisting, submitNew } = useReports();
  const { isGuest } = useAuth();

  // A draft can outlive the account that wrote it; create-report shows guests why they can't report.
  if (!draft || isGuest) {
    return <Redirect href="/create-report" />;
  }

  const [match, ...others] = findSimilar(draft);

  const showReport = (id: string) => {
    router.dismissAll();
    router.push({ pathname: '/report/[id]', params: { id, sent: '1' } });
  };

  // Remembered as a hint for LGU staff: the user saw this match and said it's different.
  const submitAsNew = () => showReport(submitNew(draft, match?.report.id));

  if (!match) {
    return <Redirect href="/create-report" />;
  }

  // People besides you who already reported it.
  const people = othersCount(match.report);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Already reported?" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          We found a report that looks like yours, close by. If it&apos;s the same problem, add
          yours to it. Your photo still goes to the LGU.
        </Text>

        <View style={styles.matchCard}>
          <View style={styles.compare}>
            <View style={styles.compareHalf}>
              <PhotoThumb
                uri={draft.photos[0]?.uri}
                tone="#DBD8D3"
                showIcon={false}
                style={styles.comparePhoto}
              />
              <Text style={styles.photoTag}>Yours</Text>
            </View>
            <View style={styles.compareHalf}>
              <PhotoThumb
                uri={match.report.thumbnail}
                tone={match.report.photoTone}
                showIcon={false}
                style={styles.comparePhoto}
              />
              <Text style={styles.photoTag}>Existing</Text>
            </View>
          </View>

          <View style={styles.matchBody}>
            <Text style={styles.matchTitle}>{match.report.title}</Text>
            <View style={styles.chips}>
              <Text style={styles.chip}>{formatDistance(match.distance)} away</Text>
              <Text style={styles.chip}>Reported {match.report.reportedAgo}</Text>
              <Text style={styles.chip}>
                {people} {people === 1 ? 'person' : 'people'} reported
              </Text>
            </View>
            <View style={styles.statusRow}>
              <StatusBadge status={match.report.status} />
              {match.report.statusNote ? (
                <Text style={styles.statusNote}>{match.report.statusNote}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {others.map(({ report, distance }) => (
          <View key={report.id} style={styles.otherCard}>
            <PhotoThumb uri={report.thumbnail} tone={report.photoTone} showIcon={false} size={52} />
            <View style={styles.otherBody}>
              <Text style={styles.otherTitle}>{report.title}</Text>
              <Text style={styles.otherMeta}>
                {formatDistance(distance)} away · {report.reportedAgo} ·{' '}
                {statusLabels[report.status]}
              </Text>
            </View>
            <Link
              href={{ pathname: '/report/[id]', params: { id: report.id } }}
              style={styles.view}
            >
              View
            </Link>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          label="Same problem, add my report"
          onPress={() => showReport(joinExisting(match.report.id))}
        />
        <Button label="Different problem, submit new" variant="secondary" onPress={submitAsNew} />
        <Text style={styles.footerNote}>Not sure? Submit new. LGU staff check every match.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16 },
  intro: {
    ...type.body,
    fontSize: 16.5,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  compare: { flexDirection: 'row', gap: 2, backgroundColor: colors.surface },
  compareHalf: { flex: 1 },
  comparePhoto: { width: '100%', height: 128, borderRadius: 0 },
  photoTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.photoBadge,
    color: colors.onPrimary,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  matchBody: { padding: 14, gap: 12 },
  matchTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 23,
    color: colors.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: '#EEF0F3',
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusNote: { ...type.meta, fontSize: 14.5, color: colors.textSecondary },
  otherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  otherBody: { flex: 1, gap: 2 },
  otherTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  otherMeta: { ...type.meta, fontSize: 14 },
  view: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  footer: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
  },
  footerNote: {
    ...type.small,
    fontSize: 13.5,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
