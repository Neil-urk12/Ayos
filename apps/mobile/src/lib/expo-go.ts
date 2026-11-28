import { NativeModules } from 'react-native';

/**
 * True when the app binary includes Mapbox's native code (the APK or a development build).
 * Expo Go, or a build made before Mapbox was added, doesn't, so the maps fall back to the drawn
 * version there instead of crashing.
 */
export const hasMapbox = NativeModules.RNMBXModule != null;
