import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/ayos/button';
import { Icon } from '../../components/ayos/icon';
import { PhotoThumb } from '../../components/ayos/photo-thumb';
import { ScreenHeader } from '../../components/ayos/screen-header';
import { colors, fonts, radius, type } from '../../constants/design';
import { useAuth } from '../../data/auth-store';
import { categoryLabels, othersCount, statusLabels, type Report } from '../../data/reports';
import { useReports } from '../../data/reports-store';
import { watchConfirmation, type Confirmation } from '../../lib/firebase/reports';

type StepState = 'done' | 'current' | 'pending';
type Step = { title: string; detail: string; state: StepState };

const statusOrder = ['received', 'verified', 'in_progress', 'resolved'] as const;

function buildSteps(report: Report): Step[] {
  const reached = statusOrder.indexOf(report.status);
  const stateFor = (index: number): StepState => {
    if (index < reached) return 'done';
    if (index > reached) return 'pending';
    return report.status === 'in_progress' ? 'current' : 'done';
  };
  const grouped = report.reportCount > 1;
  const assignee = report.assignedTo ?? 'the city';

  return [
    { title: 'Received', detail: report.receivedAt, state: 'done' },
    {
      title: grouped ? 'Verified and grouped' : 'Verified',
      detail: report.verifiedAt
        ? `${grouped ? 'LGU staff confirmed it matches an existing issue' : 'LGU staff confirmed the report'} · ${report.verifiedAt}`
        : 'LGU staff will check your report',
      state: stateFor(1),
    },
    {
      title: 'In progress',
      detail: report.assignedTo
        ? `Assigned to ${assignee} · repair scheduled`
        : 'We will tell you who is assigned',
      state: stateFor(2),
    },
    {
      title: 'Resolved',
      detail: report.resolvedOn
        ? `Marked fixed ${report.resolvedOn}`
        : "We'll ask you to confirm it's fixed",
      state: stateFor(3),
    },
  ];
}

