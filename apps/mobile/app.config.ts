import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Adds secrets that can't live in app.json (which is committed). Set them in .env.local,
 * which Expo loads when building:
 *
 * - GOOGLE_MAPS_API_KEY: Maps SDK for Android key for the Map tab (react-native-maps).
 *   Without it the app still builds, but the map shows blank.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  plugins: [
    ...(config.plugins ?? []),
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '' }],
  ],
});
