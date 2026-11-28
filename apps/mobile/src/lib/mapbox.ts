import Mapbox from '@rnmapbox/maps';

/**
 * Mapbox public access token (pk.…) from the Mapbox console > Access tokens. It's inlined at
 * build time from EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN (.env.local, or EAS environment variables).
 * Without it the app still runs, but the maps stay blank.
 */
const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';
if (!token) console.warn('[mapbox] EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN is not set; maps are blank.');
void Mapbox.setAccessToken(token);

export { Mapbox };

/** Mapbox positions are [longitude, latitude]. */
export const toPosition = (c: { latitude: number; longitude: number }): [number, number] => [
  c.longitude,
  c.latitude,
];
