import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from './icon';
import { colors, type } from '../../constants/design';

type EmptyTabProps = {
  title: string;
  icon: IconName;
  message: string;
  children?: ReactNode;
};

/** Tab page that has a title and an empty state, for sections not designed yet. */
export function EmptyTab({ title, icon, message, children }: EmptyTabProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.empty}>
        <View style={styles.iconWrap}>
          <Icon name={icon} size={26} color={colors.textMuted} />
        </View>
        <Text style={styles.message}>{message}</Text>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  title: { ...type.title, fontSize: 30, paddingHorizontal: 20, paddingTop: 28 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { ...type.body, color: colors.textSecondary, textAlign: 'center', maxWidth: 280 },
});
