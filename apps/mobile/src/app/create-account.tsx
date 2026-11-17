import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { Link } from 'expo-router';

export default function CreateAccountScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Row: Logo + Back Link */}
        <View style={styles.header}>
          <View style={styles.brandGroup}>
            <View style={styles.logoBadge}>
              <SymbolView
                name="wrench.fill"
                size={22}
                tintColor="#FFFFFF"
                fallback={<WrenchFallbackIcon />}
              />
            </View>
            <Text style={styles.brandName}>AYOS</Text>
          </View>

          <Link href="/" style={styles.backLink}>
            <Text style={styles.backLinkText}>Sign in</Text>
          </Link>
        </View>

        {/* Hero Copy */}
        <Text style={styles.headline}>Create your account</Text>
        <Text style={styles.subheadline}>
          Register to report broken infrastructure and track updates from your local government unit (LGU).
        </Text>

        {/* Registration Form */}
        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <View style={styles.inputBox}>
            <Text style={styles.placeholderText}>Juan Dela Cruz</Text>
          </View>

          <Text style={[styles.inputLabel, styles.fieldSpacing]}>Email</Text>
          <View style={styles.inputBox}>
            <Text style={styles.placeholderText}>you@example.com</Text>
          </View>

          <Text style={[styles.inputLabel, styles.fieldSpacing]}>LGU / City / Municipality</Text>
          <View style={styles.inputBox}>
            <Text style={styles.placeholderText}>Lapu-Lapu City</Text>
          </View>

          <Text style={[styles.inputLabel, styles.fieldSpacing]}>Password</Text>
          <View style={styles.inputBox}>
            <Text style={styles.placeholderText}>••••••••</Text>
          </View>

          <Text style={[styles.inputLabel, styles.fieldSpacing]}>Confirm Password</Text>
          <View style={styles.inputBox}>
            <Text style={styles.placeholderText}>••••••••</Text>
          </View>

          <View style={styles.createButton}>
            <Text style={styles.createButtonText}>Create account</Text>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerPrompt}>Already have an account? </Text>
            <Link href="/" style={styles.inlineLink}>
              <Text style={styles.inlineLinkText}>Sign in</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* --- Cross-platform Fallback Icon --- */

function WrenchFallbackIcon() {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 14,
          height: 3.5,
          backgroundColor: '#FFFFFF',
          borderRadius: 2,
          transform: [{ rotate: '-45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 3,
          right: 3,
          width: 8,
          height: 8,
          borderRadius: 4,
          borderWidth: 2.2,
          borderColor: '#FFFFFF',
          backgroundColor: '#1856D6',
        }}
      />
    </View>
  );
}

/* --- Styles --- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1856D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.6,
  },
  backLink: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  backLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1856D6',
  },
  headline: {
    fontSize: 31,
    fontWeight: '800',
    color: '#141A24',
    lineHeight: 37,
    letterSpacing: -0.6,
    marginBottom: 10,
  },
  subheadline: {
    fontSize: 15.5,
    fontWeight: '400',
    color: '#525A66',
    lineHeight: 22,
    marginBottom: 28,
  },
  formSection: {
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#141A24',
    marginBottom: 8,
  },
  fieldSpacing: {
    marginTop: 16,
  },
  inputBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4DAE3',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 15.5,
    color: '#71767E',
  },
  createButton: {
    backgroundColor: '#1856D6',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerPrompt: {
    color: '#5C6470',
    fontSize: 14.5,
  },
  inlineLink: {
    padding: 2,
  },
  inlineLinkText: {
    color: '#1856D6',
    fontSize: 14.5,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});