import * as admin from 'firebase-admin';
import serviceAccount from '../../tripbase-13c00-firebase-adminsdk-swm4l-381c83d3c2.json';

export const initializeFirebase = (): void => {
  try {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: 'tripbase-13c00',
        storageBucket: 'tripbase-13c00.appspot.com'
      });
      console.log('Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
};

export const getFirestore = (): admin.firestore.Firestore => {
  return admin.firestore();
};

export const getAuth = (): admin.auth.Auth => {
  return admin.auth();
}; 