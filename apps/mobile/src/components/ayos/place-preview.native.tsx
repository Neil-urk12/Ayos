import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { PlaceDrawing, PREVIEW_HEIGHT } from './place-drawing';
import type { PlacePreviewProps } from './place-preview';
import { colors } from '../../constants/design';

/** About 300 m across: enough to recognise the street. */
const DELTA = 0.003;

/** The New report location as a small, fixed Google Map with a pin at the GPS fix (FR-04). */
export function PlacePreview({ coordinate }: PlacePreviewProps) {
  if (!coordinate) return <PlaceDrawing />;
  return (
    <View style={styles.preview} accessibilityLabel="Map preview of the pin">
      <MapView
        // Re-centre when the user refreshes the fix.
        key={`${coordinate.latitude},${coordinate.longitude}`}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...coordinate, latitudeDelta: DELTA, longitudeDelta: DELTA }}
        // A static image on Android: cheap, and the form scrolls instead of the map.
        liteMode
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        pointerEvents="none"
      >
        <Marker coordinate={coordinate} pinColor={colors.danger} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { height: PREVIEW_HEIGHT, backgroundColor: colors.map, overflow: 'hidden' },
});
