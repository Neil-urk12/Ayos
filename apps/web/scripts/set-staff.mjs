// Grants (or revokes) LGU staff access: sets the `staff` custom claim that
// firebase/firestore.rules checks in isStaff().
//
// Usage, from apps/web:
//   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json pnpm set-staff someone@lgu.gov.ph
//   GOOGLE_APPLICATION_CREDENTIALS=... pnpm set-staff someone@lgu.gov.ph --revoke
//
// Get the key from Firebase console > Project settings > Service accounts > Generate new
// private key. Keep it out of the repo. The person must sign out and back in afterwards.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const [email, flag] = process.argv.slice(2);
if (!email) {
	console.error('Usage: pnpm set-staff <email> [--revoke]');
	process.exit(1);
}

initializeApp({ credential: applicationDefault() });
const auth = getAuth();

const user = await auth.getUserByEmail(email);
const staff = flag !== '--revoke';
await auth.setCustomUserClaims(user.uid, { ...user.customClaims, staff });
console.log(`${staff ? 'Granted' : 'Revoked'} staff access for ${email} (${user.uid}).`);
