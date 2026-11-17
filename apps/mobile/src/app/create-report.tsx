import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { Link } from 'expo-router';

export default function CreateReportScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Header Row --- */}
        <View style={styles.header}>
          <Link href="/map" style={styles.backLinkWrapper}>
            <View style={styles.backButton}>
              <SymbolView name="chevron.left" size={18} tintColor="#111827" fallback={<BackFallback />} />
            </View>
          </Link>
          <Text style={styles.headerTitle}>New report</Text>
          <Text style={styles.draftText}>Draft saved</Text>
        </View>

        {/* --- Photo Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Photo <Text style={styles.asterisk}>*</Text>
          </Text>
          
          <View style={styles.photosRow}>
            {/* Captured Photo Card */}
            <View style={styles.photoCardMain}>
              <SymbolView name="photo" size={32} tintColor="#71767E" fallback={<PhotoFallback />} />
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>Taken 9:41 AM</Text>
              </View>
            </View>

            {/* Add Angle Card */}
            <View style={styles.photoCardAdd}>
              <SymbolView name="camera" size={26} tintColor="#1856D6" fallback={<CameraFallback />} />
              <Text style={styles.addAngleText}>Add angle</Text>
            </View>
          </View>

          <Text style={styles.hintText}>Avoid faces and plate numbers. Up to 3 photos.</Text>
        </View>

        {/* --- What's the problem Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            What's the problem? <Text style={styles.asterisk}>*</Text>
          </Text>

          <View style={styles.problemsGrid}>
            <View style={[styles.problemCard, styles.problemCardActive]}>
              <Text style={[styles.problemCardText, styles.problemCardTextActive]}>Road damage</Text>
            </View>
            <View style={styles.problemCard}>
              <Text style={styles.problemCardText}>Drainage</Text>
            </View>
            <View style={styles.problemCard}>
              <Text style={styles.problemCardText}>Streetlight</Text>
            </View>
            <View style={styles.problemCard}>
              <Text style={styles.problemCardText}>Sidewalk</Text>
            </View>
          </View>
        </View>

        {/* --- Location Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Location <Text style={styles.asterisk}>*</Text>
          </Text>

          <View style={styles.mapCard}>
            {/* Mini Map Graphic Simulation */}
            <View style={styles.miniMap}>
              <View style={styles.miniMapRoadH} />
              <View style={styles.miniMapRoadV} />
              <View style={styles.miniMapPin}>
                <SymbolView name="mappin" size={16} tintColor="#FFFFFF" fallback={<PinFallback />} />
              </View>
            </View>

            {/* Location Details Footer */}
            <View style={styles.mapFooter}>
              <View>
                <Text style={styles.locationTitle}>Gorordo Ave, Lahug</Text>
                <Text style={styles.locationMeta}>From GPS · accurate to about 8 m</Text>
              </View>
              <View style={styles.adjustButton}>
                <Text style={styles.adjustButtonText}>Adjust pin</Text>
              </View>
            </View>
          </View>
        </View>

        {/* --- Short Description Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Short description</Text>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>
              About 1 m wide, near the jeepney stop. Motorcycles swerve around it.
            </Text>
          </View>
        </View>

        {/* --- Danger Toggle Section --- */}
        <View style={styles.dangerCard}>
          <View style={styles.dangerInfo}>
            <Text style={styles.dangerTitle}>Is it a danger to people right now?</Text>
            <Text style={styles.dangerSubtitle}>Helps the LGU judge public safety impact</Text>
          </View>
          <View style={styles.toggleContainer}>
            <View style={styles.toggleTrackActive}>
              <View style={styles.toggleThumbActive} />
            </View>
          </View>
        </View>

        {/* --- Submit Button --- */}
        <View style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Submit report</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* --- Fallback Icons (Android/Web) --- */
function BackFallback() { return <Text style={{ fontSize: 16 }}>‹</Text>; }
function PhotoFallback() { return <Text style={{ fontSize: 22 }}>🖼️</Text>; }
function CameraFallback() { return <Text style={{ fontSize: 20 }}>📷</Text>; }
function PinFallback() { return <Text style={{ fontSize: 12, color: '#FFF' }}>📍</Text>; }

/* --- Styles --- */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backLinkWrapper: {
    padding: 2,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4E8EF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  draftText: {
    fontSize: 14,
    color: '#5C6470',
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#141A24',
    marginBottom: 10,
  },
  asterisk: {
    color: '#D93838',
  },
  photosRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  photoCardMain: {
    width: 140,
    height: 140,
    borderRadius: 16,
    backgroundColor: '#DCDFE4',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  timeBadge: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: '#272C35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  photoCardAdd: {
    width: 120,
    height: 140,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D4DAE3',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addAngleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1856D6',
  },
  hintText: {
    fontSize: 12.5,
    color: '#5C6470',
  },
  problemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  problemCard: {
    width: '48%',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4DAE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  problemCardActive: {
    borderColor: '#1856D6',
    borderWidth: 2,
    backgroundColor: '#F3F6FD',
  },
  problemCardText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  problemCardTextActive: {
    color: '#1856D6',
    fontWeight: '700',
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4DAE3',
    overflow: 'hidden',
  },
  miniMap: {
    height: 110,
    backgroundColor: '#E8EDF4',
    position: 'relative',
  },
  miniMapRoadH: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    height: 16,
    backgroundColor: '#FFFFFF',
  },
  miniMapRoadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '46%',
    width: 16,
    backgroundColor: '#FFFFFF',
  },
  miniMapPin: {
    position: 'absolute',
    top: '28%',
    left: '47.5%',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D93838',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  locationMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  adjustButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4DAE3',
    backgroundColor: '#FFFFFF',
  },
  adjustButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  descriptionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4DAE3',
    padding: 14,
    minHeight: 70,
  },
  descriptionText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
  },
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4DAE3',
    padding: 16,
    marginBottom: 24,
  },
  dangerInfo: {
    flex: 1,
    paddingRight: 10,
  },
  dangerTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  dangerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  toggleContainer: {
    width: 52,
    height: 30,
  },
  toggleTrackActive: {
    flex: 1,
    backgroundColor: '#1856D6',
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  toggleThumbActive: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#1856D6',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
