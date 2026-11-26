import { StyleSheet, View } from 'react-native';

import { colors } from '../../constants/design';

/** The drawn mini map with a centred pin: shown on web, and on phones until there's a GPS fix. */
export function PlaceDrawing() {
  return (
    <View style={styles.miniMap} accessibilityLabel="Map preview of the pin">
      <View style={styles.miniRoadAcross} />
      <View style={styles.miniRoadDown} />
      <View style={styles.pin}>
        <View style={styles.pinHead}>
          <View style={styles.pinDot} />
        </View>
      </View>
    </View>
  );
}

export const PREVIEW_HEIGHT = 84;

const styles = StyleSheet.create({
  miniMap: { height: PREVIEW_HEIGHT, backgroundColor: colors.map, overflow: 'hidden' },
  miniRoadAcross: {
    position: 'absolute',
    left: '-10%',
    width: '120%',
    top: 30,
    height: 14,
    backgroundColor: colors.mapRoad,
    transform: [{ rotate: '1.5deg' }],
  },
  miniRoadDown: {
    position: 'absolute',
    top: -20,
    height: 130,
    left: '43%',
    width: 14,
    backgroundColor: colors.mapRoad,
    transform: [{ rotate: '-8deg' }],
  },
  pin: { position: 'absolute', left: '45%', top: 16 },
  pinHead: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderBottomRightRadius: 0,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
});
