import React, { useState } from 'react';
import {
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

type TabType = 'open' | 'resolved';

export default function MyReportsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('open');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* --- Title & Tabs --- */}
          <Text style={styles.screenTitle}>My reports</Text>

          <View style={styles.tabsRow}>
            <Pressable
              style={styles.tabButton}
              onPress={() => setActiveTab('open')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'open' ? styles.tabTextActive : styles.tabTextInactive,
                ]}
              >
                Open (3)
              </Text>
              {activeTab === 'open' && <View style={styles.tabIndicator} />}
            </Pressable>

            <Pressable
              style={styles.tabButton}
              onPress={() => setActiveTab('resolved')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'resolved' ? styles.tabTextActive : styles.tabTextInactive,
                ]}
              >
                Resolved (4)
              </Text>
              {activeTab === 'resolved' && <View style={styles.tabIndicator} />}
            </Pressable>
          </View>

          {/* --- TAB CONTENT: OPEN --- */}
          {activeTab === 'open' && (
            <>
              {/* LGU Fixed Prompt Card */}
              <View style={styles.promptCard}>
                <View style={styles.promptHeader}>
                  <View style={styles.checkCircleBadge}>
                    <SymbolView name="checkmark" size={14} tintColor="#0A7C59" fallback={<CheckFallback />} />
                  </View>
                  <Text style={styles.promptTitle}>LGU marked this fixed. Is it?</Text>
                </View>
                <Text style={styles.promptMeta}>Dead streetlight · Escario St · fixed Nov 14</Text>

                <View style={styles.promptButtonsRow}>
                  <View style={styles.yesButton}>
                    <Text style={styles.yesButtonText}>Yes, fixed</Text>
                  </View>
                  <View style={styles.noButton}>
                    <Text style={styles.noButtonText}>Still broken</Text>
                  </View>
                </View>
              </View>

              {/* Report Item 1: In progress */}
              <View style={styles.reportCard}>
                <View style={styles.reportThumb}>
                  <SymbolView name="photo" size={20} tintColor="#71767E" fallback={<PhotoFallback />} />
                </View>
                <View style={styles.reportDetails}>
                  <Text style={styles.reportTitle} numberOfLines={1}>
                    Deep pothole, northbound lane
                  </Text>
                  <Text style={styles.reportMeta}>Gorordo Ave · Nov 15 · +5 others</Text>
                  <View style={[styles.statusBadge, styles.statusInProgress]}>
                    <Text style={[styles.statusText, styles.textInProgress]}>In progress</Text>
                  </View>
                </View>
                <SymbolView name="chevron.right" size={16} tintColor="#9CA3AF" fallback={<ChevronFallback />} />
              </View>

              {/* Report Item 2: Verified */}
              <View style={styles.reportCard}>
                <View style={styles.reportThumb}>
                  <SymbolView name="photo" size={20} tintColor="#71767E" fallback={<PhotoFallback />} />
                </View>
                <View style={styles.reportDetails}>
                  <Text style={styles.reportTitle} numberOfLines={1}>
                    Clogged canal inlet
                  </Text>
                  <Text style={styles.reportMeta}>Salinas Dr · Nov 12 · +2 others</Text>
                  <View style={[styles.statusBadge, styles.statusVerified]}>
                    <Text style={[styles.statusText, styles.textVerified]}>Verified</Text>
                  </View>
                </View>
                <SymbolView name="chevron.right" size={16} tintColor="#9CA3AF" fallback={<ChevronFallback />} />
              </View>

              {/* Report Item 3: Received */}
              <View style={styles.reportCard}>
                <View style={styles.reportThumb}>
                  <SymbolView name="photo" size={20} tintColor="#71767E" fallback={<PhotoFallback />} />
                </View>
                <View style={styles.reportDetails}>
                  <Text style={styles.reportTitle} numberOfLines={1}>
                    Broken sidewalk slab
                  </Text>
                  <Text style={styles.reportMeta}>Juan Luna Ave · Nov 10</Text>
                  <View style={[styles.statusBadge, styles.statusReceived]}>
                    <Text style={[styles.statusText, styles.textReceived]}>Received</Text>
                  </View>
                </View>
                <SymbolView name="chevron.right" size={16} tintColor="#9CA3AF" fallback={<ChevronFallback />} />
              </View>
            </>
          )}

          {/* --- TAB CONTENT: RESOLVED --- */}
          {activeTab === 'resolved' && (
            <>
              {/* Resolved Item 1 */}
              <View style={styles.reportCard}>
                <View style={styles.reportThumb}>
                  <SymbolView name="photo" size={20} tintColor="#71767E" fallback={<PhotoFallback />} />
                </View>
                <View style={styles.reportDetails}>
                  <Text style={styles.reportTitle} numberOfLines={1}>
                    Flickering street pole light
                  </Text>
                  <Text style={styles.reportMeta}>A. S. Fortuna St · Resolved Nov 8</Text>
                  <View style={[styles.statusBadge, styles.statusResolved]}>
                    <Text style={[styles.statusText, styles.textResolved]}>Fixed</Text>
                  </View>
                </View>
                <SymbolView name="chevron.right" size={16} tintColor="#9CA3AF" fallback={<ChevronFallback />} />
              </View>

              {/* Resolved Item 2 */}
              <View style={styles.reportCard}>
                <View style={styles.reportThumb}>
                  <SymbolView name="photo" size={20} tintColor="#71767E" fallback={<PhotoFallback />} />
                </View>
                <View style={styles.reportDetails}>
                  <Text style={styles.reportTitle} numberOfLines={1}>
                    Overflowing drainage grate
                  </Text>
                  <Text style={styles.reportMeta}>M. L. Quezon Hwy · Resolved Nov 3</Text>
                  <View style={[styles.statusBadge, styles.statusResolved]}>
                    <Text style={[styles.statusText, styles.textResolved]}>Fixed</Text>
                  </View>
                </View>
                <SymbolView name="chevron.right" size={16} tintColor="#9CA3AF" fallback={<ChevronFallback />} />
              </View>

              {/* Resolved Item 3 */}
              <View style={styles.reportCard}>
                <View style={styles.reportThumb}>
                  <SymbolView name="photo" size={20} tintColor="#71767E" fallback={<PhotoFallback />} />
                </View>
                <View style={styles.reportDetails}>
                  <Text style={styles.reportTitle} numberOfLines={1}>
                    Large asphalt crater
                  </Text>
                  <Text style={styles.reportMeta}>P. Burgos St · Resolved Oct 29</Text>
                  <View style={[styles.statusBadge, styles.statusResolved]}>
                    <Text style={[styles.statusText, styles.textResolved]}>Fixed</Text>
                  </View>
                </View>
                <SymbolView name="chevron.right" size={16} tintColor="#9CA3AF" fallback={<ChevronFallback />} />
              </View>

              {/* Resolved Item 4 */}
              <View style={styles.reportCard}>
                <View style={styles.reportThumb}>
                  <SymbolView name="photo" size={20} tintColor="#71767E" fallback={<PhotoFallback />} />
                </View>
                <View style={styles.reportDetails}>
                  <Text style={styles.reportTitle} numberOfLines={1}>
                    Uncovered manhole cover
                  </Text>
                  <Text style={styles.reportMeta}>Opon Mercado · Resolved Oct 22</Text>
                  <View style={[styles.statusBadge, styles.statusResolved]}>
                    <Text style={[styles.statusText, styles.textResolved]}>Fixed</Text>
                  </View>
                </View>
                <SymbolView name="chevron.right" size={16} tintColor="#9CA3AF" fallback={<ChevronFallback />} />
              </View>
            </>
          )}
        </ScrollView>

        {/* --- Bottom Navigation Bar --- */}
        <View style={styles.bottomNav}>
          <Link href="/map" asChild>
            <View style={styles.navItem}>
              <SymbolView name="map" size={22} tintColor="#6B7280" fallback={<MapFallback />} />
              <Text style={styles.navText}>Map</Text>
            </View>
          </Link>

          <Link href="/my-reports" asChild>
            <View style={styles.navItemActive}>
              <SymbolView name="list.bullet" size={22} tintColor="#1856D6" fallback={<ListFallback />} />
              <Text style={[styles.navText, styles.navTextActive]}>My reports</Text>
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
function CheckFallback() { return <Text style={{ fontSize: 12, color: '#0A7C59' }}>✓</Text>; }
function PhotoFallback() { return <Text style={{ fontSize: 16 }}>📷</Text>; }
function ChevronFallback() { return <Text style={{ fontSize: 14, color: '#9CA3AF' }}>›</Text>; }
function MapFallback() { return <Text style={{ fontSize: 16 }}>🗺️</Text>; }
function ListFallback() { return <Text style={{ fontSize: 16 }}>📋</Text>; }
function PlusFallback() { return <Text style={{ fontSize: 20, color: '#FFF' }}>+</Text>; }
function BellNavFallback() { return <Text style={{ fontSize: 16 }}>🔔</Text>; }
function ProfileFallback() { return <Text style={{ fontSize: 16 }}>👤</Text>; }

/* --- Styles --- */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 96,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 20,
  },
  tabButton: {
    paddingBottom: 10,
    marginRight: 24,
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  tabTextInactive: {
    color: '#9CA3AF',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#1856D6',
    borderRadius: 1.5,
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E8EF',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  checkCircleBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E1F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  promptMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 14,
    marginLeft: 30,
  },
  promptButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  yesButton: {
    flex: 1,
    backgroundColor: '#0A7C59',
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yesButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  noButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4DAE3',
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noButtonText: {
    color: '#111827',
    fontSize: 14.5,
    fontWeight: '700',
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E8EF',
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  reportThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportDetails: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  reportMeta: {
    fontSize: 12.5,
    color: '#6B7280',
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusInProgress: {
    backgroundColor: '#FEF3C7',
  },
  statusVerified: {
    backgroundColor: '#DBEAFE',
  },
  statusReceived: {
    backgroundColor: '#F3F4F6',
  },
  statusResolved: {
    backgroundColor: '#E1F5EE',
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  textInProgress: {
    color: '#D97706',
  },
  textVerified: {
    color: '#1D4ED8',
  },
  textReceived: {
    color: '#4B5563',
  },
  textResolved: {
    color: '#0A7C59',
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