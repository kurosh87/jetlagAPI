import { auth, db } from '../config/firebase';
import { UserRecord } from 'firebase-admin/auth';

export class UserService {
  /**
   * Create a new user with email and password
   */
  public async createUser(email: string, password: string): Promise<UserRecord> {
    try {
      const userRecord = await auth.createUser({
        email,
        password,
        emailVerified: false
      });

      // Create user document in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        email: userRecord.email,
        createdAt: new Date(),
        preferences: {
          defaultTimezone: 'UTC',
          notificationsEnabled: true
        }
      });

      return userRecord;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  public async getUserById(uid: string): Promise<UserRecord> {
    try {
      return await auth.getUser(uid);
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  public async updateUserPreferences(
    uid: string,
    preferences: {
      defaultTimezone?: string;
      notificationsEnabled?: boolean;
    }
  ): Promise<void> {
    try {
      await db.collection('users').doc(uid).update({
        'preferences': preferences,
        'updatedAt': new Date()
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Save flight history for user
   */
  public async saveFlightHistory(uid: string, flightData: any): Promise<void> {
    try {
      const userFlightRef = db.collection('users').doc(uid)
        .collection('flightHistory');
      
      await userFlightRef.add({
        ...flightData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error saving flight history:', error);
      throw error;
    }
  }

  /**
   * Get user's flight history
   */
  public async getFlightHistory(uid: string): Promise<any[]> {
    try {
      const snapshot = await db.collection('users').doc(uid)
        .collection('flightHistory')
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching flight history:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   */
  public async deleteUser(uid: string): Promise<void> {
    try {
      // Delete user authentication
      await auth.deleteUser(uid);
      
      // Delete user data from Firestore
      const userRef = db.collection('users').doc(uid);
      const flightHistoryRef = userRef.collection('flightHistory');
      
      // Delete flight history
      const flightDocs = await flightHistoryRef.get();
      const batch = db.batch();
      flightDocs.forEach(doc => batch.delete(doc.ref));
      
      // Delete user document
      batch.delete(userRef);
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
} 