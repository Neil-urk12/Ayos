import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius } from '@/constants/design';

type ButtonVariant = 'primary' | 'secondary' | 'success';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled,
  style,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        variantStyles[variant],
        pressed && pressedStyles[variant],
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[styles.label, size === 'md' && styles.labelMd, labelStyles[variant]]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  lg: { minHeight: 52 },
  md: { minHeight: 44 },
  disabled: { opacity: 0.5 },
  label: { fontFamily: fonts.semibold, fontSize: 16.5 },
  labelMd: { fontSize: 15 },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  success: { backgroundColor: colors.success },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
});

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primaryPressed },
  success: { opacity: 0.88 },
  secondary: { backgroundColor: colors.background },
});

const labelStyles = StyleSheet.create({
  primary: { color: colors.onPrimary },
  success: { color: colors.onPrimary },
  secondary: { color: colors.text },
});
