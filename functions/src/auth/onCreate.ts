import * as admin from 'firebase-admin';
import { onUserCreated } from 'firebase-functions/v2/auth';
import { db, FieldValue } from '../firebaseAdmin';
import { User } from '../types';

export const createUserProfile = onUserCreated(async (event) => {
  const user = event.data;

  if (!user.email) {
    console.error(`User ${user.uid} created without an email. Skipping profile creation.`);
    return null;
  }

  const userRef = db.collection('users').doc(user.uid);

  // Check if user document already exists to prevent overwriting in case of retries
  const userDoc = await userRef.get();
  if (userDoc.exists) {
    console.log(`User document for ${user.uid} already exists. Skipping creation.`);
    return null;
  }

  const newUser: User = {
    id: user.uid,
    email: user.email,
    displayName: user.displayName || user.email.split('@')[0],
    photoURL: user.photoURL || undefined,
    role: 'fan', // Default role for new users
    createdAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    updatedAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
  };

  try {
    await userRef.set(newUser);
    console.log(`User profile created for ${user.email} with ID: ${user.uid}`);

    // Set custom claims for the user's role
    await admin.auth().setCustomUserClaims(user.uid, {
      roles: {
        fan: true,
      },
    });
    console.log(`Custom claims set for user ${user.uid}: { roles: { fan: true } }`);

    return null;
  } catch (error) {
    console.error(`Error creating user profile or setting custom claims for ${user.uid}:`, error);
    return null;
  }
});