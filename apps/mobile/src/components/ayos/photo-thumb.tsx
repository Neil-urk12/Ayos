import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from './icon';
import { colors, radius } from '../../constants/design';

type PhotoThumbProps = {
  /** The photo to show. Without one, a tinted placeholder is drawn instead. */
  uri?: string;
  tone?: string;
  size?: number;
  showIcon?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** A report photo, or a placeholder while the report has none. */
export function PhotoThumb({
  uri,
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
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
        />
      ) : (
        showIcon && <Icon name="image" size={Math.round(size * 0.36)} color="#5B6170" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
