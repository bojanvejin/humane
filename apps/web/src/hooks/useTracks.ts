'use client';

import { useState, useEffect, useCallback } from 'react';
import { databases, storage, APPWRITE_DATABASE_ID, APPWRITE_TRACKS_COLLECTION_ID } from '@humane/lib/appwrite';
import { Query } from 'appwrite';
import { PlayableTrack, Track } from '@/types';
import { toast } from 'sonner';

export const useTracks = () => {
  const [tracks, setTracks] = useState<PlayableTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const APPWRITE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!APPWRITE_DATABASE_ID || !APPWRITE_TRACKS_COLLECTION_ID || !APPWRITE_BUCKET_ID) {
        throw new Error('Appwrite environment variables for tracks are not fully configured.');
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRACKS_COLLECTION_ID,
        [
          Query.equal('isPublished', true), // Only fetch published tracks
          Query.orderDesc('$createdAt'),
          Query.limit(100), // Limit to 100 tracks for now
        ]
      );

      const fetchedTracks: PlayableTrack[] = response.documents.map((doc) => {
        const track = doc as unknown as Track; // Cast to our Track interface

        // Generate playable audio URL (using original file for now)
        const audioUrl = track.audioFile.original
          ? storage.getFileDownload(APPWRITE_BUCKET_ID, track.audioFile.original)
          : ''; // Fallback if no original file

        // Generate cover art URL
        const coverArtUrl = track.coverArt
          ? storage.getFilePreview(APPWRITE_BUCKET_ID, track.coverArt, 400, 400, 'center', 100) // 400x400 preview
          : undefined;

        return {
          id: track.$id,
          title: track.title,
          artistName: 'Unknown Artist', // TODO: Fetch artist name from artistId
          coverArtUrl: coverArtUrl,
          audioUrl: audioUrl,
          duration: track.duration,
        };
      });

      setTracks(fetchedTracks);
    } catch (err: any) {
      console.error('Failed to fetch tracks:', err);
      setError(err.message || 'Failed to load tracks.');
      toast.error(err.message || 'Failed to load tracks.');
    } finally {
      setLoading(false);
    }
  }, [APPWRITE_BUCKET_ID, APPWRITE_DATABASE_ID, APPWRITE_TRACKS_COLLECTION_ID]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  return { tracks, loading, error, refetchTracks: fetchTracks };
};