import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ayos/icon';
import { colors, radius } from '@/constants/design';

type PhotoThumbProps = {
  tone?: string;
  size?: number;
  showIcon?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Placeholder for a report photo until real uploads are wired up. */
export function PhotoThumb({
  tone = colors.photo,
  size = 52,
  showIcon = true,
  style,
}: PhotoThumbProps) {
  return (
    <View
      style={[styles.thumb, { width: size, height: size, backgroundColor: tone }, style]}
      accessibilityLabel="Report photo"
    >
      {showIcon && <Icon name="image" size={Math.round(size * 0.36)} color="#5B6170" />}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
