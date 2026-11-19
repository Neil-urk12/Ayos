import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PhotoThumb } from '@/components/ayos/photo-thumb';
import { colors, fonts, type } from '@/constants/design';

type ReportRowProps = {
  title: string;
  meta: string;
  photoTone: string;
  trailing?: ReactNode;
  /** Rendered under the meta line. */
  footer?: ReactNode;
  thumbSize?: number;
  showPhotoIcon?: boolean;
  onPress?: () => void;
};

/** Thumbnail, title and meta line. Used in the map sheet and in My reports. */
export function ReportRow({
  title,
  meta,
  photoTone,
  trailing,
  footer,
  thumbSize = 52,
  showPhotoIcon = true,
  onPress,
}: ReportRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <PhotoThumb tone={photoTone} size={thumbSize} showIcon={showPhotoIcon} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {meta}
        </Text>
        {footer}
      </View>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pressed: { opacity: 0.7 },
  body: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21, color: colors.text },
  meta: { ...type.meta, fontSize: 14 },
});
