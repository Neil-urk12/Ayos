import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { colors } from '../constants/design';
import { AuthProvider, useAuth } from '../data/auth-store';
import { ReportsProvider } from '../data/reports-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { signedIn, initializing } = useAuth();
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  // Keep the splash up until fonts load and Firebase has restored any saved session,
  // so signed-in users don't see the sign-in screen flash first.
  const ready = (loaded || error) && !initializing;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  // When a guard blocks the current screen, redirectTo says where to go. It must be
  // explicit: the default fallback is the first allowed screen, (tabs), whose URL is
  // "/" because it has no index route, and "/" is the sign-in screen that was just
  // blocked, so the router ended up on "Unmatched route".
  return (
    <ReportsProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={signedIn} redirectTo="/">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="create-report" />
          <Stack.Screen name="duplicate-check" />
          <Stack.Screen name="report/[id]" />
          <Stack.Screen name="explore" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn} redirectTo="/map">
          <Stack.Screen name="index" />
          <Stack.Screen name="create-account" />
        </Stack.Protected>
      </Stack>
    </ReportsProvider>
  );
}
