import { useId, type Ref } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputInstance,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, radius, type } from '../../constants/design';

type TextFieldProps = TextInputProps & {
  ref?: Ref<TextInputInstance>;
  label: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

/** Labelled text input with an inline error message, styled to the Ayos design. */
export function TextField({ label, error, containerStyle, style, ...inputProps }: TextFieldProps) {
  const id = useId();
  const labelId = `${id}-label`;

  return (
    <View style={containerStyle}>
      <Text style={styles.label} nativeID={labelId}>
        {label}
      </Text>
      <TextInput
        accessibilityLabelledBy={labelId}
        accessibilityLabel={label}
        accessibilityHint={error}
        placeholderTextColor={colors.placeholder}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...inputProps}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...type.label, fontSize: 15, marginBottom: 8 },
  input: {
    height: 50,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 15,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  error: { ...type.meta, color: colors.danger, marginTop: 6 },
});
