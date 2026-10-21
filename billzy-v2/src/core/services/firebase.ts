import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  Firestore,
  Unsubscribe,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { PaymentRecord } from '../contracts/payment';
import { storageAdapter } from '../storage/local-adapter';

export const firebaseConfig = {
  apiKey: 'AIzaSyBtTPdQ0jy_T8XcuaqyccLQTqLs5ZyzKmQ',
  authDomain: 'billzy-dash.firebaseapp.com',
  projectId: 'billzy-dash',
  storageBucket: 'billzy-dash.firebasestorage.app',
  messagingSenderId: '985712059255',
  appId: '1:985712059255:web:b5f9d117b34a2ed8c07772'
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch(err => {
      // Failed-precondition usually means multiple tabs open
      if (err.code === 'failed-precondition') {
        console.warn('Firestore multi-tab persistence: using fallback tab sync');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not supported by browser');
      } else {
        console.warn('Firestore offline persistence warning:', err);
      }
    });
  }
} catch (e) {
  console.warn('Firebase initialization notice:', e);
}

export { app, auth, db };

export async function signInWithGoogle(): Promise<User> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function logoutFirebase(): Promise<void> {
  if (!auth) return;
  await firebaseSignOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export function subscribeToPayments(
  userId: string,
  onUpdate: (payments: PaymentRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    if (onError) onError(new Error('Firestore is not initialized'));
    return () => {};
  }

  const paymentsCol = collection(db, 'users', userId, 'payments');
  const q = query(paymentsCol, orderBy('payDate', 'desc'));

  return onSnapshot(
    q,
    snapshot => {
      const records: PaymentRecord[] = [];
      snapshot.forEach(docSnap => {
        records.push(docSnap.data() as PaymentRecord);
      });

      // Update offline cache for fast subsequent boots
      if (records.length > 0) {
        storageAdapter.setPaymentsCache(records);
      }
      onUpdate(records);
    },
    error => {
      console.warn('Firestore subscription error (operating in offline cache mode):', error);
      if (onError) onError(error);
    }
  );
}

export async function savePaymentToCloud(userId: string, record: PaymentRecord): Promise<void> {
  if (!db) return;
  const paymentDoc = doc(db, 'users', userId, 'payments', record.uid);
  await setDoc(paymentDoc, record, { merge: true });

  const userDoc = doc(db, 'users', userId);
  await setDoc(
    userDoc,
    {
      lastActiveAt: new Date().toISOString()
    },
    { merge: true }
  ).catch(() => {});
}

export async function updatePaymentInCloud(userId: string, record: PaymentRecord): Promise<void> {
  if (!db) return;
  const paymentDoc = doc(db, 'users', userId, 'payments', record.uid);
  await updateDoc(paymentDoc, { ...record } as Record<string, unknown>);
}

export async function deletePaymentFromCloud(userId: string, uid: string): Promise<void> {
  if (!db) return;
  const paymentDoc = doc(db, 'users', userId, 'payments', uid);
  await deleteDoc(paymentDoc);
}

export async function updateUserCloudProfile(
  userId: string,
  data: {
    gymPaused?: boolean;
    displayName?: string;
    email?: string;
    photoURL?: string;
  }
): Promise<void> {
  if (!db) return;
  const userDoc = doc(db, 'users', userId);
  await setDoc(
    userDoc,
    {
      ...data,
      lastActiveAt: new Date().toISOString()
    },
    { merge: true }
  ).catch(err => {
    console.warn('Failed to sync user metadata to Firestore:', err);
  });
}
