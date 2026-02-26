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

  async init(): Promise<void> {
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

  async setMuted(muted: boolean): Promise<void> {
    this.muted = muted;
    localStorage.setItem('duelana_muted', String(muted));
    if (muted) {
      await this.stopMusic();
    }
    this.muteListeners.forEach(fn => fn(muted));
  }

  async toggleMute(): Promise<void> {
    await this.setMuted(!this.muted);
  }

  onMuteChange(listener: MuteListener): () => void {
    this.muteListeners.push(listener);
    return () => {
      this.muteListeners = this.muteListeners.filter(fn => fn !== listener);
    };
  }

  // ---- Music ----

  async playMusic(track: MusicTrack): Promise<void> {
    if (this.muted) return;
    if (this.currentMusicTrack === track && this.currentMusic) return;
    await this.stopMusic();
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

  async stopMusic(): Promise<void> {
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

  async playSfx(source: string): Promise<void> {
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

  async playRandomSfx(pool: string[]): Promise<void> {
    const index = Math.floor(Math.random() * pool.length);
    return this.playSfx(pool[index]);
  }

  // ---- Convenience methods ----

  async playBattleHit(): Promise<void> {
    const all = [...battleSounds.swords, ...battleSounds.impacts];
    return this.playRandomSfx(all);
  }

  async playHeavyImpact(): Promise<void> {
    return this.playRandomSfx(battleSounds.impacts);
  }

  async playCountdown(num: 3 | 2 | 1): Promise<void> {
    const map = {
      3: voiceOvers.countdown3,
      2: voiceOvers.countdown2,
      1: voiceOvers.countdown1,
    };
    return this.playSfx(map[num]);
  }

  async playResult(won: boolean): Promise<void> {
    return this.playSfx(won ? voiceOvers.youWin : voiceOvers.youLose);
  }

  async playUIClick(): Promise<void> {
    return this.playRandomSfx(uiSounds.click);
  }

  async cleanup(): Promise<void> {
    await this.stopMusic();
  }
}

export const AudioManager = new AudioManagerClass();
