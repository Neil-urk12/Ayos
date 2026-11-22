import { FirebaseError } from 'firebase/app';

const messages: Record<string, string> = {
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/missing-email': 'Enter your email address.',
  'auth/missing-password': 'Enter your password.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/user-disabled': 'This account has been disabled. Contact your LGU for help.',
  'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
  'auth/weak-password': 'Use a password with at least 8 characters.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
  'auth/network-request-failed': 'No internet connection. Check your connection and try again.',
  'auth/operation-not-allowed':
    'Email sign-in is turned off for this app. Enable Email/Password in the Firebase console.',
  'auth/admin-restricted-operation':
    'Guest sign-in is turned off for this app. Enable Anonymous sign-in in the Firebase console.',
  'permission-denied': 'Your profile could not be saved. Please try again.',
  unavailable: 'No internet connection. Check your connection and try again.',
  'deadline-exceeded':
    'Couldn’t save your account. Check your connection and try again. If it keeps happening, the app’s database may not be set up yet.',
  'not-found': 'The app’s database isn’t set up yet. Please contact support.',
};

/** Turns a Firebase Auth/Firestore error into a sentence to show the user. */
export function authErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError && messages[error.code]) {
    return messages[error.code];
  }
  return 'Something went wrong. Please try again.';
}
