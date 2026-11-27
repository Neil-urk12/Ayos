/// <reference types="node" />
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Adds secrets that can't live in app.json (which is committed). Set them in .env.local,
 * which Expo loads when building:
 *
 * - GOOGLE_MAPS_API_KEY: Maps SDK for Android key for the Map tab (react-native-maps).
 *   Without it the app still builds, but the map shows blank.
 * - GOOGLE_SERVICES_JSON (optional): path to google-services.json, e.g. an EAS file
 *   environment variable. Defaults to ./google-services.json (gitignored). Without the file
 *   the app still builds, but push notifications don't work (src/lib/notifications.ts).
 */
export default ({ config, projectRoot }: ConfigContext): ExpoConfig => {
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON ?? './google-services.json';
  const hasGoogleServices = existsSync(resolve(projectRoot, googleServicesFile));
  if (!hasGoogleServices) {
    console.warn(`[app.config] ${googleServicesFile} not found; push notifications are off.`);
  }
  return {
    ...(config as ExpoConfig),
    android: {
      ...config.android,
      ...(hasGoogleServices ? { googleServicesFile } : {}),
    },
    plugins: [
      ...(config.plugins ?? []),
      ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '' }],
    ],
  };
};
