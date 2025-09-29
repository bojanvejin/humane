'use client'; // This page needs to be a client component to use usePlayer

import { Button } from "@/components/ui/button";
import { usePlayer } from "@/components/player/PlayerProvider"; // Import usePlayer hook
import { PlayableTrack } from "@/types"; // Import PlayableTrack type

export default function Home() {
  const { playTrack, playerState } = usePlayer();

  // Placeholder track data
  const placeholderTrack: PlayableTrack = {
    id: "track-123",
    title: "A New Beginning",
    artistName: "Dyad AI",
    coverArtUrl: "https://via.placeholder.com/150/0000FF/FFFFFF?text=Track+Cover",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // A public domain MP3 for testing
    duration: 300, // 5 minutes
  };

  const handlePlayPlaceholder = () => {
    playTrack(placeholderTrack);
  };

  return (
    <div className="grid grid-rows-[1fr] items-center justify-items-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-1 items-center sm:items-start">
        <h1 className="text-4xl font-bold">Welcome to HUMANE</h1>
        <p className="text-lg text-muted-foreground">
          An artist-first, transparency-by-default platform.
        </p>
        <Button onClick={handlePlayPlaceholder} disabled={playerState.isLoading}>
          {playerState.isLoading ? 'Loading...' : 'Play Placeholder Track'}
        </Button>
      </main>
    </div>
  );
}