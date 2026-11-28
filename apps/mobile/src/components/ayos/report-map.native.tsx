import { hasMapbox } from '../../lib/expo-go';

/**
 * Phone: the native Mapbox map, or Mapbox GL JS in a WebView when the app has no Mapbox native
 * code (Expo Go). Loaded with require so the native module is never evaluated without it.
 */
export const ReportMap: typeof import('./report-map-mapbox').ReportMap = hasMapbox
  ? (require('./report-map-mapbox') as typeof import('./report-map-mapbox')).ReportMap
  : (require('./report-map-webgl') as typeof import('./report-map-webgl')).ReportMap;
