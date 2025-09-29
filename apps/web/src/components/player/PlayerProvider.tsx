'use client';

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { PlayableTrack, PlayerState } from '@/types';
import { toast } from 'sonner';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@humane/lib/utils';

interface PlayerContextType {
  playerState: PlayerState;
  playTrack: (track: PlayableTrack) => void;
  pauseTrack: () => void;
  togglePlayPause: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

interface PlayerProviderProps {
  children: ReactNode;
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentTrack: null,
    isPlaying: false,
    volume: 0.7,
    currentTime: 0,
    duration: 0,
    isLoading: false,
    error: null,
  });

  const updatePlayerState = useCallback((updates: Partial<PlayerState>) => {
    setPlayerState((prevState) => ({ ...prevState, ...updates }));
  }, []);

  const playTrack = useCallback((track: PlayableTrack) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = track.audioUrl;
      audioRef.current.load();
    } else {
      audioRef.current = new Audio(track.audioUrl);
      audioRef.current.volume = playerState.volume;
    }

    updatePlayerState({ currentTrack: track, isLoading: true, error: null, isPlaying: false, currentTime: 0, duration: track.duration });

    audioRef.current.play()
      .then(() => {
        updatePlayerState({ isPlaying: true, isLoading: false });
        toast.success(`Now playing: ${track.title} by ${track.artistName}`);
      })
      .catch((error) => {
        console.error('Error playing track:', error);
        updatePlayerState({ isPlaying: false, isLoading: false, error: 'Failed to play track.' });
        toast.error(`Failed to play: ${track.title}`);
      });
  }, [playerState.volume, updatePlayerState]);

  const pauseTrack = useCallback(() => {
    if (audioRef.current && playerState.isPlaying) {
      audioRef.current.pause();
      updatePlayerState({ isPlaying: false });
    }
  }, [playerState.isPlaying, updatePlayerState]);

  const togglePlayPause = useCallback(() => {
    if (playerState.currentTrack) {
      if (playerState.isPlaying) {
        pauseTrack();
      } else {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => updatePlayerState({ isPlaying: true, isLoading: false }))
            .catch((error) => {
              console.error('Error resuming playback:', error);
              updatePlayerState({ isPlaying: false, isLoading: false, error: 'Failed to resume playback.' });
              toast.error('Failed to resume playback.');
            });
        } else {
          // This case should ideally not happen if currentTrack is set, but as a fallback
          playTrack(playerState.currentTrack);
        }
      }
    }
  }, [playerState.currentTrack, playerState.isPlaying, pauseTrack, playTrack, updatePlayerState]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      updatePlayerState({ currentTime: time });
    }
  }, [updatePlayerState]);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    updatePlayerState({ volume });
  }, [updatePlayerState]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      updatePlayerState({ currentTime: audio.currentTime });
    };
    const handleEnded = () => {
      updatePlayerState({ isPlaying: false, currentTime: 0 });
      // TODO: Implement next track logic
    };
    const handleLoadedMetadata = () => {
      updatePlayerState({ duration: audio.duration, isLoading: false });
    };
    const handleError = (e: Event) => {
      console.error('Audio error:', audio.error);
      updatePlayerState({ error: 'Audio playback error.', isPlaying: false, isLoading: false });
      toast.error('An audio error occurred.');
    };
    const handleWaiting = () => {
      updatePlayerState({ isLoading: true });
    };
    const handlePlaying = () => {
      updatePlayerState({ isLoading: false });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
    };
  }, [updatePlayerState]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = playerState.volume;
    }
  }, [playerState.volume]);

  const contextValue = {
    playerState,
    playTrack,
    pauseTrack,
    togglePlayPause,
    seekTo,
    setVolume,
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};