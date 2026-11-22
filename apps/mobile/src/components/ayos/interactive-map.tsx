import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import { Icon, type IconName } from '@/components/ayos/icon';
import { categoryColors, colors, fonts, shadow } from '@/constants/design';
import { type Category, type Report } from '@/data/reports';

const categoryIcons: Record<Category, IconName> = {
  road: 'alert',
  drainage: 'droplet',
  streetlight: 'bulb',
  sidewalk: 'alert',
};

const DEFAULT_REGION: Region = {
  latitude: 10.3157,
  longitude: 123.8854,
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

export type InteractiveMapHandle = {
  animateToCoords: (coords: { latitude: number; longitude: number }, delta?: number) => void;
};

type Props = {
  reports: Report[];
  onSelectReport: (report: Report) => void;
};

export const InteractiveMap = forwardRef<InteractiveMapHandle, Props>(
  function InteractiveMap({ reports, onSelectReport }, ref) {
    const mapRef = useRef<MapView>(null);

    useImperativeHandle(ref, () => ({
      animateToCoords(coords, delta = 0.012) {
        mapRef.current?.animateToRegion(
          { ...coords, latitudeDelta: delta, longitudeDelta: delta },
          450
        );
      },
    }));

    return (
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {reports.map((report) => {
          const showCount = report.reportCount > 1;
          return (
            <Marker
              key={report.id}
              coordinate={report.coords}
              onPress={() => onSelectReport(report)}
              tracksViewChanges={false}
            >
              <View
                style={[
                  styles.marker,
                  showCount ? styles.markerLarge : styles.markerSmall,
                  { backgroundColor: categoryColors[report.category] },
                ]}
              >
                {showCount ? (
                  <Text style={styles.markerCount}>{report.reportCount}</Text>
                ) : (
                  <Icon name={categoryIcons[report.category]} size={17} color={colors.onPrimary} />
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>
    );
  }
);

const styles = StyleSheet.create({
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadow.raised,
  },
  markerLarge: { width: 40, height: 40, borderRadius: 20 },
  markerSmall: { width: 34, height: 34, borderRadius: 17 },
  markerCount: { fontFamily: fonts.bold, fontSize: 14, color: colors.onPrimary },
});