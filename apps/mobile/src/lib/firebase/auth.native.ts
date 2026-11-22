import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';

import { app } from './app';

/**
 * Android/iOS: keeps the signed-in session in AsyncStorage so users stay signed in
 * across app restarts. initializeAuth throws if called twice (e.g. on Fast Refresh),
 * so fall back to the instance that already exists.
 */
function createAuth(): Auth {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
