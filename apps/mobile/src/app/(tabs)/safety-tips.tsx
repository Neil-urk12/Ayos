import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ayos/icon';
import { colors, fonts, radius, type } from '@/constants/design';

type UserType = 'motorists' | 'cyclists' | 'pedestrians';

type SafetyTip = {
  id: string;
  icon: IconName;
  category: string;
  title: string;
  description: string;
};

const tipsByGroup: Record<UserType, SafetyTip[]> = {
  motorists: [
    {
      id: 'm-1',
      icon: 'alert',
      category: 'Road damage',
      title: 'Slow down near wet or shaded potholes',
      description:
        'Standing water and tree shadows can hide deep road craters. Reduce speed to protect your tires, suspension, and nearby pedestrians from splashes.',
    },
    {
      id: 'm-2',
      icon: 'droplet',
      category: 'Drainage',
      title: 'Never drive through flooded drainage inlets',
      description:
        'Moving floodwater over clogged drains can conceal open manholes or washed-out pavement. Reroute when water depth reaches curb height.',
    },
    {
      id: 'm-3',
      icon: 'bulb',
      category: 'Streetlight',
      title: 'Stay alert on unlit barangay streets',
      description:
        'Use low beams when approaching oncoming traffic and watch closely for pedestrians and cyclists along stretches with busted streetlights.',
    },
  ],
  cyclists: [
    {
      id: 'c-1',
      icon: 'bulb',
      category: 'Visibility',
      title: 'Run front and rear lights after dusk',
      description:
        'Equip your bike with a steady white front light and a blinking red taillight so motorists can spot you early in poorly lit areas.',
    },
    {
      id: 'c-2',
      icon: 'pin',
      category: 'Navigation',
      title: 'Check blind spots before swerving around hazards',
      description:
        'Signal early and shoulder-check before steering wide around potholes, uneven concrete slabs, or clogged roadside grates.',
    },
    {
      id: 'c-3',
      icon: 'droplet',
      category: 'Drainage',
      title: 'Cross metal drain grates straight on',
      description:
        'Wet steel grates become slick and narrow slots can catch thin tires. Approach squarely at a controlled speed.',
    },
  ],
  pedestrians: [
    {
      id: 'p-1',
      icon: 'shield',
      category: 'Walkways',
      title: 'Walk facing oncoming traffic on obstructed roads',
      description:
        'When broken sidewalks or ongoing LGU repairs force you onto the road shoulder, walk facing traffic so you can see approaching vehicles.',
    },
    {
      id: 'p-2',
      icon: 'bulb',
      category: 'Visibility',
      title: 'Wear bright or reflective gear at night',
      description:
        'Light-colored clothing or reflective strips make you visible from a safe braking distance along streets with dead streetlights.',
    },
    {
      id: 'p-3',
      icon: 'camera',
      category: 'Reporting',
      title: 'Snap hazard photos from a safe distance',
      description:
        'Step onto a safe sidewalk or curb before taking photos for AYOS—never stand in active traffic lanes to document road damage.',
    },
  ],
};

const groups = [
  ['motorists', 'Motorists'],
  ['cyclists', 'Cyclists'],
  ['pedestrians', 'Pedestrians'],
] as const satisfies readonly (readonly [UserType, string])[];

export default function SafetyTipsScreen() {
  const [tab, setTab] = useState<UserType>('motorists');
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
