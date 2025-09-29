// This file is a copy of src/types/index.ts to ensure Firebase Functions are self-contained
// and don't rely on the Next.js app's module resolution.
// In a monorepo setup, this would ideally be a shared package.
import * as admin from 'firebase-admin';

export type FraudReason = 
  'insufficient_listen_duration' | 
  'bot_user_agent' | 
  'local_ip_address' | 
  'duplicate_play_within_window' |
  'track_not_found' |
  'new_user_burst' |
  'device_multiple_accounts' |
  'ip_cluster';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'fan' | 'artist' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface ArtistProfile {
  id: string;
  userId: string;
  artistName: string;
  bio?: string;
  website?: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
  };
  stripeConnectId?: string;
  payoutSettings: {
    bankAccount?: {
      country: string;
      currency: string;
      accountHolderName: string;
      accountNumber: string;
      routingNumber?: string;
    };
    taxInfo?: {
      taxId?: string;
      w9Completed?: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Track {
  id: string;
  artistId: string;
  title: string;
  duration: number; // in seconds
  accessMode: 'public' | 'subscriber-only' | 'supporter-only' | 'buy-to-stream' | 'windowed';
  price?: number; // in cents, for buy-to-stream
  windowEndDate?: Date; // for windowed access
  collaborators: TrackCollaborator[];
  metadata: {
    genre?: string;
    mood?: string;
    bpm?: number;
    key?: string;
    tags: string[];
  };
  audioFile: {
    original: string; // Firebase Storage path
    hls: string; // Firebase Storage path for HLS stream
    waveform?: number[]; // waveform data for visualization
  };
  coverArt?: string; // Firebase Storage path
  isExplicit: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackCollaborator {
  artistId: string;
  role: 'primary' | 'featured' | 'producer' | 'writer' | 'performer';
  percentage: number; // 0-100
  accepted: boolean;
  acceptedAt?: Date;
}

export interface Play {
  id: string;
  trackId: string;
  userId: string;
  sessionId: string;
  duration: number; // seconds listened
  completed: boolean;
  suspicious: boolean;
  fraudReasons?: FraudReason[];
  fraudScore: number; // 0-1
  weight?: number; // Added for UCPS calculation
  deviceInfo: {
    userAgent: string;
    ipAddress: string; // Hashed IP
    country?: string;
  };
  timestamp: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  artistId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
  netMonthly: number; // Added for UCPS calculation
}

export interface Tip {
  id: string;
  fromUserId: string;
  toArtistId: string;
  trackId?: string;
  amount: number; // in cents
  message?: string;
  stripePaymentIntentId: string;
  status: 'succeeded' | 'pending' | 'failed';
  createdAt: Date;
}

export interface Payout {
  id: string;
  artistId: string;
  period: string; // YYYY-MM
  totalEarnings: number; // in cents
  breakdown: {
    subscriptions: number;
    tips: number;
    streams: number;
    directSales: number;
  };
  stripePayoutId?: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  createdAt: Date;
  paidAt?: Date;
}

export interface FanReceipt {
  id: string;
  userId: string;
  type: 'subscription' | 'tip' | 'purchase';
  amount: number; // in cents
  allocation: {
    artistId: string;
    artistName: string;
    amount: number;
    percentage: number;
  }[];
  timestamp: Date;
  stripePaymentIntentId: string;
}

export interface UserTrackAggregate {
  userId: string;
  trackId: string;
  lastPlayAt: admin.firestore.Timestamp;
  windowEndsAt: admin.firestore.Timestamp;
  playCount: number;
  updatedAt: admin.firestore.Timestamp;
}