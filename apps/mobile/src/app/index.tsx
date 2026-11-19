import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ayos/button';
import { Icon, type IconName } from '@/components/ayos/icon';
import { colors, fonts, radius, type } from '@/constants/design';

type Language = 'en' | 'ceb';

const features: { icon: IconName; label: string }[] = [
  { icon: 'camera', label: 'Snap a photo' },
  { icon: 'pin', label: 'Drop a pin' },
  { icon: 'check-circle', label: 'Track the fix' },
];

export default function SignInScreen() {
  const [language, setLanguage] = useState<Language>('en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = () => router.replace('/map');

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

            <View style={styles.languageToggle} accessibilityRole="radiogroup">
              {(['en', 'ceb'] as const).map((code) => {
                const active = language === code;
                return (
                  <Pressable
                    key={code}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={code === 'en' ? 'English' : 'Cebuano'}
                    onPress={() => setLanguage(code)}
                    style={[styles.languageOption, active && styles.languageOptionActive]}
                  >
                    <Text style={[styles.languageText, active && styles.languageTextActive]}>
                      {code.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Text style={styles.headline} accessibilityRole="header">
            Report broken roads, clogged drains and dead streetlights.
          </Text>
          <Text style={styles.lede}>
            Send a photo and a pin. Your LGU groups matching reports and tells you when it&apos;s
            fixed.
          </Text>

          <View style={styles.features}>
            {features.map((feature) => (
              <View key={feature.label} style={styles.featureCard}>
                <Icon name={feature.icon} size={22} color={colors.primary} />
                <Text style={styles.featureLabel}>{feature.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.form}>
            <Text style={styles.label} nativeID="email-label">
              Email
            </Text>
            <TextInput
              accessibilityLabelledBy="email-label"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              style={styles.input}
            />

            <Text style={[styles.label, styles.labelSpaced]} nativeID="password-label">
              Password
            </Text>
            <TextInput
              accessibilityLabelledBy="password-label"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={signIn}
              style={styles.input}
            />

            <Button label="Sign in" onPress={signIn} style={styles.signIn} />

            <Pressable
              accessibilityRole="button"
              onPress={signIn}
              style={({ pressed }) => [styles.guestButton, pressed && styles.guestButtonPressed]}
            >
              <Text style={styles.guestButtonText}>Sign in as guest</Text>
            </Pressable>

            <View style={styles.links}>
              <Link href="/create-account" style={styles.link}>
                Create an account
              </Link>
              <Text style={styles.link} accessibilityRole="link">
                Forgot password?
              </Text>
            </View>
          </View>

          <Text style={styles.privacy}>
            Your photos and location are used only to process your report, under the Data Privacy
            Act of 2012 (RA 10173).{'\n'}
            <Text style={styles.privacyLink} accessibilityRole="link">
              Privacy notice
            </Text>
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
    marginBottom: 32,
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
  languageToggle: {
    flexDirection: 'row',
    backgroundColor: '#E6E9EE',
    borderRadius: radius.pill,
    padding: 3,
  },
  languageOption: {
    minWidth: 42,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  languageOptionActive: {
    backgroundColor: colors.surface,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  languageText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted },
  languageTextActive: { color: colors.text },
  headline: { ...type.hero, marginBottom: 14 },
  lede: {
    fontFamily: fonts.regular,
    fontSize: 16.5,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: 28,
  },
  features: { flexDirection: 'row', gap: 10, marginBottom: 40 },
  featureCard: {
    flex: 1,
    minHeight: 86,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  featureLabel: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18, color: colors.text },
  form: { marginBottom: 32 },
  label: { ...type.label, fontSize: 15, marginBottom: 8 },
  labelSpaced: { marginTop: 18 },
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
  signIn: { marginTop: 14 },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  guestButton: {
    height: 50,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  guestButtonPressed: {
    opacity: 0.8,
  },
  guestButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.primary,
  },
  link: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  privacy: { ...type.small, fontSize: 13, color: colors.textSecondary, marginTop: 'auto' },
  privacyLink: { color: colors.primary, textDecorationLine: 'underline' },
});
