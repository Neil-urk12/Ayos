import { StyleSheet, View } from 'react-native';

import { PlaceDrawing, PREVIEW_HEIGHT } from './place-drawing';
import type { PlacePreviewProps } from './place-preview';
import { colors } from '../../constants/design';
import { Mapbox, toPosition } from '../../lib/mapbox';

/** About 300 m across: enough to recognise the street. */
const ZOOM = 16.5;

/** The New report location as a small, fixed Mapbox map with a pin at the GPS fix (FR-04). */
export function PlacePreview({ coordinate }: PlacePreviewProps) {
  if (!coordinate) return <PlaceDrawing />;
  const position = toPosition(coordinate);
  return (
    <View
      style={styles.preview}
      accessibilityLabel="Map preview of the pin"
      // The form scrolls instead of the map.
      pointerEvents="none"
    >
      <Mapbox.MapView
        style={StyleSheet.absoluteFill}
        styleURL={Mapbox.StyleURL.Street}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        scaleBarEnabled={false}
        compassEnabled={false}
      >
        <Mapbox.Camera
          // Re-centre when the user refreshes the fix.
          centerCoordinate={position}
          zoomLevel={ZOOM}
          animationDuration={0}
        />
        <Mapbox.MarkerView coordinate={position} anchor={{ x: 0.5, y: 1 }} allowOverlap>
          <View style={styles.pin}>
            <View style={styles.pinDot} />
          </View>
        </Mapbox.MarkerView>
      </Mapbox.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { height: PREVIEW_HEIGHT, backgroundColor: colors.map, overflow: 'hidden' },
  pin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderBottomRightRadius: 0,
    transform: [{ rotate: '45deg' }],
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  pinDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surface },
});
