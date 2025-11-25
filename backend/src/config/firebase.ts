/**
 * Firebase Admin SDK initialization
 */

import admin from 'firebase-admin';
import { config, validateConfig } from './environment.js';
import { logger } from './logger.js';

let firebaseApp: admin.app.App | null = null;
let firestoreDb: admin.firestore.Firestore | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export async function initializeFirebase(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();

    // Check if already initialized
    if (firebaseApp) {
      logger.warn('Firebase Admin SDK already initialized');
      return;
    }

    // Initialize Firebase Admin
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
      databaseURL: config.firebase.databaseURL,
    });

    // Get Firestore instance
    firestoreDb = admin.firestore();

    // Set Firestore settings
    firestoreDb.settings({
      ignoreUndefinedProperties: true,
    });

    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

/**
 * Get Firestore database instance
 */
export function getFirestore(): admin.firestore.Firestore {
  if (!firestoreDb) {
    throw new Error('Firestore not initialized. Call initializeFirebase() first.');
  }
  return firestoreDb;
}

/**
 * Get Firebase Auth instance
 */
export function getAuth(): admin.auth.Auth {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return admin.auth();
}

/**
 * Get Firebase Storage instance
 */
export function getStorage(): admin.storage.Storage {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return admin.storage();
}

// Export admin for direct access if needed
export { admin };
