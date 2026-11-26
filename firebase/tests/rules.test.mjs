// Security rules tests for firebase/firestore.rules and firebase/storage.rules.
// Run from the repo root with `pnpm test:rules`, which starts the Firestore and Storage
// emulators, runs this file, and shuts them down again.

import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';

const PROJECT_ID = 'demo-ayos';
const rulesFile = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

/** @type {import('@firebase/rules-unit-testing').RulesTestEnvironment} */
let env;

// Seeded reports. AY-ALICE1 belongs to alice; AY-GROUP1 is an older group by carol that
// AY-ALICE1 can be merged into; AY-FIXED1 is alice's report that staff marked resolved.
const ALICE_REPORT = 'AY-ALICE1';
const GROUP_REPORT = 'AY-GROUP1';
const FIXED_REPORT = 'AY-FIXED1';

function baseReport(reporterId, overrides = {}) {
  return {
    reporterId,
    title: 'Pothole',
    category: 'road',
    street: 'Rizal St',
    area: 'Poblacion',
    reportCount: 1,
    status: 'received',
    reportedOn: 'Nov 26',
    receivedAt: '9:00 AM',
    danger: false,
    description: 'Big pothole near the school',
    photoTone: 'warm',
    map: { x: 0.4, y: 0.6 },
    accuracy: 12,
    createdAt: new Date('2026-11-20T09:00:00Z'),
    ...overrides,
  };
}

/** Fields a resident sends when filing a report (submitNew in reports-store.tsx). */
function newReportFields(reporterId) {
  const { createdAt: _ignored, ...rest } = baseReport(reporterId);
  return { ...rest, createdAt: serverTimestamp() };
}

// Auth contexts. sign_in_provider is what Firebase Auth puts in every ID token.
const guest = () =>
  env.authenticatedContext('guest', { firebase: { sign_in_provider: 'anonymous' } });
const resident = (uid) =>
  env.authenticatedContext(uid, {
    email: `${uid}@example.com`,
    email_verified: false,
    firebase: { sign_in_provider: 'password' },
  });
// Staff via the custom claim set by apps/web/scripts/set-staff.mjs.
const claimStaff = () =>
  env.authenticatedContext('staff-claim', {
    email: 'staff-claim@example.com',
    staff: true,
    firebase: { sign_in_provider: 'password' },
  });
// Staff via role: 'staff' on users/{uid}.
const roleStaff = () =>
  env.authenticatedContext('staff-role', {
    email: 'staff-role@example.com',
    firebase: { sign_in_provider: 'password' },
  });

/** Creates a report and its reporter's supporters doc in one batch, like createReport(). */
function fileReport(db, id, uid) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'reports', id), newReportFields(uid));
  batch.set(doc(db, 'reports', id, 'supporters', uid), { uid, joinedAt: serverTimestamp() });
  return batch.commit();
}

/** Adds uid to a report, like joinReport(). */
function joinReport(db, id, uid) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'reports', id), { reportCount: increment(1) });
  batch.set(doc(db, 'reports', id, 'supporters', uid), { uid, joinedAt: serverTimestamp() });
  return batch.commit();
}

/** The merge transaction from apps/web/src/lib/state/duplicates.svelte.ts, trimmed down. */
function mergeReport(db, reportId, groupId, reviewerUid) {
  return runTransaction(db, async (tx) => {
    const fresh = (await tx.get(doc(db, 'reports', reportId))).data();
    const lead = (await tx.get(doc(db, 'reports', groupId))).data();
    tx.update(doc(db, 'reports', reportId), {
      mergedInto: groupId,
      mergeScore: '0.91',
      mergedBy: 'Test Staff',
      mergedAt: serverTimestamp(),
      status: lead.status,
      preMerge: { status: fresh.status, statusNote: null, verifiedAt: null, assignedTo: null },
    });
    tx.update(doc(db, 'reports', groupId), { reportCount: increment(fresh.reportCount) });
    tx.set(doc(db, 'duplicateSuggestions', `${reportId}_${groupId}`), {
      reportId,
      candidateGroupId: groupId,
      imageSimilarity: 0.9,
      distanceM: 10,
      timeGapDays: 1,
      combinedScore: 0.91,
      decision: 'confirmed',
      reviewedBy: reviewerUid,
      reviewedAt: serverTimestamp(),
    });
  });
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: rulesFile('firestore.rules') },
    storage: { rules: rulesFile('storage.rules') },
  });
});

