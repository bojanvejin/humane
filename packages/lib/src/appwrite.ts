import { Client, Account, Databases, Storage, Functions } from 'appwrite';

// Helper function to get environment variables with a check
function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}. Please check your .env.local file.`);
  }
  return value;
}

const client = new Client();

client
  .setEndpoint(getEnvVar('NEXT_PUBLIC_APPWRITE_ENDPOINT')) // Your Appwrite Endpoint
  .setProject(getEnvVar('NEXT_PUBLIC_APPWRITE_PROJECT_ID')); // Your project ID

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export const APPWRITE_DATABASE_ID = getEnvVar('NEXT_PUBLIC_APPWRITE_DATABASE_ID');
export const APPWRITE_TRACKS_COLLECTION_ID = getEnvVar('NEXT_PUBLIC_APPWRITE_TRACKS_COLLECTION_ID'); // New export

export default client;