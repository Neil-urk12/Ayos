import { StyleSheet, View } from 'react-native';

import { MapboxWeb } from './mapbox-web';
import { PlaceDrawing, PREVIEW_HEIGHT } from './place-drawing';
import type { PlacePreviewProps } from './place-preview';
import { colors } from '../../constants/design';

/** About 300 m across: enough to recognise the street. */
const ZOOM = 16.5;

/** The New report location preview in Expo Go: Mapbox GL JS in a WebView, fixed in place. */
export function PlacePreview({ coordinate }: PlacePreviewProps) {
  if (!coordinate) return <PlaceDrawing />;
  return (
    <View style={styles.preview} accessibilityLabel="Map preview of the pin" pointerEvents="none">
      <MapboxWeb center={coordinate} zoom={ZOOM} interactive={false} pin={coordinate} />
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { height: PREVIEW_HEIGHT, backgroundColor: colors.map, overflow: 'hidden' },
});
