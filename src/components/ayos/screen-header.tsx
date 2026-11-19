import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ayos/icon';
import { colors, fonts, type } from '@/constants/design';

type ScreenHeaderProps = {
  title: string;
  right?: ReactNode;
  onBack?: () => void;
};

export function ScreenHeader({ title, right, onBack }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const handleBack =
    onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/map')));

  return (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={12}
        onPress={handleBack}
        style={styles.back}
      >
        <Icon name="chevron-left" size={26} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

export function HeaderNote({ children }: { children: string }) {
  return <Text style={styles.note}>{children}</Text>;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderStrong,
  },
  back: { width: 28, alignItems: 'flex-start' },
  title: { ...type.heading, fontSize: 22, flex: 1 },
  note: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
});
