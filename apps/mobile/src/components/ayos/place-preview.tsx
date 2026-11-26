import { PlaceDrawing } from './place-drawing';

export type PlacePreviewProps = {
  /** The GPS fix to show, or null while it's being read. */
  coordinate: { latitude: number; longitude: number } | null;
};

/** Web: react-native-maps doesn't run in the browser, so keep the drawn preview. */
export function PlacePreview(_props: PlacePreviewProps) {
  return <PlaceDrawing />;
}
