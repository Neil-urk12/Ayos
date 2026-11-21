import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ayos/button';
import { Icon } from '../../components/ayos/icon';
import { colors, radius, type } from '../../constants/design';
import { useAuth } from '../../data/auth-store';

export default function ProfileScreen() {
  const { user, profile, isGuest, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  // The route guard in _layout.tsx returns the user to sign in once this resolves.
  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
    }
  };

  const name = profile?.fullName ?? user?.displayName ?? '';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const rows = [
    { label: 'Email', value: profile?.email ?? user?.email ?? '' },
    { label: 'LGU / City / Municipality', value: profile?.lgu ?? '' },
    {
      label: 'Member since',
      value: profile?.createdAt
        ? profile.createdAt.toDate().toLocaleDateString('en-PH', { dateStyle: 'medium' })
        : '',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          Profile
        </Text>

        {isGuest ? (
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Icon name="user" size={26} color={colors.primary} />
            </View>
            <View style={styles.identityText}>
              <Text style={styles.name}>Guest</Text>
              <Text style={type.meta}>Create an account to keep your reports.</Text>
            </View>
          </View>
        ) : profile ? (
          <>
            <View style={styles.identity}>
              <View style={styles.avatar}>
                {initials ? (
                  <Text style={styles.initials}>{initials}</Text>
                ) : (
                  <Icon name="user" size={26} color={colors.primary} />
                )}
              </View>
              <View style={styles.identityText}>
                <Text style={styles.name}>{name}</Text>
                <Text style={type.meta}>Resident</Text>
              </View>
            </View>

            <View style={styles.card}>
              {rows.map((row, index) => (
                <View key={row.label} style={[styles.row, index > 0 && styles.rowDivider]}>
                  <Text style={type.meta}>{row.label}</Text>
                  <Text style={type.bodyStrong}>{row.value || '—'}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={type.meta}>Loading your profile…</Text>
          </View>
        )}

        <Button
          label={signingOut ? 'Signing out…' : 'Sign out'}
          variant="secondary"
          size="md"
          onPress={handleSignOut}
          disabled={signingOut}
          style={styles.signOut}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 32 },
  title: { ...type.title, fontSize: 30, marginBottom: 24 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { ...type.heading, color: colors.primary },
  identityText: { flex: 1, gap: 2 },
  name: { ...type.heading },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  row: { paddingVertical: 14, gap: 4 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  loading: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  signOut: { marginTop: 24 },
});
