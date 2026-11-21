import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
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
  draftLocation,
  formatTime,
  type Category,
  type ReportDraft,
} from '../data/reports';
import { useReports } from '../data/reports-store';

const MAX_PHOTOS = 3;

export default function CreateReportScreen() {
  const insets = useSafeAreaInsets();
  const { saveDraft, findSimilar, submitNew } = useReports();

  const [photos, setPhotos] = useState<string[]>(() => [formatTime(new Date())]);
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [danger, setDanger] = useState(false);

  const canSend = photos.length > 0 && category !== null;

  const send = () => {
    if (!category) return;
    const draft: ReportDraft = {
      category,
      description,
      danger,
      street: draftLocation.street,
      area: draftLocation.area,
      accuracy: draftLocation.accuracy,
      photoTakenAt: photos[0],
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
          <View style={styles.field}>
            <FieldLabel required>Photo</FieldLabel>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photos}
            >
              {photos.map((takenAt, index) => (
                <View
                  key={`${takenAt}-${index}`}
                  style={styles.photo}
                  accessibilityLabel={`Photo ${index + 1}, taken ${takenAt}`}
                >
                  <Icon name="image" size={34} color="#5B6170" />
                  <Text style={styles.photoBadge}>Taken {takenAt}</Text>
                </View>
              ))}
              {photos.length < MAX_PHOTOS && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add another angle"
                  onPress={() => setPhotos((current) => [...current, formatTime(new Date())])}
                  style={({ pressed }) => [styles.addPhoto, pressed && styles.pressed]}
                >
                  <Icon name="camera" size={26} color={colors.textSecondary} />
                  <Text style={styles.addPhotoText}>Add angle</Text>
                </Pressable>
              )}
            </ScrollView>
            <Text style={styles.hint}>Avoid faces and plate numbers. Up to 3 photos.</Text>
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
              <View style={styles.locationRow}>
                <View style={styles.locationText}>
                  <Text style={styles.locationName}>
                    {draftLocation.street}, {draftLocation.area}
                  </Text>
                  <Text style={styles.locationMeta}>
                    From GPS · accurate to about {draftLocation.accuracy} m
                  </Text>
                </View>
                <Button label="Adjust pin" variant="secondary" size="md" style={styles.adjust} />
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
  content: { padding: 16, paddingTop: 20, gap: 26 },
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
