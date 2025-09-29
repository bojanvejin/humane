'use client';

import React from 'react';
import { usePlayer } from './PlayerProvider';
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@humane/lib/utils';

const formatTime = (seconds: number | null | undefined) => {
  const safeSeconds = typeof seconds === 'number' && !isNaN(seconds) ? seconds : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = Math.floor(safeSeconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

export const MiniPlayer: React.FC = () => {
  const { playerState, togglePlayPause, seekTo, setVolume } = usePlayer();
  const { currentTrack, isPlaying, currentTime, duration, volume, isLoading } = playerState;

  if (!currentTrack) {
    return null; // Don't render if no track is loaded
  }

  const handleSeek = (value: number[]) => {
    seekTo(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const toggleMute = () => {
    setVolume(volume === 0 ? 0.7 : 0); // Toggle between 0 and a default volume
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 shadow-lg z-50">
      <div className="container mx-auto flex items-center justify-between gap-4">
        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-0 flex-grow-0">
          <Avatar className="h-10 w-10 rounded-md">
            <AvatarImage src={currentTrack.coverArtUrl} alt={currentTrack.title} />
            <AvatarFallback className="rounded-md">
              {currentTrack.title ? currentTrack.title.substring(0, 2) : ''}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{currentTrack.title}</span>
            <span className="text-xs text-muted-foreground truncate">{currentTrack.artistName}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-4 flex-grow justify-center max-w-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayPause}
            disabled={isLoading}
            className="h-10 w-10"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          <div className="flex items-center flex-grow gap-2">
            <span className="text-xs text-muted-foreground w-10 text-right">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
              disabled={isLoading}
            />
            <span className="text-xs text-muted-foreground w-10 text-left">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 flex-grow-0 min-w-[120px] justify-end">
          <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8">
            {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
};