export default function ReportScreen() {
  const { id, sent } = useLocalSearchParams<{ id: string; sent?: string }>();
  const insets = useSafeAreaInsets();
  const { getReport } = useReports();
  const report = getReport(id);

  if (!report) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Report not found" />
        <Text style={[styles.missing, type.body]}>We couldn&apos;t find report {id}.</Text>
      </View>
    );
  }

  const others = othersCount(report);
  const reporters = report.mine
    ? others > 0
      ? `You + ${others} ${others === 1 ? 'other' : 'others'} reported this`
      : 'You reported this'
    : `${report.reportCount} ${report.reportCount === 1 ? 'person' : 'people'} reported this`;

  const share = () =>
    Share.share({
      message: `${report.title} on ${report.street}, ${report.area} is now "${statusLabels[report.status]}" on AYOS (${report.id}).`,
    });

  return (
    <View style={styles.screen}>
      <ScreenHeader title={`Report ${report.id}`} />

      <ScrollView contentContainerStyle={styles.content}>
        {sent === '1' && (
          <View style={styles.banner} accessibilityRole="alert">
            <Icon name="check-circle" size={24} color={colors.success} />
            <Text style={styles.bannerText}>
              Sent. You&apos;ll get a notification each time the status changes.
            </Text>
          </View>
        )}

        <View style={[styles.card, styles.summary]}>
          <PhotoThumb uri={report.thumbnail} tone={report.photoTone} size={72} showIcon={false} />
          <View style={styles.summaryBody}>
            <Text style={styles.summaryTitle}>{report.title}</Text>
            <Text style={styles.summaryMeta}>
              {categoryLabels[report.category]} · {report.street}, {report.area}
            </Text>
            <Text style={styles.summaryMeta}>{reporters}</Text>
          </View>
        </View>

        <ConfirmCard report={report} />

        <View style={[styles.card, styles.progress]}>
          <Text style={styles.progressTitle} accessibilityRole="header">
            Progress
          </Text>
          {buildSteps(report).map((step, index, steps) => (
            <TimelineStep
              key={step.title}
              step={step}
              isLast={index === steps.length - 1}
              lineDone={steps[index + 1]?.state !== 'pending' && step.state === 'done'}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          label="Back to map"
          variant="secondary"
          onPress={() => router.dismissTo('/map')}
          style={styles.footerButton}
        />
        <Button label="Share update" onPress={share} style={styles.footerButton} />
      </View>
    </View>
  );
}

const answerLabels: Record<Confirmation, string> = {
  still_there: 'You said it’s still there.',
  fixed: 'You said it’s fixed.',
};

/**
 * "Is it still there?" (FR-11). One answer per person per issue group: merged reports count
 * toward the group they were merged into. Guests see the counts but can't answer.
 */
function ConfirmCard({ report }: { report: Report }) {
  const { user, isGuest } = useAuth();
  const { getReport, confirmIssue } = useReports();
  const groupId = report.mergedInto ?? report.id;
  const group = getReport(groupId) ?? report;
  const uid = user && !isGuest ? user.uid : null;
  const [answer, setAnswer] = useState<{ key: string; value: Confirmation | null } | null>(null);
  const key = `${groupId}/${uid}`;

  useEffect(() => {
    if (!uid) return;
    return watchConfirmation(
      groupId,
      uid,
      (value) => setAnswer({ key: `${groupId}/${uid}`, value }),
      (error) => {
        console.warn('[report] Could not load your answer:', error.message);
        // Still show the buttons; the rules refuse a second answer if there was one.
        setAnswer({ key: `${groupId}/${uid}`, value: null });
      },
    );
  }, [groupId, uid]);

  const mine = answer && answer.key === key ? answer.value : undefined;
  const counts = `${group.confirmStillThere} still there · ${group.confirmFixed} fixed`;

  return (
    <View style={[styles.card, styles.confirm]}>
      <Text style={[styles.progressTitle, styles.confirmTitle]} accessibilityRole="header">
        Is it still there?
      </Text>
      <Text style={styles.summaryMeta}>{counts}</Text>
      {!uid ? (
        <Text style={styles.summaryMeta}>Sign in with an account to answer.</Text>
      ) : mine === undefined ? null : mine ? (
        <Text style={styles.confirmDone} accessibilityRole="text">
          {answerLabels[mine]} Thanks for letting the LGU know.
        </Text>
      ) : (
        <View style={styles.confirmButtons}>
          <Button
            label="Still there"
            variant="secondary"
            size="md"
            onPress={() => confirmIssue(groupId, 'still_there')}
            style={styles.footerButton}
          />
          <Button
            label="It’s fixed"
            variant="secondary"
            size="md"
            onPress={() => confirmIssue(groupId, 'fixed')}
            style={styles.footerButton}
          />
        </View>
      )}
    </View>
  );
}

function TimelineStep({
  step,
  isLast,
  lineDone,
}: {
  step: Step;
  isLast: boolean;
  lineDone: boolean;
}) {
  return (
    <View style={styles.step} accessible accessibilityLabel={`${step.title}, ${step.state}`}>
      <View style={styles.rail}>
        <View
          style={[
            styles.dot,
            step.state === 'done' && styles.dotDone,
            step.state === 'current' && styles.dotCurrent,
          ]}
        >
          {step.state === 'done' && <Icon name="check" size={16} color={colors.onPrimary} />}
        </View>
        {!isLast && <View style={[styles.line, lineDone && styles.lineDone]} />}
      </View>
      <View style={[styles.stepBody, !isLast && styles.stepBodySpaced]}>
        <Text
          style={[
            styles.stepTitle,
            step.state === 'current' && styles.stepTitleCurrent,
            step.state === 'pending' && styles.stepTitlePending,
          ]}
        >
          {step.title}
        </Text>
        <Text style={styles.stepDetail}>{step.detail}</Text>
      </View>
    </View>
  );
}

const DOT = 30;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  missing: { padding: 20 },
  confirm: { padding: 16, gap: 8 },
  confirmTitle: { marginBottom: 0 },
  confirmButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  confirmDone: { fontFamily: fonts.medium, fontSize: 15, color: colors.success },
  content: { padding: 16, gap: 16 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.successBorder,
    backgroundColor: colors.successSoft,
  },
  bannerText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 22,
    color: '#065F46',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summary: { flexDirection: 'row', gap: 12, padding: 12 },
  summaryBody: { flex: 1, gap: 2 },
  summaryTitle: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, color: colors.text },
  summaryMeta: { ...type.meta, fontSize: 14.5, lineHeight: 20, color: colors.textSecondary },
  progress: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16 },
  progressTitle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text, marginBottom: 14 },
  step: { flexDirection: 'row', gap: 14 },
  rail: { width: DOT, alignItems: 'center' },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.success, borderColor: colors.success },
  dotCurrent: { borderColor: colors.warning, borderWidth: 3.5 },
  line: { flex: 1, width: 2.5, backgroundColor: colors.borderStrong },
  lineDone: { backgroundColor: colors.success },
  stepBody: { flex: 1, paddingTop: 3 },
  stepBodySpaced: { paddingBottom: 18 },
  stepTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  stepTitleCurrent: { color: colors.warning },
  stepTitlePending: { color: colors.textSecondary },
  stepDetail: { ...type.meta, fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
  },
  footerButton: { flex: 1 },
});
