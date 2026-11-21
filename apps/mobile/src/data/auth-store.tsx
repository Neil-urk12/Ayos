import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { auth } from '../lib/firebase';
import { createUserProfile, watchUserProfile, type UserProfile } from '../lib/firebase/users';

export type SignUpInput = {
  fullName: string;
  email: string;
  lgu: string;
  password: string;
};

type AuthContextValue = {
  user: User | null;
  /**
   * Use this for route guards. Stays false for the whole sign-up, which ends signed
   * out, so the create-account screen stays in control of where the user goes next.
   */
  signedIn: boolean;
  /** True when browsing as a guest (Firebase anonymous sign-in); guests have no profile. */
  isGuest: boolean;
  /** The users/{uid} Firestore document; null while loading or if it doesn't exist. */
  profile: UserProfile | null;
  /** True until Firebase has restored (or ruled out) a saved session. */
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const PROFILE_SAVE_TIMEOUT_MS = 15_000;

/** Rejects with a FirebaseError-like 'deadline-exceeded' code if `promise` takes too long. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new FirebaseError('deadline-exceeded', 'Saving the profile timed out.')),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Tagged with the uid it was loaded for, so a stale profile is never shown for another user.
  const [loadedProfile, setLoadedProfile] = useState<{
    uid: string;
    data: UserProfile | null;
  } | null>(null);
  const profile = user && loadedProfile?.uid === user.uid ? loadedProfile.data : null;
  const [initializing, setInitializing] = useState(true);
  const [signingUp, setSigningUp] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (next) => {
        setUser(next);
        setInitializing(false);
      }),
    [],
  );

  useEffect(() => {
    // Guests have no users/{uid} document, so there's nothing to watch.
    if (!user || user.isAnonymous) return;
    const uid = user.uid;
    return watchUserProfile(
      uid,
      (data) => setLoadedProfile({ uid, data }),
      (error) => console.warn('[auth] Could not load profile:', error.message),
    );
  }, [user]);

  const value: AuthContextValue = {
    user,
    signedIn: user !== null && !signingUp,
    isGuest: user?.isAnonymous ?? false,
    profile,
    initializing,
    signIn: async (email, password) => {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    },
    signInAsGuest: async () => {
      await signInAnonymously(auth);
    },
    signUp: async ({ fullName, email, lgu, password }) => {
      setSigningUp(true);
      try {
        const { user: created } = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        try {
          // setDoc only resolves once the server confirms the write. If the Firestore
          // database doesn't exist or the device is offline it never does, so give up
          // after a while and show an error instead of leaving the button spinning.
          await withTimeout(
            createUserProfile({
              uid: created.uid,
              fullName: fullName.trim(),
              email: created.email ?? email.trim(),
              lgu: lgu.trim(),
            }),
            PROFILE_SAVE_TIMEOUT_MS,
          );
          await updateProfile(created, { displayName: fullName.trim() });
        } catch (error) {
          // Don't leave an auth account without its users/{uid} document; let them retry.
          await deleteUser(created).catch(() => undefined);
          throw error;
        } finally {
          // Firebase signs new accounts in automatically. Sign out so the user lands on
          // the sign-in screen and logs in with the password they just chose.
          await firebaseSignOut(auth).catch(() => undefined);
        }
      } finally {
        setSigningUp(false);
      }
    },
    signOut: () => firebaseSignOut(auth),
    resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
