import { Databases, ID, Permission, Role } from 'node-appwrite';
import { APPWRITE_DATABASE_ID, USERS_COLLECTION_ID, databases } from '../appwrite';
import { UserDocument } from '../types';

// This function will be triggered by an Appwrite User creation event.
// Event: users.*.create
export default async ({ req, res }: { req: any, res: any }) => {
  const payload = JSON.parse(req.body);
  const newUser = payload as {
    $id: string;
    email: string;
    name: string; // Appwrite user object has 'name' for display name
    registration: string; // ISO string for creation time
  };

  if (!newUser || !newUser.$id) {
    console.error('No user data found in payload.');
    return res.json({ error: 'No user data provided.' }, 400);
  }

  try {
    const userDocument: Omit<UserDocument, '$id' | '$collectionId' | '$databaseId' | '$createdAt' | '$updatedAt' | '$permissions'> = {
      email: newUser.email,
      displayName: newUser.name,
      photoURL: undefined, // Appwrite doesn't provide photoURL directly on account creation
      role: 'fan', // Default role for new users
      createdAt: newUser.registration,
      updatedAt: new Date().toISOString(),
    };

    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      USERS_COLLECTION_ID,
      newUser.$id, // Use the Appwrite user ID as the document ID
      userDocument,
      [
        Permission.read(Role.user(newUser.$id)),
        Permission.write(Role.user(newUser.$id)),
      ]
    );

    console.log(`User profile created for ${newUser.email} (ID: ${newUser.$id}).`);
    return res.json({ status: 'ok', message: `User profile created for ${newUser.$id}.` }, 200);

  } catch (error: any) {
    console.error(`Error creating user profile for ${newUser.$id}:`, error);
    return res.json({ error: 'Internal Server Error', detail: error.message }, 500);
  }
};