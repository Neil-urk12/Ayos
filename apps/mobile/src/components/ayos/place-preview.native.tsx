import type { PlacePreviewProps } from './place-preview';
import { hasMapbox } from '../../lib/expo-go';

/**
 * Phone: the native Mapbox preview, or Mapbox GL JS in a WebView when the app has no Mapbox
 * native code (Expo Go). Loaded with require so the native module is never evaluated without it.
 */
export const PlacePreview: (props: PlacePreviewProps) => React.JSX.Element = hasMapbox
  ? (require('./place-preview-mapbox') as typeof import('./place-preview-mapbox')).PlacePreview
  : (require('./place-preview-webgl') as typeof import('./place-preview-webgl')).PlacePreview;
