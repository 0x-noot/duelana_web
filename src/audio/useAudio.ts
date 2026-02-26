import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { AudioManager } from './AudioManager';

type MusicTrack = 'home' | 'battle';

/**
 * Plays background music when the page is active.
 * Respects mute state — if muted, music won't start.
 * When unmuted, the current page's track resumes.
 */
export function useScreenMusic(track: MusicTrack) {
  const location = useLocation();
  const muted = useMuted();

  useEffect(() => {
    if (!muted) {
      AudioManager.playMusic(track);
    }
    return () => {
      AudioManager.stopMusic();
    };
  }, [track, muted, location.pathname]);
}

/** Subscribe to the mute state. Re-renders when mute toggles. */
export function useMuted(): boolean {
  const [muted, setMuted] = useState(AudioManager.isMuted());

  useEffect(() => {
    return AudioManager.onMuteChange(setMuted);
  }, []);

  return muted;
}

/** Toggle mute on/off. */
export function useToggleMute(): () => void {
  return useCallback(() => { AudioManager.toggleMute(); }, []);
}

/** Direct access to the AudioManager singleton for SFX calls. */
export function useAudioManager() {
  return AudioManager;
}
