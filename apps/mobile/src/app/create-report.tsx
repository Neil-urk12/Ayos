import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../components/ayos/button';
import { Icon } from '../components/ayos/icon';
import { HeaderNote, ScreenHeader } from '../components/ayos/screen-header';
import { colors, fonts, radius, type } from '../constants/design';
import {
  categoryLabels,
  categoryOrder,
  formatTime,
  type Category,
  type DraftPhoto,
  type ReportDraft,
} from '../data/reports';
import { useAuth } from '../data/auth-store';
import { useReports } from '../data/reports-store';
import { useCurrentPlace } from '../lib/location';

const MAX_PHOTOS = 3;

// Photos are shrunk again before saving (lib/firebase/photos.ts), so full quality isn't needed.
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.6,
  exif: false,
};

/** Opens the camera, or the photo library when `fromLibrary`; null if cancelled or refused. */
async function pickPhoto(fromLibrary: boolean): Promise<DraftPhoto | null> {
  if (!fromLibrary) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Camera access needed',
        'Allow camera access in Settings to take a photo, or choose one from your library.',
      );
      return null;
    }
  }
  const result = fromLibrary
    ? await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS)
    : await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return null;
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    takenAt: formatTime(new Date()),
  };
}

export default function CreateReportScreen() {
  const insets = useSafeAreaInsets();
  const { saveDraft, findSimilar, submitNew } = useReports();
  const { isGuest } = useAuth();

  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [danger, setDanger] = useState(false);

  // FR-04: the report's location is the device's GPS fix, read when the form opens.
  const { state: placeState, retry: retryPlace } = useCurrentPlace(!isGuest);
  const place = placeState.status === 'ready' ? placeState.place : null;

  const canSend = photos.length > 0 && category !== null && place !== null;

  // firebase/firestore.rules refuses report writes from guests, so say so up front.
  if (isGuest) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="New report" />
        <View style={styles.guest}>
          <Icon name="user" size={26} color={colors.primary} />
          <Text style={styles.guestText} accessibilityRole="alert">
            Guests can browse reports but can’t send or join one. To report a problem, sign out and
            create an account.
          </Text>
        </View>
      </View>
    );
  }

  const addPhoto = (fromLibrary: boolean) => {
    pickPhoto(fromLibrary)
      .then((photo) => {
        if (photo) setPhotos((current) => [...current, photo].slice(0, MAX_PHOTOS));
      })
      .catch((error) => {
        console.warn('[create-report] Could not add photo:', error);
        Alert.alert('Couldn’t add the photo', 'Please try again.');
      });
  };

  const choosePhotoSource = () => {
    // The camera isn't available in the browser, and web alerts have no buttons.
    if (Platform.OS === 'web') {
      addPhoto(true);
      return;
    }
    Alert.alert('Add a photo', undefined, [
      { text: 'Take photo', onPress: () => addPhoto(false) },
      { text: 'Choose from library', onPress: () => addPhoto(true) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removePhoto = (index: number) => {
    const remove = () => setPhotos((current) => current.filter((_, i) => i !== index));
    if (Platform.OS === 'web') {
      remove();
      return;
    }
    Alert.alert('Remove this photo?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: remove },
    ]);
  };

  const send = () => {
    if (!category || !place) return;
    const draft: ReportDraft = {
      category,
      description,
      danger,
      street: place.street,
      area: place.area,
      accuracy: place.accuracy,
      location: { latitude: place.latitude, longitude: place.longitude },
      geohash: place.geohash,
      map: place.map,
      photos,
    };
    saveDraft(draft);

    if (findSimilar(draft).length > 0) {
      router.push('/duplicate-check');
      return;
    }
    router.replace({
      pathname: '/report/[id]',
      params: { id: submitNew(draft), sent: '1' },
    });
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="New report" right={<HeaderNote>Draft saved</HeaderNote>} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* FR-14: safe-reporting reminder, before anything else on the form. */}
          <View style={styles.safety} accessibilityRole="alert">
            <Icon name="shield" size={22} color={colors.primary} />
            <View style={styles.safetyText}>
              <Text style={styles.safetyTitle}>Report only when it’s safe</Text>
              <Text style={styles.safetyBody}>
                Pull over before using your phone, and stay off the road while taking photos.
              </Text>
            </View>
          </View>

          <View style={styles.field}>
            <FieldLabel required>Photo</FieldLabel>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photos}
            >
              {photos.map((photo, index) => (
                <Pressable
                  key={photo.uri}
                  accessibilityRole="button"
                  accessibilityLabel={`Photo ${index + 1}, taken ${photo.takenAt}`}
                  accessibilityHint="Removes this photo"
                  onPress={() => removePhoto(index)}
                  style={({ pressed }) => [styles.photo, pressed && styles.pressed]}
                >
                  <Image
                    source={{ uri: photo.uri }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  <Text style={styles.photoBadge}>Taken {photo.takenAt}</Text>
                </Pressable>
              ))}
              {photos.length < MAX_PHOTOS && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={photos.length === 0 ? 'Add a photo' : 'Add another angle'}
                  onPress={choosePhotoSource}
                  style={({ pressed }) => [styles.addPhoto, pressed && styles.pressed]}
                >
                  <Icon name="camera" size={26} color={colors.textSecondary} />
                  <Text style={styles.addPhotoText}>
                    {photos.length === 0 ? 'Add photo' : 'Add angle'}
                  </Text>
                </Pressable>
              )}
            </ScrollView>
            <Text style={styles.hint}>
              Avoid faces and plate numbers. Up to 3 photos. Tap a photo to remove it.
            </Text>
          </View>

          <View style={styles.field}>
            <FieldLabel required>What&apos;s the problem?</FieldLabel>
            <View style={styles.categories} accessibilityRole="radiogroup">
              {categoryOrder.map((option) => {
                const selected = category === option;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => setCategory(option)}
                    style={[styles.category, selected && styles.categorySelected]}
                  >
                    <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>
                      {categoryLabels[option]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <FieldLabel required>Location</FieldLabel>
            <View style={styles.locationCard}>
              <View style={styles.miniMap} accessibilityLabel="Map preview of the pin">
                <View style={styles.miniRoadAcross} />
                <View style={styles.miniRoadDown} />
                <View style={styles.pin}>
                  <View style={styles.pinHead}>
                    <View style={styles.pinDot} />
                  </View>
                </View>
              </View>
              <View style={styles.locationRow} accessibilityLiveRegion="polite">
                {placeState.status === 'loading' ? (
                  <>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={[styles.locationMeta, styles.locationText]}>
                      Finding your location…
                    </Text>
                  </>
                ) : placeState.status === 'ready' ? (
                  <>
                    <View style={styles.locationText}>
                      <Text style={styles.locationName}>
                        {placeState.place.street}, {placeState.place.area}
                      </Text>
                      <Text style={styles.locationMeta}>
                        From GPS · accurate to about {placeState.place.accuracy} m
                      </Text>
                    </View>
                    <Button
                      label="Refresh"
                      variant="secondary"
                      size="md"
                      onPress={retryPlace}
                      style={styles.adjust}
                    />
                  </>
                ) : (
                  <>
                    <View style={styles.locationText}>
                      <Text style={styles.locationName} accessibilityRole="alert">
                        {placeState.status === 'denied'
                          ? 'Location is off for Ayos'
                          : 'Couldn’t get your location'}
                      </Text>
                      <Text style={styles.locationMeta}>
                        {placeState.status === 'denied'
                          ? 'Allow location so the LGU knows where the problem is.'
                          : 'Turn on location services and try again.'}
                      </Text>
                    </View>
                    <Button
                      label={placeState.status === 'denied' ? 'Settings' : 'Try again'}
                      variant="secondary"
                      size="md"
                      onPress={() =>
                        placeState.status === 'denied'
                          ? Linking.openSettings().catch(() => retryPlace())
                          : retryPlace()
                      }
                      style={styles.adjust}
                    />
                  </>
                )}
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <FieldLabel>Short description</FieldLabel>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Size, landmarks, how it affects people"
              placeholderTextColor={colors.placeholder}
              accessibilityLabel="Short description"
              multiline
              maxLength={280}
              style={styles.description}
            />
          </View>

          <View style={styles.dangerCard}>
            <View style={styles.dangerText}>
              <Text style={styles.dangerTitle}>Is it a danger to people right now?</Text>
              <Text style={styles.dangerMeta}>Helps the LGU judge public safety impact</Text>
            </View>
            <Switch
              value={danger}
              onValueChange={setDanger}
              accessibilityLabel="Danger to people right now"
              trackColor={{ false: colors.borderStrong, true: colors.primary }}
              thumbColor={colors.surface}
              ios_backgroundColor={colors.borderStrong}
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button label="Send report" onPress={send} disabled={!canSend} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {children}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

const PHOTO_WIDTH = 150;
const PHOTO_HEIGHT = 112;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  guest: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  guestText: { ...type.body, color: colors.textSecondary, textAlign: 'center', maxWidth: 280 },
  content: { padding: 16, paddingTop: 20, gap: 26 },
  safety: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  safetyText: { flex: 1, gap: 2 },
  safetyTitle: { fontFamily: fonts.semibold, fontSize: 15.5, color: colors.text },
  safetyBody: { ...type.meta, fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  field: { gap: 10 },
  label: { ...type.label, fontSize: 16 },
  required: { color: colors.danger },
  photos: { gap: 10 },
  photo: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    borderRadius: 14,
    backgroundColor: colors.photo,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.photoBadge,
    color: colors.onPrimary,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  addPhoto: {
    width: 112,
    height: PHOTO_HEIGHT,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#A9B1BC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addPhotoText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textSecondary,
  },
  pressed: { opacity: 0.6 },
  hint: { ...type.small, fontSize: 13.5, color: colors.textMuted },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  category: {
    flexBasis: '47%',
    flexGrow: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categorySelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  categoryText: {
    fontFamily: fonts.medium,
    fontSize: 15.5,
    color: colors.text,
  },
  categoryTextSelected: { fontFamily: fonts.semibold, color: '#1E3A8A' },
  locationCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  miniMap: { height: 84, backgroundColor: colors.map, overflow: 'hidden' },
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingLeft: 12,
  },
  locationText: { flex: 1, gap: 2 },
  locationName: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  locationMeta: { ...type.meta, fontSize: 13.5, color: colors.textSecondary },
  adjust: { paddingHorizontal: 12 },
  description: {
    minHeight: 60,
    maxHeight: 140,
    paddingHorizontal: 13,
    paddingTop: 11,
    paddingBottom: 11,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 21,
    color: colors.text,
    textAlignVertical: 'top',
  },
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dangerText: { flex: 1, gap: 2 },
  dangerTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  dangerMeta: { ...type.meta, fontSize: 14, color: colors.textSecondary },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
  },
});
