import { Howl } from 'howler';
import { music, battleSounds, voiceOvers, uiSounds } from './audioAssets';

type MusicTrack = keyof typeof music;
type MuteListener = (muted: boolean) => void;

class AudioManagerClass {
  private currentMusic: Howl | null = null;
  private currentMusicTrack: MusicTrack | null = null;
  private musicVolume = 0.4;
  private sfxVolume = 0.8;
  private muted = false;
  private muteListeners: MuteListener[] = [];

  init(): void {
    // Load mute preference from localStorage
    const saved = localStorage.getItem('duelana_muted');
    if (saved === 'true') {
      this.muted = true;
    }
  }

  // ---- Mute ----

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    localStorage.setItem('duelana_muted', String(muted));
    if (muted) {
      this.stopMusic();
    }
    this.muteListeners.forEach(fn => fn(muted));
  }

  toggleMute(): void {
    this.setMuted(!this.muted);
  }

  onMuteChange(listener: MuteListener): () => void {
    this.muteListeners.push(listener);
    return () => {
      this.muteListeners = this.muteListeners.filter(fn => fn !== listener);
    };
  }

  // ---- Music ----

  playMusic(track: MusicTrack): void {
    if (this.muted) return;
    if (this.currentMusicTrack === track && this.currentMusic) return;
    this.stopMusic();
    try {
      this.currentMusic = new Howl({
        src: [music[track]],
        loop: true,
        volume: this.musicVolume,
        autoplay: true,
      });
      this.currentMusicTrack = track;
    } catch (e) {
      console.warn('AudioManager: Failed to play music', track, e);
    }
  }

  stopMusic(): void {
    if (this.currentMusic) {
      try {
        this.currentMusic.stop();
        this.currentMusic.unload();
      } catch {
        // already unloaded
      }
      this.currentMusic = null;
      this.currentMusicTrack = null;
    }
  }

  // ---- Sound Effects (fire-and-forget) ----

  playSfx(source: string): void {
    if (this.muted) return;
    try {
      const sound = new Howl({
        src: [source],
        volume: this.sfxVolume,
        autoplay: true,
      });
      sound.on('end', () => {
        sound.unload();
      });
    } catch (e) {
      console.warn('AudioManager: Failed to play SFX', e);
    }
  }

  playRandomSfx(pool: string[]): void {
    const index = Math.floor(Math.random() * pool.length);
    this.playSfx(pool[index]);
  }

  // ---- Convenience methods ----

  playBattleHit(): void {
    const all = [...battleSounds.swords, ...battleSounds.impacts];
    this.playRandomSfx(all);
  }

  playHeavyImpact(): void {
    this.playRandomSfx(battleSounds.impacts);
  }

  playCountdown(num: 3 | 2 | 1): void {
    const map = {
      3: voiceOvers.countdown3,
      2: voiceOvers.countdown2,
      1: voiceOvers.countdown1,
    };
    this.playSfx(map[num]);
  }

  playResult(won: boolean): void {
    this.playSfx(won ? voiceOvers.youWin : voiceOvers.youLose);
  }

  playUIClick(): void {
    this.playRandomSfx(uiSounds.click);
  }

  cleanup(): void {
    this.stopMusic();
  }
}

export const AudioManager = new AudioManagerClass();
