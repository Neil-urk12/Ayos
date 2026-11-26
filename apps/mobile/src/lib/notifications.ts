import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { collections, db } from './firebase/firestore';

/**
 * Status-change notifications (FR-12). The phone's Firebase Cloud Messaging token is saved in
 * users/{uid}.fcmTokens; the notify_reporters Cloud Function (functions/main.py) sends to it
 * when LGU staff change a report's status or post an update. Each notification carries
 * data.reportId, and tapping it opens that report.
 *
 * Android only for now: on iOS, expo-notifications returns an APNs token, which FCM can't send
 * to without an APNs key in the Firebase project. Push also doesn't work in Expo Go; it needs a
 * development build (`npx expo run:android`).
 */

/** Must match ANDROID_CHANNEL in functions/notify.py. */
export const STATUS_CHANNEL = 'status-updates';

// Show the banner even when the app is open, so status changes aren't missed.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const userRef = (uid: string) => doc(db, collections.users, uid);

/**
 * Asks for permission and saves this phone's FCM token on the user's profile.
 * Returns the token, or null if notifications aren't available or were refused.
 */
export async function registerForPushNotifications(uid: string): Promise<string | null> {
  if (Platform.OS !== 'android' || !Device.isDevice) return null;

  await Notifications.setNotificationChannelAsync(STATUS_CHANNEL, {
    name: 'Report status updates',
    description: 'When the LGU changes the status of a report you filed or joined',
    importance: Notifications.AndroidImportance.HIGH,
  });

  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;

  try {
    const { data: token } = await Notifications.getDevicePushTokenAsync();
    if (typeof token !== 'string' || token.length === 0) return null;
    await updateDoc(userRef(uid), { fcmTokens: arrayUnion(token) });
    return token;
  } catch (error) {
    // Expo Go, no Google Play services, or google-services.json missing from the build.
    console.warn('[notifications] Could not get a push token:', error);
    return null;
  }
}

/** Stops notifications to this phone for this user. Call before signing out. */
export async function unregisterPushToken(uid: string, token: string) {
  await updateDoc(userRef(uid), { fcmTokens: arrayRemove(token) });
}

function openReport(response: Notifications.NotificationResponse | null | undefined) {
  const reportId = response?.notification.request.content.data?.reportId;
  if (typeof reportId === 'string' && reportId.length > 0) {
    router.push({ pathname: '/report/[id]', params: { id: reportId } });
  }
}

/**
 * Opens the report when a notification is tapped, including one that launched the app.
 * Mount once, inside the signed-in screens.
 */
export function useOpenReportFromNotification(enabled: boolean) {
  const last = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (enabled && last && last.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      openReport(last);
      // So the same tap doesn't reopen the report the next time this screen mounts.
      Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
    }
  }, [enabled, last]);
}
