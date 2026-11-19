import { StyleSheet, View, type DimensionValue } from 'react-native';

import { colors } from '@/constants/design';

type Road = { at: DimensionValue; width: number; angle: number };

const across: Road[] = [
  { at: '14%', width: 22, angle: -11 },
  { at: '42%', width: 26, angle: -11 },
  { at: '60%', width: 14, angle: -3 },
];

const down: Road[] = [
  { at: '12%', width: 16, angle: 2 },
  { at: '44%', width: 30, angle: 6 },
  { at: '80%', width: 18, angle: 3 },
];

/**
 * Stylised street grid that stands in for a real map tile layer.
 */
export function MapBackdrop() {
  return (
    <View style={styles.map} pointerEvents="none">
      <View style={[styles.park, { top: '9%', left: '5%', width: '31%', height: '15%' }]} />
      <View style={[styles.park, { top: '39%', left: '64%', width: '28%', height: '13%' }]} />
      {across.map((road) => (
        <View
          key={`a${road.at}`}
          style={[
            styles.across,
            { top: road.at, height: road.width, transform: [{ rotate: `${road.angle}deg` }] },
          ]}
        />
      ))}
      {down.map((road) => (
        <View
          key={`d${road.at}`}
          style={[
            styles.down,
            { left: road.at, width: road.width, transform: [{ rotate: `${road.angle}deg` }] },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { ...StyleSheet.absoluteFill, backgroundColor: colors.map, overflow: 'hidden' },
  park: { position: 'absolute', backgroundColor: colors.mapPark, borderRadius: 6 },
  across: { position: 'absolute', left: '-50%', width: '200%', backgroundColor: colors.mapRoad },
  down: { position: 'absolute', top: '-50%', height: '200%', backgroundColor: colors.mapRoad },
});
