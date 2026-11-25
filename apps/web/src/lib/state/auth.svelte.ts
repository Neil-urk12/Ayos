import { FirebaseError } from 'firebase/app';
import {
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signOut as firebaseSignOut,
	type User
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '#lib/firebase.ts';

const NOT_STAFF =
	'This account isn’t set up as LGU staff. Ask an administrator to grant staff access.';

const messages: Record<string, string> = {
	'auth/invalid-email': 'Enter a valid email address.',
	'auth/missing-password': 'Enter your password.',
	'auth/invalid-credential': 'Email or password is incorrect.',
	'auth/wrong-password': 'Email or password is incorrect.',
	'auth/user-not-found': 'Email or password is incorrect.',
	'auth/user-disabled': 'This account has been disabled.',
	'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
	'auth/network-request-failed': 'No internet connection. Check your connection and try again.'
};

export function authErrorMessage(error: unknown): string {
	if (error instanceof FirebaseError && messages[error.code]) return messages[error.code];
	if (error instanceof Error && error.message === NOT_STAFF) return NOT_STAFF;
	return 'Something went wrong. Please try again.';
}

/**
 * True for LGU staff: the `staff` custom claim (scripts/set-staff.mjs), or role 'staff' /
 * 'admin' on users/{uid} set in the Firebase console. Mirrors isStaff() in firestore.rules.
 */
async function hasStaffAccess(user: User, forceRefresh = false): Promise<boolean> {
	const token = await user.getIdTokenResult(forceRefresh).catch(() => null);
	if (token?.claims.staff === true) return true;
	const profile = await getDoc(doc(db, 'users', user.uid)).catch(() => null);
	const role = profile?.exists() ? profile.data().role : undefined;
	return role === 'staff' || role === 'admin';
}

/**
 * Staff session; see hasStaffAccess for who counts as staff.
 */
class StaffAuth {
	user = $state<User | null>(null);
	isStaff = $state(false);
	/** False until Firebase has restored (or ruled out) a saved session. */
	ready = $state(false);

	signedIn = $derived(this.user !== null && this.isStaff);
	displayName = $derived(this.user?.displayName || this.user?.email || 'Staff');

	#started = false;

	init() {
		if (this.#started) return;
		this.#started = true;
		onAuthStateChanged(auth, async (next) => {
			const staff = next ? await hasStaffAccess(next) : false;
			this.user = next;
			this.isStaff = staff;
			this.ready = true;
		});
	}

	async signIn(email: string, password: string) {
		const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
		// Force a refresh so a claim granted after the last sign-in is picked up.
		if (!(await hasStaffAccess(user, true))) {
			await firebaseSignOut(auth);
			throw new Error(NOT_STAFF);
		}
		this.isStaff = true;
	}

	signOut() {
		return firebaseSignOut(auth);
	}
}

export const staff = new StaffAuth();
