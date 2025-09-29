'use client';

import { Button } from "@/components/ui/button";
import { usePlayer } from "@/components/player/PlayerProvider";
import { PlayableTrack } from "@/types";
import TrackCard from "@/components/track/TrackCard"; // Import the new TrackCard component

export default function Home() {
  const { playTrack, playerState } = usePlayer();

  // Placeholder track data
  const placeholderTracks: PlayableTrack[] = [
    {
      id: "track-1",
      title: "A New Beginning",
      artistName: "Dyad AI",
      coverArtUrl: "https://images.unsplash.com/photo-1518611012118-6967b0b3f7d7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      duration: 300, // 5 minutes
    },
    {
      id: "track-2",
      title: "Echoes of Tomorrow",
      artistName: "Synthwave Collective",
      coverArtUrl: "https://images.unsplash.com/photo-1517344493709-27750908897b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      duration: 240, // 4 minutes
    },
    {
      id: "track-3",
      title: "Midnight Drive",
      artistName: "Neon Dreams",
      coverArtUrl: "https://images.unsplash.com/photo-1517344493709-27750908897b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      duration: 280, // 4 minutes 40 seconds
    },
  ];

  return (
    <div className="grid grid-rows-[1fr] items-center justify-items-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-1 items-center sm:items-start">
        <h1 className="text-4xl font-bold">Welcome to HUMANE</h1>
        <p className="text-lg text-muted-foreground">
          An artist-first, transparency-by-default platform.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {placeholderTracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      </main>
    </div>
  );
}