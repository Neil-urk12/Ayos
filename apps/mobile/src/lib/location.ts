import * as Location from 'expo-location';
import { distanceBetween, geohashForLocation } from 'geofire-common';
import { useCallback, useEffect, useState } from 'react';

import { draftLocation } from '../data/reports';

/**
 * Device GPS (FR-04). Reports store the fix as a Firestore GeoPoint plus a geohash for nearby
 * queries, and keep `map` ({x, y} fractions) for the neighbourhood map drawing.
 */

/** Centre of the neighbourhood map drawing (Lahug, Cebu City). The map spans 3 km each way. */
export const MAP_CENTER = { latitude: 10.333, longitude: 123.896 };
const MAP_SPAN_METRES = 3000;
const METRES_PER_DEGREE_LAT = 111_320;

export type LatLng = { latitude: number; longitude: number };

export type Place = LatLng & {
  /** Rough accuracy of the fix, in metres. */
  accuracy: number;
  street: string;
  area: string;
  /** Position on the map drawing, as fractions of its width and height. */
  map: { x: number; y: number };
  geohash: string;
};

/** Where a GPS position falls on the map drawing; positions off the drawing sit on its edge. */
export function toMapPosition({ latitude, longitude }: LatLng) {
  const north = (latitude - MAP_CENTER.latitude) * METRES_PER_DEGREE_LAT;
  const east =
    (longitude - MAP_CENTER.longitude) *
    METRES_PER_DEGREE_LAT *
    Math.cos((MAP_CENTER.latitude * Math.PI) / 180);
  const clamp = (v: number) => Math.min(0.98, Math.max(0.02, v));
  return { x: clamp(0.5 + east / MAP_SPAN_METRES), y: clamp(0.5 - north / MAP_SPAN_METRES) };
}

/** Metres between two GPS positions. */
export function metresBetween(a: LatLng, b: LatLng) {
  return distanceBetween([a.latitude, a.longitude], [b.latitude, b.longitude]) * 1000;
}

async function describe(position: LatLng): Promise<{ street: string; area: string }> {
  try {
    const [address] = await Location.reverseGeocodeAsync(position);
    const street = address?.street || address?.name || '';
    const area = address?.district || address?.subregion || address?.city || '';
    if (street || area) {
      return { street: street || area, area: area || address?.city || street };
    }
  } catch (error) {
    // Reverse geocoding needs a connection; the position itself is what matters.
    console.warn('[location] Could not look up the address:', error);
  }
  return {
    street: `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`,
    area: 'Pinned location',
  };
}

// Lets useDevicePosition start as soon as New report has been given permission.
const permissionListeners = new Set<() => void>();

export class LocationDeniedError extends Error {
  constructor() {
    super('Location permission was not granted.');
  }
}

/** Asks for permission, then reads the GPS and looks up the street and area. */
export async function getCurrentPlace(): Promise<Place> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) throw new LocationDeniedError();
  permissionListeners.forEach((listener) => listener());
  const { coords } = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  const position = { latitude: coords.latitude, longitude: coords.longitude };
  const { street, area } = await describe(position);
  return {
    ...position,
    accuracy: Math.max(1, Math.round(coords.accuracy ?? 0)),
    street,
    area,
    map: toMapPosition(position),
    geohash: geohashForLocation([position.latitude, position.longitude]),
  };
}

export type PlaceState =
  | { status: 'loading' }
  | { status: 'ready'; place: Place }
  | { status: 'denied' }
  | { status: 'error' };

/** The device's current place for the New report form, with a retry. Asks only when `enabled`. */
export function useCurrentPlace(enabled: boolean) {
  const [state, setState] = useState<PlaceState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    getCurrentPlace()
      .then((place) => !cancelled && setState({ status: 'ready', place }))
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof LocationDeniedError) {
          setState({ status: 'denied' });
        } else {
          console.warn('[location] Could not get a GPS fix:', error);
          setState({ status: 'error' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt, enabled]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
}

/**
 * Where the user is, for "nearby" distances on the map and list (FR-08). Doesn't ask for
 * permission itself (New report does); until there's a fix or without permission, it's the
 * map's default spot.
 */
export function useDevicePosition(): { position: LatLng | null; map: { x: number; y: number } } {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [granted, setGranted] = useState(0);

  useEffect(() => {
    const listener = () => setGranted((n) => n + 1);
    permissionListeners.add(listener);
    return () => {
      permissionListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;
    Location.getForegroundPermissionsAsync()
      .then(async ({ granted }) => {
        if (!granted || cancelled) return;
        const last = await Location.getLastKnownPositionAsync();
        if (last && !cancelled) setPosition(last.coords);
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
          ({ coords }) => setPosition({ latitude: coords.latitude, longitude: coords.longitude }),
        );
        if (cancelled) subscription.remove();
      })
      .catch((error) => console.warn('[location] Could not watch the position:', error));
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [granted]);

  return { position, map: position ? toMapPosition(position) : draftLocation.map };
}
