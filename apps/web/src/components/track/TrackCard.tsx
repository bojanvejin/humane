'use client';

import React from 'react';
import { PlayableTrack } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Play, Pause, Loader2 } from 'lucide-react';
import { usePlayer } from '@/components/player/PlayerProvider';
import { cn } from '@humane/lib/utils';

interface TrackCardProps {
  track: PlayableTrack;
}

const TrackCard: React.FC<TrackCardProps> = ({ track }) => {
  const { playerState, playTrack, pauseTrack, togglePlayPause } = usePlayer();
  const isCurrentTrack = playerState.currentTrack?.id === track.id;
  const isPlaying = isCurrentTrack && playerState.isPlaying;
  const isLoading = isCurrentTrack && playerState.isLoading;

  const handlePlayPause = () => {
    if (isCurrentTrack) {
      togglePlayPause();
    } else {
      playTrack(track);
    }
  };

  return (
    <Card className="w-full max-w-xs overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative w-full h-48 bg-muted flex items-center justify-center">
          <Avatar className="w-full h-full rounded-none">
            <AvatarImage src={track.coverArtUrl} alt={track.title} className="object-cover" />
            <AvatarFallback className="rounded-none text-4xl font-bold">
              {track.title ? track.title.substring(0, 2) : '🎵'}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "absolute bottom-3 right-3 h-12 w-12 rounded-full shadow-lg",
              isLoading && "animate-pulse"
            )}
            onClick={handlePlayPause}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg font-semibold truncate">{track.title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground truncate">
          {track.artistName}
        </CardDescription>
      </CardContent>
    </Card>
  );
};

export default TrackCard;