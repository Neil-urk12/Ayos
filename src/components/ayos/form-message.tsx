import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ayos/icon';
import { colors, radius, type } from '@/constants/design';

type FormMessageProps = { tone: 'error' | 'success'; text: string };

/** A banner above a form's submit button for errors or confirmations from the server. */
export function FormMessage({ tone, text }: FormMessageProps) {
  const error = tone === 'error';
  return (
    <View
      style={[styles.box, error ? styles.error : styles.success]}
      accessibilityRole={error ? 'alert' : 'summary'}
      accessibilityLiveRegion="polite"
    >
      <Icon
        name={error ? 'alert' : 'check-circle'}
        size={18}
        color={error ? colors.danger : colors.success}
      />
      <Text style={[styles.text, { color: error ? colors.danger : colors.success }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  error: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  success: { backgroundColor: colors.successSoft, borderColor: colors.successBorder },
  text: { ...type.body, flex: 1, fontSize: 14.5, lineHeight: 20 },
});
