# Firebase Setup Guide

## Prerequisites

- Node.js installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project created in the [Firebase Console](https://console.firebase.google.com)

## Initial Setup

1. Login to Firebase:
```bash
firebase login
```

2. Initialize Firebase in your project:
```bash
firebase init
```

Select the following features:
- Firestore
- Storage
- Emulators (Auth, Firestore, Storage)

## Configuration Files

### Firebase Config (`src/config/firebase.ts`)
```typescript
import * as admin from 'firebase-admin';
import serviceAccount from '../../tripbase-13c00-firebase-adminsdk-swm4l-381c83d3c2.json';

const isEmulator = process.env.FIREBASE_EMULATOR === 'true';

export const initializeFirebase = () => {
  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebasedatabase.app`,
        storageBucket: 'tripbase-13c00.firebasestorage.app'
      });

      if (isEmulator) {
        // Emulator configuration
        const auth = admin.auth();
        const firestore = admin.firestore();
        const storage = admin.storage();

        auth.useEmulator('http://localhost:9099');
        firestore.useEmulator('localhost', 8080);
        storage.useEmulator('localhost', 9199);
      }
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
};
```

### Security Rules

#### Firestore Rules (`firestore.rules`)
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // User profile rules
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
      
      // Flight history subcollection rules
      match /flightHistory/{flightId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Default deny all
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

#### Storage Rules (`storage.rules`)
```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // User profile images
    match /users/{userId}/profile/{allImages=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Flight attachments
    match /users/{userId}/flights/{flightId}/{allFiles=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Default deny all
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Data Structure

### Firestore Collections

#### Users Collection
```typescript
interface User {
  email: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  preferences: {
    defaultTimezone: string;
    notificationsEnabled: boolean;
  };
}
```

#### Flight History Subcollection
```typescript
interface FlightHistory {
  flightId: string;
  timestamp: Timestamp;
  origin: Airport;
  destination: Airport;
  departureTime: Timestamp;
  arrivalTime: Timestamp;
  jetlagSeverity: number;
  schedule: ActivitySchedule;
}
```

## Local Development

1. Start the emulators:
```bash
npm run dev:emulator
```

2. Access the Emulator UI:
- URL: http://localhost:4000
- Features:
  - Auth Emulator: http://localhost:9099
  - Firestore Emulator: http://localhost:8080
  - Storage Emulator: http://localhost:9199

## Deployment

1. Deploy Firebase configuration:
```bash
npm run deploy
```

2. Deploy only security rules:
```bash
npm run deploy:rules
```

## Environment Variables

Required environment variables for Firebase:
```bash
FIREBASE_PROJECT_ID=tripbase-13c00
FIREBASE_STORAGE_BUCKET=tripbase-13c00.firebasestorage.app
FIREBASE_EMULATOR=true # Set to false in production
```

## Common Issues

1. **Emulator Connection Issues**
   - Ensure emulators are running
   - Check port conflicts
   - Verify environment variables

2. **Authentication Errors**
   - Verify service account credentials
   - Check Firebase project settings
   - Ensure proper initialization

3. **Deployment Failures**
   - Check Firebase CLI login status
   - Verify project permissions
   - Validate security rules syntax

## Best Practices

1. **Security**
   - Always use authentication
   - Follow principle of least privilege
   - Validate data on server-side

2. **Performance**
   - Use appropriate indexes
   - Implement caching
   - Optimize queries

3. **Development**
   - Use emulators for local development
   - Test security rules
   - Keep dependencies updated 