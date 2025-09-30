import { Models } from 'node-appwrite';

export type FraudReason = 
  'insufficient_listen_duration' | 
  'bot_user_agent' | 
  'local_ip_address' | 
  'duplicate_play_within_window' |
  'track_not_found' |
  'new_user_burst' |
  'device_multiple_accounts' |
  'ip_cluster';

export interface PlayEventPayload {
  eventId: string;
  trackId: string;
  sessionId: string;
  duration: number; // ms played
  trackFullDurationMs: number; // full duration of the track in ms
  completed: boolean;
  deviceInfo: {
    userAgent: string;
    country?: string;
  };
  timestamp: string; // ISO string
}

// Represents a raw play event stored in Appwrite
export interface RawPlayDocument extends PlayEventPayload, Models.Document {
  userId: string;
  ipAddressHash: string;
  suspicious: boolean;
  fraudReasons?: FraudReason[];
  fraudScore: number;
  processed: boolean;
  materializationError?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// Represents a materialized play event
export interface PlayDocument extends Models.Document {
  trackId: string;
  userId: string;
  sessionId: string;
  duration: number; // seconds listened
  completed: boolean;
  suspicious: boolean;
  fraudReasons?: FraudReason[];
  fraudScore: number; // 0-1
  weight?: number;
  artistIds?: string[];
  deviceInfo: {
    userAgent: string;
    ipAddress: string; // Hashed IP
    country?: string;
  };
  timestamp: string; // ISO string
  createdAt: string; // ISO string
}

export interface TrackDocument extends Models.Document {
  artistId: string;
  title: string;
  duration: number; // in seconds
  accessMode: 'public' | 'subscriber-only' | 'supporter-only' | 'buy-to-stream' | 'windowed';
  price?: number; // in cents, for buy-to-stream
  windowEndDate?: string; // ISO string
  collaborators: any[]; // Simplified for now
  metadata: {
    genre?: string;
    mood?: string;
    bpm?: number;
    key?: string;
    tags: string[];
  };
  audioFile: {
    original: string; // Appwrite Storage path
    hls: string; // Appwrite Storage path for HLS stream
    waveform?: number[]; // waveform data for visualization
  };
  coverArt?: string; // Appwrite Storage path
  isExplicit: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserDocument extends Models.Document {
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'fan' | 'artist' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface UserTrackAggregateDocument extends Models.Document {
  userId: string;
  trackId: string;
  lastPlayAt: string; // ISO string
  windowEndsAt: string; // ISO string
  playCount: number;
  updatedAt: string; // ISO string
}