after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', 'staff-role'), {
      uid: 'staff-role',
      fullName: 'Role Staff',
      email: 'staff-role@example.com',
      lgu: 'Test LGU',
      role: 'staff',
    });
    await setDoc(doc(db, 'users', 'alice'), {
      uid: 'alice',
      fullName: 'Alice',
      email: 'alice@example.com',
      lgu: 'Test LGU',
      role: 'resident',
    });
    await setDoc(doc(db, 'reports', ALICE_REPORT), baseReport('alice'));
    await setDoc(doc(db, 'reports', ALICE_REPORT, 'supporters', 'alice'), { uid: 'alice' });
    await setDoc(doc(db, 'reports', GROUP_REPORT), baseReport('carol', { status: 'verified' }));
    await setDoc(doc(db, 'reports', GROUP_REPORT, 'supporters', 'carol'), { uid: 'carol' });
    await setDoc(
      doc(db, 'reports', FIXED_REPORT),
      baseReport('alice', { status: 'resolved', awaitingConfirmation: true, resolvedOn: 'Nov 25' }),
    );
    await setDoc(doc(db, 'reports', FIXED_REPORT, 'supporters', 'alice'), { uid: 'alice' });
    await setDoc(doc(db, 'tips', 'tip-1'), { title: 'Slow down near schools', body: '...' });
  });
});

