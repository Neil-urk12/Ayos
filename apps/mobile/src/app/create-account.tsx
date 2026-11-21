import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  type TextInputInstance,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/ayos/button';
import { FormMessage } from '../components/ayos/form-message';
import { Icon } from '../components/ayos/icon';
import { TextField } from '../components/ayos/text-field';
import { colors, fonts, type } from '../constants/design';
import { useAuth } from '../data/auth-store';
import { authErrorMessage } from '../lib/firebase/auth-errors';
import {
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validateNewPassword,
  validatePasswordMatch,
  validateRequired,
} from '../lib/validation';

type Field = 'fullName' | 'email' | 'lgu' | 'password' | 'confirm';
type Errors = Partial<Record<Field, string>>;

export default function CreateAccountScreen() {
  const { signUp } = useAuth();
  const [form, setForm] = useState<Record<Field, string>>({
    fullName: '',
    email: '',
    lgu: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailRef = useRef<TextInputInstance>(null);
  const lguRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);

  const set = (field: Field) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  // signUp ends signed out, so on success go to sign in with the email filled in.
  const submit = async () => {
    if (submitting) return;
    const next: Errors = {
      fullName: validateRequired(form.fullName, 'Enter your full name.'),
      email: validateEmail(form.email),
      lgu: validateRequired(form.lgu, 'Enter your city or municipality.'),
      password: validateNewPassword(form.password),
      confirm: validatePasswordMatch(form.password, form.confirm),
    };
    setErrors(next);
    setFormError(null);
    if (Object.values(next).some(Boolean)) return;

    setSubmitting(true);
    try {
      await signUp({
        fullName: form.fullName,
        email: form.email,
        lgu: form.lgu,
        password: form.password,
      });
      router.replace({
        pathname: '/',
        params: { email: form.email.trim(), created: '1' },
      });
    } catch (error) {
      setFormError(authErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.brand}>
              <View style={styles.logo}>
                <Icon name="wrench" size={20} color={colors.onPrimary} />
              </View>
              <Text style={styles.brandName}>AYOS</Text>
            </View>
            <Link href="/" style={styles.headerLink}>
              Sign in
            </Link>
          </View>

          <Text style={styles.headline} accessibilityRole="header">
            Create your account
          </Text>
          <Text style={styles.lede}>
            Register to report broken infrastructure and get updates from your local government unit
            (LGU).
          </Text>

          <View style={styles.form}>
            <TextField
              label="Full name"
              value={form.fullName}
              onChangeText={set('fullName')}
              error={errors.fullName}
              placeholder="Juan Dela Cruz"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
            <TextField
              ref={emailRef}
              label="Email"
              value={form.email}
              onChangeText={set('email')}
              error={errors.email}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => lguRef.current?.focus()}
              containerStyle={styles.fieldSpaced}
            />
            <TextField
              ref={lguRef}
              label="LGU / City / Municipality"
              value={form.lgu}
              onChangeText={set('lgu')}
              error={errors.lgu}
              placeholder="Lapu-Lapu City"
              autoCapitalize="words"
              autoComplete="address-line2"
              textContentType="addressCity"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
              containerStyle={styles.fieldSpaced}
            />
            <TextField
              ref={passwordRef}
              label="Password"
              value={form.password}
              onChangeText={set('password')}
              error={errors.password}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => confirmRef.current?.focus()}
              containerStyle={styles.fieldSpaced}
            />
            <TextField
              ref={confirmRef}
              label="Confirm password"
              value={form.confirm}
              onChangeText={set('confirm')}
              error={errors.confirm}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={submit}
              containerStyle={styles.fieldSpaced}
            />

            {formError ? <FormMessage tone="error" text={formError} /> : null}

            <Button
              label={submitting ? 'Creating account…' : 'Create account'}
              onPress={submit}
              disabled={submitting}
              style={styles.submit}
            />

            <View style={styles.footer}>
              <Text style={styles.footerPrompt}>Already have an account? </Text>
              <Link href="/" style={styles.link}>
                Sign in
              </Link>
            </View>
          </View>

          <Text style={styles.privacy}>
            Your name, email and LGU are stored to process your reports, under the Data Privacy Act
            of 2012 (RA 10173).
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: 0.5,
    color: colors.text,
  },
  headerLink: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  headline: { ...type.hero, marginBottom: 12 },
  lede: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
    marginBottom: 28,
  },
  form: { marginBottom: 28 },
  fieldSpaced: { marginTop: 18 },
  submit: { marginTop: 22 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerPrompt: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  link: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  privacy: {
    ...type.small,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 'auto',
  },
});
