import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { Link } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IndexScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Row: Logo + Language Switcher */}
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

          <View style={styles.langToggle}>
            <View style={[styles.langPill, styles.langPillActive]}>
              <Text style={[styles.langText, styles.langTextActive]}>EN</Text>
            </View>
            <View style={styles.langPill}>
              <Text style={styles.langText}>CEB</Text>
            </View>
          </View>
        </View>

        {/* Hero Copy */}
        <Text style={styles.headline}>
          {'Report broken roads,\nclogged drains and\ndead streetlights.'}
        </Text>
        <Text style={styles.subheadline}>
          Send a photo and a pin. Your LGU groups matching reports and tells you
          when it's fixed.
        </Text>

        {/* 3-Step Feature Cards */}
        <View style={styles.cardsRow}>
          <View style={styles.featureCard}>
            <View style={styles.iconBox}>
              <SymbolView
                name="camera"
                size={22}
                tintColor="#1856D6"
                fallback={<CameraFallbackIcon />}
              />
            </View>
            <Text style={styles.cardLabel}>{'Snap a\nphoto'}</Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.iconBox}>
              <SymbolView
                name="mappin"
                size={22}
                tintColor="#1856D6"
                fallback={<PinFallbackIcon />}
              />
            </View>
            <Text style={styles.cardLabel}>Drop a pin</Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.iconBox}>
              <SymbolView
                name="checkmark.circle"
                size={22}
                tintColor="#1856D6"
                fallback={<CheckCircleFallbackIcon />}
              />
            </View>
            <Text style={styles.cardLabel}>Track the fix</Text>
          </View>
        </View>

        {/* Static Auth Form */}
        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.inputBox}>
            <Text style={styles.placeholderText}>you@example.com</Text>
          </View>

          <Text style={[styles.inputLabel, styles.passwordLabelSpacing]}>
            Password
          </Text>
          <View style={styles.inputBox}>
            <Text style={styles.placeholderText}>••••••••</Text>
          </View>

          <Link href="/map" asChild>
            <View style={styles.signInButton}>
              <Text style={styles.signInButtonText}>Sign in</Text>
            </View>
          </Link>

          <View style={styles.linksRow}>
            <Link href="/create-account">
              <Text style={styles.linkText}>Create an account</Text>
            </Link>
            <Text style={styles.linkText}>Forgot password?</Text>
          </View>
        </View>

        {/* Footer Legal Note */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your photos and location are used only to process your report, under
            the Data Privacy Act of 2012 (RA 10173).{' '}
            <Text style={styles.footerLink}>Privacy notice</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* --- Cross-platform Fallback Icons (Android / Web) --- */

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

function CameraFallbackIcon() {
  return (
    <View style={{ width: 22, height: 18, justifyContent: 'flex-end' }}>
      <View
        style={{
          alignSelf: 'center',
          width: 8,
          height: 3,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
          borderWidth: 1.8,
          borderBottomWidth: 0,
          borderColor: '#1856D6',
        }}
      />
      <View
        style={{
          width: 22,
          height: 15,
          borderRadius: 3.5,
          borderWidth: 1.8,
          borderColor: '#1856D6',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 3.5,
            borderWidth: 1.8,
            borderColor: '#1856D6',
          }}
        />
      </View>
    </View>
  );
}

function PinFallbackIcon() {
  return (
    <View style={{ width: 20, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 16,
          height: 16,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          borderBottomLeftRadius: 8,
          borderWidth: 1.8,
          borderColor: '#1856D6',
          transform: [{ rotate: '45deg' }],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            borderWidth: 1.6,
            borderColor: '#1856D6',
          }}
        />
      </View>
    </View>
  );
}

function CheckCircleFallbackIcon() {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.8,
        borderColor: '#1856D6',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 9,
          height: 5,
          borderLeftWidth: 1.8,
          borderBottomWidth: 1.8,
          borderColor: '#1856D6',
          transform: [{ rotate: '-45deg' }, { translateY: -1 }],
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
  langToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E8EE',
    borderRadius: 22,
    padding: 3,
  },
  langPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  langPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  langText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5C6470',
  },
  langTextActive: {
    color: '#111827',
  },
  headline: {
    fontSize: 31,
    fontWeight: '800',
    color: '#141A24',
    lineHeight: 37,
    letterSpacing: -0.6,
    marginBottom: 14,
  },
  subheadline: {
    fontSize: 16,
    fontWeight: '400',
    color: '#525A66',
    lineHeight: 23,
    marginBottom: 28,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 11,
    marginBottom: 34,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E8EF',
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  iconBox: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#141A24',
    lineHeight: 18,
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
  passwordLabelSpacing: {
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
  signInButton: {
    backgroundColor: '#1856D6',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  linkText: {
    color: '#1856D6',
    fontSize: 14.5,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12.5,
    color: '#5C6470',
    lineHeight: 18,
  },
  footerLink: {
    color: '#1856D6',
    textDecorationLine: 'underline',
  },
});