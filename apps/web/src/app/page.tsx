'use client';

import { Button } from "@/components/ui/button";
import { usePlayer } from "@/components/player/PlayerProvider";
import { PlayableTrack } from "@/types";
import TrackCard from "@/components/track/TrackCard";
import { useTracks } from "@/hooks/useTracks"; // Import the new useTracks hook
import { Loader2 } from "lucide-react"; // Import Loader2 for loading state

export default function Home() {
  const { playerState } = usePlayer();
  const { tracks, loading, error } = useTracks(); // Use the new hook

  if (loading) {
    return (
      <div className="grid place-items-center min-h-screen p-8 pb-20 sm:p-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading tracks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid place-items-center min-h-screen p-8 pb-20 sm:p-20 text-destructive">
        <p className="text-lg">Error: {error}</p>
        <p className="text-muted-foreground">Please check your Appwrite configuration and ensure tracks are published.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[1fr] items-center justify-items-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-1 items-center sm:items-start">
        <h1 className="text-4xl font-bold">Welcome to HUMANE</h1>
        <p className="text-lg text-muted-foreground">
          An artist-first, transparency-by-default platform.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.length > 0 ? (
            tracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))
          ) : (
            <p className="text-muted-foreground col-span-full">No tracks found. Upload some music!</p>
          )}
        </div>
      </main>
    </div>
  );
}