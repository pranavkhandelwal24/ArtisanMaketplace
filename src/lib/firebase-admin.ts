import admin from 'firebase-admin';

// This check prevents the app from being initialized multiple times,
// which is a common issue during development with hot-reloading.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key from the .env.local file often has its newline
        // characters stored as "\\n". We need to replace them with actual
        // newlines ("\n") for the SDK to parse it correctly.
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

// Export the initialized admin Firestore and Auth instances for use in Server Components
export const db = admin.firestore();
export const authAdmin = admin.auth();

