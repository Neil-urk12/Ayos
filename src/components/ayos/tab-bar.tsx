import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ayos/icon';
import { colors, fonts, shadow } from '@/constants/design';

const tabs: Record<string, { label: string; icon: IconName }> = {
  map: { label: 'Map', icon: 'map' },
  'my-reports': { label: 'My reports', icon: 'list' },
  updates: { label: 'Updates', icon: 'bell' },
  profile: { label: 'Profile', icon: 'user' },
};

export const TAB_BAR_HEIGHT = 78;

/** Bottom tab bar with a raised "new report" button in the middle. */
export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((route) => route.name in tabs);
  const middle = Math.ceil(routes.length / 2);

  const renderTab = (route: (typeof routes)[number]) => {
    const tab = tabs[route.name];
    const focused = state.routes[state.index]?.key === route.key;
    const color = focused ? colors.primary : colors.textSecondary;

    const onPress = () => {
      if (!focused) navigateToTab(route.key);
    };

    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={tab.label}
        onPress={onPress}
        style={styles.tab}
      >
        <Icon name={tab.icon} size={24} color={color} />
        <Text style={[styles.label, { color }, focused && styles.labelActive]}>{tab.label}</Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}
      accessibilityRole="tablist"
    >
      {routes.slice(0, middle).map(renderTab)}
      <View style={styles.fabSlot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New report"
          onPress={() => router.push('/create-report')}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <Icon name="plus" size={30} color={colors.onPrimary} />
        </Pressable>
      </View>
      {routes.slice(middle).map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: TAB_BAR_HEIGHT,
    paddingTop: 10,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontFamily: fonts.medium, fontSize: 12.5 },
  labelActive: { fontFamily: fonts.semibold },
  fabSlot: { flex: 1, alignItems: 'center' },
  fab: {
    width: 62,
    height: 62,
    marginTop: -40,
    marginBottom: 4,
    borderRadius: 31,
    borderWidth: 4,
    borderColor: colors.surface,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.raised,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
  },
  fabPressed: { backgroundColor: colors.primaryPressed },
});
