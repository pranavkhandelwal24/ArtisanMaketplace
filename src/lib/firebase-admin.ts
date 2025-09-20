import admin from 'firebase-admin';

// This check prevents the app from being initialized multiple times.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: unknown) { // THE FIX: Changed 'any' to 'unknown' for type safety
    console.error('Firebase admin initialization error');
    // Add a check to safely access the stack property
    if (error instanceof Error) {
        console.error(error.stack);
    }
  }
}

export const db = admin.firestore();
export const authAdmin = admin.auth();

