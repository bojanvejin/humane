import { Client, Databases, Storage, Functions, Users } from 'node-appwrite';

// Helper function to get environment variables with a check
function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable for Appwrite Function: ${name}.`);
  }
  return value;
}

const client = new Client();

client
    .setEndpoint(getEnvVar('APPWRITE_ENDPOINT')) // Your Appwrite Endpoint
    .setProject(getEnvVar('APPWRITE_PROJECT_ID')) // Your project ID
    .setKey(getEnvVar('APPWRITE_API_KEY')); // Your secret API key

export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export const users = new Users(client);

// Database and collection IDs for functions
export const APPWRITE_DATABASE_ID = getEnvVar('APPWRITE_DATABASE_ID');
export const PLAYS_RAW_COLLECTION_ID = getEnvVar('APPWRITE_PLAYS_RAW_COLLECTION_ID');
export const TRACKS_COLLECTION_ID = getEnvVar('APPWRITE_TRACKS_COLLECTION_ID');
export const PLAYS_COLLECTION_ID = getEnvVar('APPWRITE_PLAYS_COLLECTION_ID');
export const USER_TRACK_AGG_COLLECTION_ID = getEnvVar('APPWRITE_USER_TRACK_AGG_COLLECTION_ID');
export const USERS_COLLECTION_ID = getEnvVar('APPWRITE_USERS_COLLECTION_ID');
export const ARTISTS_COLLECTION_ID = getEnvVar('APPWRITE_ARTISTS_COLLECTION_ID');
export const SUBSCRIPTIONS_COLLECTION_ID = getEnvVar('APPWRITE_SUBSCRIPTIONS_COLLECTION_ID');
export const PAYOUTS_COLLECTION_ID = getEnvVar('APPWRITE_PAYOUTS_COLLECTION_ID');
export const TIPS_COLLECTION_ID = getEnvVar('APPWRITE_TIPS_COLLECTION_ID');