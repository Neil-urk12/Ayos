import React, { useState, useRef } from 'react';
import {
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { Link } from 'expo-router';

type CategoryType = 'All' | 'Road damage' | 'Drainage' | 'Streetlight';

export default function MapScreen() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [isExpanded, setIsExpanded] = useState(false);

  const categories: CategoryType[] = ['All', 'Road damage', 'Drainage', 'Streetlight'];

  // PanResponder to detect upward/downward drags on the sheet handle
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -30) {
          setIsExpanded(true); // Dragged up
        } else if (gestureState.dy > 30) {
          setIsExpanded(false); // Dragged down
        }
      },
    })
  ).current;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* --- Simulated Map Background Layer --- */}
        <View style={styles.mapBackground}>
          {/* Abstract street grids for map look */}
          <View style={styles.streetHorizontal1} />
          <View style={styles.streetHorizontal2} />
          <View style={styles.streetVertical1} />
          <View style={styles.streetVertical2} />

          {/* Green Park / Block overlays */}
          <View style={styles.parkBlock1} />
          <View style={styles.parkBlock2} />

          {/* Map Pin 1: Road Damage (6) */}
          {(selectedCategory === 'All' || selectedCategory === 'Road damage') && (
            <View style={[styles.mapMarker, styles.roadMarker, { top: '24%', left: '46%' }]}>
              <Text style={styles.markerText}>6</Text>
            </View>
          )}

          {/* Map Pin 2: Streetlight */}
          {(selectedCategory === 'All' || selectedCategory === 'Streetlight') && (
            <View style={[styles.mapMarker, styles.lightMarker, { top: '30%', left: '80%' }]}>
              <SymbolView name="lightbulb.fill" size={14} tintColor="#FFFFFF" fallback={<LightbulbFallback />} />
            </View>
          )}

          {/* Map Pin 3: Drainage */}
          {(selectedCategory === 'All' || selectedCategory === 'Drainage') && (
            <View style={[styles.mapMarker, styles.drainageMarker, { top: '36%', left: '26%' }]}>
              <SymbolView name="drop.fill" size={14} tintColor="#FFFFFF" fallback={<DropFallback />} />
            </View>
          )}

          {/* Map Pin 4: Road Damage (3) */}
          {(selectedCategory === 'All' || selectedCategory === 'Road damage') && (
            <View style={[styles.mapMarker, styles.roadMarker, { top: '47%', left: '64%' }]}>
              <Text style={styles.markerText}>3</Text>
            </View>
          )}

          {/* User Location Blue Dot */}
          <View style={styles.userLocationPulse} />
          <View style={styles.userLocationDot} />
        </View>

        {/* --- Top Overlay Controls (Search & Notification) --- */}
        <View style={styles.topOverlay}>
          <View style={styles.searchContainer}>
            <SymbolView name="magnifyingglass" size={18} tintColor="#5C6470" fallback={<SearchFallback />} />
            <Text style={styles.searchText}>Search a street or barangay</Text>
          </View>

          <Link href="/updates" asChild>
            <View style={styles.bellButton}>
              <SymbolView name="bell.fill" size={18} tintColor="#111827" fallback={<BellFallback />} />
            </View>
          </Link>
        </View>

        {/* --- Clickable Category Filter Chips --- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {categories.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* --- Draggable Bottom Sheet Panel ("Near you") --- */}
        <View style={[styles.bottomSheet, isExpanded && styles.bottomSheetExpanded]}>
          <Pressable
            onPress={() => setIsExpanded(!isExpanded)}
            {...panResponder.panHandlers}
            style={styles.handleContainer}
          >
            <View style={styles.dragHandle} />
          </Pressable>

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Near you</Text>
            <Text style={styles.sheetSubtitle}>{isExpanded ? 'Within 3 km' : 'Within 1 km'}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.reportList}>
            {/* Report Card 1 */}
            {(selectedCategory === 'All' || selectedCategory === 'Road damage') && (
              <View style={styles.reportCard}>
                <View style={styles.reportThumb}>
                  <SymbolView name="photo" size={20} tintColor="#71767E" fallback={<PhotoFallback />} />
                </View>
                <View style={styles.reportDetails}>
                  <Text style={styles.reportTitle} numberOfLines={1}>
                    Deep pothole, northbound lane
                  </Text>
                  <Text style={styles.reportMeta}>Gorordo Ave · 120 m · 6 reports</Text>
                </View>
                <View style={[styles.statusBadge, styles.statusInProgress]}>
                  <Text style={[styles.statusText, styles.textInProgress]}>In progress</Text>
                </View>
              </View>
            )}

            {/* Report Card 2 */}
            {(selectedCategory === 'All' || selectedCategory === 'Drainage') && (
              <View style={styles.reportCard}>
                <View style={styles.reportThumb}>
                  <SymbolView name="photo" size={20} tintColor="#71767E" fallback={<PhotoFallback />} />
                </View>
                <View style={styles.reportDetails}>
                  <Text style={styles.reportTitle} numberOfLines={1}>
                    Clogged canal inlet
                  </Text>
                  <Text style={styles.reportMeta}>Salinas Dr · 340 m · 3 reports</Text>
                </View>
                <View style={[styles.statusBadge, styles.statusVerified]}>
                  <Text style={[styles.statusText, styles.textVerified]}>Verified</Text>
                </View>
              </View>
            )}

            {/* Extra items shown when expanded */}
            {isExpanded && (
              <>
                <View style={styles.reportCard}>
                  <View style={styles.reportThumb}>
                    <SymbolView name="photo" size={20} tintColor="#71767E" fallback={<PhotoFallback />} />
                  </View>
                  <View style={styles.reportDetails}>
                    <Text style={styles.reportTitle} numberOfLines={1}>
                      Flickering pole light
                    </Text>
                    <Text style={styles.reportMeta}>Escario St · 850 m · 2 reports</Text>
                  </View>
                  <View style={[styles.statusBadge, styles.statusInProgress]}>
                    <Text style={[styles.statusText, styles.textInProgress]}>In progress</Text>
                  </View>
                </View>

                <View style={styles.reportCard}>
                  <View style={styles.reportThumb}>
                    <SymbolView name="photo" size={20} tintColor="#71767E" fallback={<PhotoFallback />} />
                  </View>
                  <View style={styles.reportDetails}>
                    <Text style={styles.reportTitle} numberOfLines={1}>
                      Broken sidewalk concrete
                    </Text>
                    <Text style={styles.reportMeta}>Juana Osmeña St · 1.2 km · 1 report</Text>
                  </View>
                  <View style={[styles.statusBadge, styles.statusVerified]}>
                    <Text style={[styles.statusText, styles.textVerified]}>Verified</Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>

        {/* --- Bottom Navigation Bar --- */}
        <View style={styles.bottomNav}>
          <Link href="/map" asChild>
            <View style={styles.navItemActive}>
              <SymbolView name="map.fill" size={22} tintColor="#1856D6" fallback={<MapFallback />} />
              <Text style={[styles.navText, styles.navTextActive]}>Map</Text>
            </View>
          </Link>

          <Link href="/my-reports" asChild>
            <View style={styles.navItem}>
              <SymbolView name="list.bullet" size={22} tintColor="#6B7280" fallback={<ListFallback />} />
              <Text style={styles.navText}>My reports</Text>
            </View>
          </Link>

          {/* Floating Action Button */}
          <Link href="/create-report" asChild>
            <View style={styles.fabContainer}>
              <View style={styles.fabButton}>
                <SymbolView name="plus" size={26} tintColor="#FFFFFF" fallback={<PlusFallback />} />
              </View>
            </View>
          </Link>

          <Link href="/updates" asChild>
            <View style={styles.navItem}>
              <SymbolView name="bell" size={22} tintColor="#6B7280" fallback={<BellNavFallback />} />
              <Text style={styles.navText}>Updates</Text>
            </View>
          </Link>

          <Link href="/profile" asChild>
            <View style={styles.navItem}>
              <SymbolView name="person" size={22} tintColor="#6B7280" fallback={<ProfileFallback />} />
              <Text style={styles.navText}>Profile</Text>
            </View>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* --- Fallback Icons (Android/Web) --- */
function SearchFallback() { return <Text style={{ fontSize: 14 }}>🔍</Text>; }
function BellFallback() { return <Text style={{ fontSize: 14 }}>🔔</Text>; }
function LightbulbFallback() { return <Text style={{ fontSize: 10, color: '#FFF' }}>💡</Text>; }
function DropFallback() { return <Text style={{ fontSize: 10, color: '#FFF' }}>💧</Text>; }
function PhotoFallback() { return <Text style={{ fontSize: 14 }}>📷</Text>; }
function MapFallback() { return <Text style={{ fontSize: 16 }}>🗺️</Text>; }
function ListFallback() { return <Text style={{ fontSize: 16 }}>📋</Text>; }
function PlusFallback() { return <Text style={{ fontSize: 20, color: '#FFF' }}>+</Text>; }
function BellNavFallback() { return <Text style={{ fontSize: 16 }}>🔔</Text>; }
function ProfileFallback() { return <Text style={{ fontSize: 16 }}>👤</Text>; }

/* --- Styles --- */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E8EDF4',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  mapBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#EAEFF5',
  },
  streetHorizontal1: {
    position: 'absolute',
    top: '22%',
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: '#FFFFFF',
  },
  streetHorizontal2: {
    position: 'absolute',
    top: '58%',
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: '#FFFFFF',
  },
  streetVertical1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '38%',
    width: 18,
    backgroundColor: '#FFFFFF',
  },
  streetVertical2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '82%',
    width: 18,
    backgroundColor: '#FFFFFF',
  },
  parkBlock1: {
    position: 'absolute',
    top: '12%',
    left: '4%',
    width: 90,
    height: 80,
    backgroundColor: '#DFE8DC',
    borderRadius: 8,
  },
  parkBlock2: {
    position: 'absolute',
    top: '38%',
    right: '6%',
    width: 80,
    height: 90,
    backgroundColor: '#DFE8DC',
    borderRadius: 8,
  },
  mapMarker: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  roadMarker: {
    backgroundColor: '#D93838',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  lightMarker: {
    backgroundColor: '#E58313',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  drainageMarker: {
    backgroundColor: '#1856D6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  userLocationPulse: {
    position: 'absolute',
    top: '52%',
    left: '42%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(24, 86, 214, 0.2)',
  },
  userLocationDot: {
    position: 'absolute',
    top: '53%',
    left: '43.2%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1856D6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  topOverlay: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    alignItems: 'center',
    zIndex: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchText: {
    color: '#71767E',
    fontSize: 15,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bellButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
    maxHeight: 54,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    height: 38,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E4E8EF',
  },
  filterChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 78,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 16,
    height: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomSheetExpanded: {
    height: 440,
  },
  handleContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  reportList: {
    gap: 10,
    paddingBottom: 20,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 12,
  },
  reportThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportDetails: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  reportMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusInProgress: {
    backgroundColor: '#FEF3C7',
  },
  textInProgress: {
    color: '#D97706',
  },
  statusVerified: {
    backgroundColor: '#DBEAFE',
  },
  textVerified: {
    color: '#1D4ED8',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 78,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navItemActive: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#1856D6',
    fontWeight: '700',
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1856D6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1856D6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});