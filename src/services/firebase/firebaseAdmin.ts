import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let firebaseApp: App | null = null;
let firestoreDb: Firestore | null = null;

/**
 * Checks if Firebase service account or project credentials are provided in the environment.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) || Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
}

/**
 * Initializes Firebase Admin SDK server-side in a singleton pattern.
 * If credentials are not configured, returns null so the application seamlessly falls back to Local Demo Mode.
 */
export function getFirebaseAdminDb(): Firestore | null {
  if (firestoreDb) {
    return firestoreDb;
  }

  if (!isFirebaseConfigured()) {
    return null;
  }

  try {
    const apps = getApps();
    if (apps.length > 0) {
      firebaseApp = apps[0]!;
    } else {
      let credential;

      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
          credential = cert(serviceAccount);
        } catch {
          credential = undefined;
        }
      } else {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        credential = cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        });
      }

      firebaseApp = initializeApp({
        credential,
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }

    firestoreDb = getFirestore(firebaseApp);
    // Bounded settings
    firestoreDb.settings({ ignoreUndefinedProperties: true });
    return firestoreDb;
  } catch (err) {
    console.warn('Firebase Admin initialization notice (falling back to Local Demo Mode):', err);
    return null;
  }
}