describe('guests', () => {
  it('can browse the report list and map', async () => {
    await assertSucceeds(getDocs(collection(guest().firestore(), 'reports')));
  });

  it('can open a single report', async () => {
    await assertSucceeds(getDoc(doc(guest().firestore(), 'reports', ALICE_REPORT)));
  });

  it('can read safety tips', async () => {
    await assertSucceeds(getDocs(collection(guest().firestore(), 'tips')));
  });

  it('cannot create a report', async () => {
    await assertFails(fileReport(guest().firestore(), 'AY-GUEST1', 'guest'));
  });

  it('cannot create a report without the supporters doc either', async () => {
    await assertFails(
      setDoc(doc(guest().firestore(), 'reports', 'AY-GUEST2'), newReportFields('guest')),
    );
  });

  it('cannot join an existing report', async () => {
    await assertFails(joinReport(guest().firestore(), ALICE_REPORT, 'guest'));
  });

  it('cannot upload a report photo', async () => {
    const photo = ref(guest().storage(), 'users/guest/reports/AY-GUEST1/photo.jpg');
    await assertFails(uploadBytes(photo, new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' }));
  });

  it('signed-out visitors cannot read reports at all', async () => {
    await assertFails(getDocs(collection(env.unauthenticatedContext().firestore(), 'reports')));
  });
});

describe('signed-up residents', () => {
  it('can create their own profile at sign-up, only as a resident', async () => {
    const db = resident('bob').firestore();
    const profile = {
      uid: 'bob',
      fullName: 'Bob',
      email: 'bob@example.com',
      lgu: 'Test LGU',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await assertFails(setDoc(doc(db, 'users', 'bob'), { ...profile, role: 'staff' }));
    await assertSucceeds(setDoc(doc(db, 'users', 'bob'), { ...profile, role: 'resident' }));
  });

  it('cannot promote themselves to staff', async () => {
    await assertFails(
      updateDoc(doc(resident('alice').firestore(), 'users', 'alice'), { role: 'staff' }),
    );
  });

  it("cannot read another user's profile", async () => {
    await assertFails(getDoc(doc(resident('bob').firestore(), 'users', 'alice')));
  });

  it('can create a report', async () => {
    await assertSucceeds(fileReport(resident('bob').firestore(), 'AY-BOB001', 'bob'));
  });

  it('cannot create a report in someone else’s name', async () => {
    const db = resident('bob').firestore();
    const batch = writeBatch(db);
    batch.set(doc(db, 'reports', 'AY-FAKE01'), newReportFields('alice'));
    batch.set(doc(db, 'reports', 'AY-FAKE01', 'supporters', 'bob'), {
      uid: 'bob',
      joinedAt: serverTimestamp(),
    });
    await assertFails(batch.commit());
  });

  it('can edit the description of their own report', async () => {
    await assertSucceeds(
      updateDoc(doc(resident('alice').firestore(), 'reports', ALICE_REPORT), {
        description: 'Now two potholes',
        danger: true,
      }),
    );
  });

  it("cannot edit another user's report", async () => {
    const db = resident('bob').firestore();
    const report = doc(db, 'reports', ALICE_REPORT);
    await assertFails(updateDoc(report, { description: 'Not a pothole' }));
    await assertFails(updateDoc(report, { danger: true }));
    await assertFails(updateDoc(report, { title: 'Changed' }));
    await assertFails(updateDoc(report, { reporterId: 'bob' }));
  });

  it("cannot delete another user's report", async () => {
    await assertFails(deleteDoc(doc(resident('bob').firestore(), 'reports', ALICE_REPORT)));
  });

  it('can join another user’s report once, adding exactly one', async () => {
    const db = resident('bob').firestore();
    await assertSucceeds(joinReport(db, ALICE_REPORT, 'bob'));
    await assertFails(joinReport(db, ALICE_REPORT, 'bob'));
  });

  it('cannot inflate the report count', async () => {
    await assertFails(
      updateDoc(doc(resident('bob').firestore(), 'reports', ALICE_REPORT), {
        reportCount: increment(1),
      }),
    );
  });
});

describe('status changes', () => {
  for (const status of ['verified', 'in_progress', 'resolved']) {
    it(`a resident cannot set their own report to ${status}`, async () => {
      await assertFails(
        updateDoc(doc(resident('alice').firestore(), 'reports', ALICE_REPORT), { status }),
      );
    });
  }

  it("a resident cannot change another user's report status", async () => {
    await assertFails(
      updateDoc(doc(resident('bob').firestore(), 'reports', GROUP_REPORT), { status: 'resolved' }),
    );
  });

  it('a guest cannot change a status', async () => {
    await assertFails(
      updateDoc(doc(guest().firestore(), 'reports', ALICE_REPORT), { status: 'verified' }),
    );
  });

  it('a resident cannot write staff fields (note, assignment)', async () => {
    const report = doc(resident('alice').firestore(), 'reports', ALICE_REPORT);
    await assertFails(updateDoc(report, { statusNote: 'Fixed!' }));
    await assertFails(updateDoc(report, { assignedTo: 'alice' }));
  });

  it('staff with the custom claim can change a status', async () => {
    await assertSucceeds(
      updateDoc(doc(claimStaff().firestore(), 'reports', ALICE_REPORT), {
        status: 'verified',
        statusNote: 'Inspected on site',
      }),
    );
  });

  it('staff with role "staff" on their profile can change a status', async () => {
    await assertSucceeds(
      updateDoc(doc(roleStaff().firestore(), 'reports', ALICE_REPORT), { status: 'in_progress' }),
    );
  });

  it('a reporter can only reopen a resolved report with the fixed note', async () => {
    // The one resident status write the app makes: "Is it fixed?" → "No" (answerFix).
    const report = doc(resident('alice').firestore(), 'reports', FIXED_REPORT);
    await assertFails(
      updateDoc(report, {
        awaitingConfirmation: false,
        status: 'in_progress',
        statusNote: 'Staff did nothing',
        resolvedOn: deleteField(),
      }),
    );
    await assertFails(
      updateDoc(report, {
        awaitingConfirmation: false,
        status: 'received',
        resolvedOn: deleteField(),
      }),
    );
    await assertSucceeds(
      updateDoc(report, {
        awaitingConfirmation: false,
        status: 'in_progress',
        statusNote: 'Reopened after you said it is still broken',
        resolvedOn: deleteField(),
      }),
    );
  });

  it('a non-supporter cannot reopen a resolved report', async () => {
    await assertFails(
      updateDoc(doc(resident('bob').firestore(), 'reports', FIXED_REPORT), {
        awaitingConfirmation: false,
        status: 'in_progress',
        statusNote: 'Reopened after you said it is still broken',
        resolvedOn: deleteField(),
      }),
    );
  });
});

describe('merging duplicates', () => {
  it('a resident cannot merge reports', async () => {
    await assertFails(
      mergeReport(resident('alice').firestore(), ALICE_REPORT, GROUP_REPORT, 'alice'),
    );
  });

  it('a resident cannot set mergedInto on their own report', async () => {
    await assertFails(
      updateDoc(doc(resident('alice').firestore(), 'reports', ALICE_REPORT), {
        mergedInto: GROUP_REPORT,
      }),
    );
  });

  it('a resident cannot mark reports as duplicates of each other', async () => {
    const db = resident('alice').firestore();
    await assertFails(
      updateDoc(doc(db, 'reports', ALICE_REPORT), { notDuplicateOf: arrayUnion(GROUP_REPORT) }),
    );
    await assertFails(updateDoc(doc(db, 'reports', ALICE_REPORT), { recurrenceOf: GROUP_REPORT }));
  });

  it('a resident cannot record a duplicate decision', async () => {
    await assertFails(
      setDoc(doc(resident('alice').firestore(), 'duplicateSuggestions', 'x_y'), {
        decision: 'confirmed',
        reviewedBy: 'alice',
        reviewedAt: serverTimestamp(),
      }),
    );
  });

  it('a guest cannot merge reports', async () => {
    await assertFails(mergeReport(guest().firestore(), ALICE_REPORT, GROUP_REPORT, 'guest'));
  });

  it('staff can merge reports', async () => {
    await assertSucceeds(
      mergeReport(claimStaff().firestore(), ALICE_REPORT, GROUP_REPORT, 'staff-claim'),
    );
  });

  it('role-based staff can merge reports', async () => {
    await assertSucceeds(
      mergeReport(roleStaff().firestore(), ALICE_REPORT, GROUP_REPORT, 'staff-role'),
    );
  });
});

describe('storage', () => {
  it('a resident can upload a photo to their own folder', async () => {
    const photo = ref(resident('bob').storage(), 'users/bob/reports/AY-BOB001/photo.jpg');
    await assertSucceeds(
      uploadBytes(photo, new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' }),
    );
  });

  it("a resident cannot upload into another user's folder", async () => {
    const photo = ref(resident('bob').storage(), 'users/alice/reports/AY-ALICE1/photo.jpg');
    await assertFails(uploadBytes(photo, new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' }));
  });
});
