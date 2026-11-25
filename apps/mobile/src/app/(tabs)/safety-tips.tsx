import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, isIconName, type IconName } from '../../components/ayos/icon';
import { colors, fonts, radius, type } from '../../constants/design';
import defaultTipsJson from '../../data/default-tips.json';
import { watchTips, type TipDoc } from '../../lib/firebase/tips';

type UserType = 'motorists' | 'cyclists' | 'pedestrians';

type SafetyTip = {
  id: string;
  icon: IconName;
  category: string;
  title: string;
  description: string;
};

/** Bundled copy of the tips; shown until Firestore answers, or if tips/ is empty or unreachable. */
const defaultTips = defaultTipsJson as TipDoc[];

function toTip(doc: TipDoc): SafetyTip {
  return {
    id: doc.id,
    icon: isIconName(doc.icon) ? doc.icon : 'shield',
    category: doc.category,
    title: doc.title,
    description: doc.body,
  };
}

function groupTips(docs: TipDoc[]): Record<UserType, SafetyTip[]> {
  const sorted = [...docs].sort((a, b) => a.order - b.order);
  const forTab = (tab: UserType) =>
    sorted.filter((t) => t.audience === tab || t.audience === 'all').map(toTip);
  return {
    motorists: forTab('motorists'),
    cyclists: forTab('cyclists'),
    pedestrians: forTab('pedestrians'),
  };
}

/** Tips from Firestore (tips/{tipId}), falling back to the bundled copy. */
function useTipsByGroup() {
  const [docs, setDocs] = useState<TipDoc[] | null>(null);
  useEffect(
    () =>
      watchTips(setDocs, (error) => {
        console.warn('[tips] Could not load tips:', error.message);
        setDocs(null);
      }),
    [],
  );
  return groupTips(docs && docs.length > 0 ? docs : defaultTips);
}

const groups = [
  ['motorists', 'Motorists'],
  ['cyclists', 'Cyclists'],
  ['pedestrians', 'Pedestrians'],
] as const satisfies readonly (readonly [UserType, string])[];

export default function SafetyTipsScreen() {
  const [tab, setTab] = useState<UserType>('motorists');
  const tipsByGroup = useTipsByGroup();
  const listed = tipsByGroup[tab];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title} accessibilityRole="header">
        Safety tips
      </Text>

      <View style={styles.tabs} accessibilityRole="tablist">
        {groups.map(([key, label]) => {
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, styles.banner]}>
          <View style={styles.bannerHeader}>
            <Icon name="shield" size={22} color={colors.primary} />
            <Text style={styles.bannerTitle}>Stay safe around reported hazards</Text>
          </View>
          <Text style={styles.bannerMeta}>
            Practical reminders while your LGU works on open road, drainage, and lighting fixes.
          </Text>
        </View>

        {listed.map((tip) => (
          <View key={tip.id} style={[styles.card, styles.tipCard]}>
            <View style={styles.tipHeader}>
              <View style={styles.iconBox}>
                <Icon name={tip.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.tipTitleGroup}>
                <Text style={styles.tipCategory}>{tip.category}</Text>
                <Text style={styles.tipTitle}>{tip.title}</Text>
              </View>
            </View>
            <Text style={styles.tipBody}>{tip.description}</Text>
          </View>
        ))}
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
  banner: { padding: 14, gap: 6 },
  bannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bannerTitle: { flex: 1, fontFamily: fonts.semibold, fontSize: 16.5, color: colors.text },
  bannerMeta: { ...type.meta, fontSize: 14.5, color: colors.textSecondary },
  tipCard: { padding: 14, gap: 10 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitleGroup: { flex: 1, gap: 2 },
  tipCategory: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tipTitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21, color: colors.text },
  tipBody: { ...type.body, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },
});
