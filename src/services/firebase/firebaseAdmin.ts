import * as admin from 'firebase-admin';

let firebaseApp: any = null;
let firestoreDb: any = null;

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
export function getFirebaseAdminDb(): admin.firestore.Firestore | null {
  if (firestoreDb) {
    return firestoreDb;
  }

  if (!isFirebaseConfigured()) {
    return null;
  }

  try {
    if (admin.apps.length > 0) {
      firebaseApp = admin.apps[0]!;
    } else {
      let credential: admin.credential.Credential;

      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
          credential = admin.credential.cert(serviceAccount);
        } catch {
          credential = admin.credential.applicationDefault();
        }
      } else {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        credential = admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        });
      }

      firebaseApp = admin.initializeApp({
        credential,
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }

    firestoreDb = firebaseApp.firestore();
    // Bounded settings
    firestoreDb.settings({ ignoreUndefinedProperties: true });
    return firestoreDb;
  } catch (err) {
    console.warn('Firebase Admin initialization notice (falling back to Local Demo Mode):', err);
    return null;
  }
}
