// src/utils/audioManager.ts

import { Audio, AVPlaybackSource } from "expo-av";
import { character_sounds } from "../../assets/audio";

type OneShotOptions = {
  volume?: number;
};

class AudioManager {
  private static bgSound: Audio.Sound | null = null;
  private static curtainSound: Audio.Sound | null = null;
  private static enabled = true;
  private static musicEnabled = true;
  private static sfxEnabled = true;
  private static musicLevel = 0.7;
  private static sfxLevel = 0.8;
  private static keyboardSound: Audio.Sound | null = null;

  static setSoundEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopBackground();
    } else {
      this.playBackgroundFromStart();
    }
  }

  static setMusicEnabled(enabled: boolean, level = 0.7) {
    this.musicEnabled = enabled;
    this.musicLevel = Math.max(0, Math.min(level, 1));
    if (!enabled) {
      this.stopBackground();
    }
  }

  static setSfxEnabled(enabled: boolean, level = 0.8) {
    this.sfxEnabled = enabled;
    this.sfxLevel = Math.max(0, Math.min(level, 1));
  }
  static async duckBackground(volume = 0.05) {
    if (!this.bgSound) return;
    try {
      await this.bgSound.setVolumeAsync(volume);
    } catch {}
  }

  static async restoreBackground(volume = 0.35) {
    if (!this.bgSound) return;
    try {
      await this.bgSound.setVolumeAsync(volume);
    } catch {}
  }
  private static tensionSound: Audio.Sound | null = null;

  // -----------------------
  // Tension countdown music
  // -----------------------
  static async playTensionLoop() {
    if (!this.enabled || !this.musicEnabled) return;
    if (this.tensionSound) return;

    try {
      this.tensionSound = new Audio.Sound();
      await this.tensionSound.loadAsync(
        require("../../assets/audio/maybe/A_short_sound.wav")
      );
      await this.tensionSound.setIsLoopingAsync(true);
      await this.tensionSound.setVolumeAsync(0.7 * this.musicLevel);
      await this.tensionSound.playAsync();
    } catch (error) {
      console.warn("Error playing tension music", error);
    }
  }

  static async stopTensionLoop() {
    if (!this.tensionSound) return;
    try {
      await this.tensionSound.stopAsync();
      await this.tensionSound.unloadAsync();
    } catch (e) {
      console.warn("Error stopping tension music", e);
    } finally {
      this.tensionSound = null;
    }
  }

  // ---------------------------
  // Generic one-shot (awaitable)
  // ---------------------------
  private static async playOneShot(
    source: AVPlaybackSource,
    opts: OneShotOptions = {}
  ) {
    if (!this.enabled || !this.sfxEnabled) return;

    const volume = (opts.volume ?? 1) * this.sfxLevel;
    const sound = new Audio.Sound();

    try {
      await sound.loadAsync(source);
      await sound.setVolumeAsync(volume);
      await sound.playAsync();

      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status?.didJustFinish) resolve();
        });
      });
    } catch (error) {
      console.warn("Error playOneShot", error);
    } finally {
      try {
        await sound.unloadAsync();
      } catch {}
    }
  }

  // -----------------------
  // Keyboard typing sound
  // -----------------------
  static async startKeyboardLoop() {
    if (!this.enabled || !this.sfxEnabled) return;
    if (this.keyboardSound) return;

    try {
      this.keyboardSound = new Audio.Sound();
      await this.keyboardSound.loadAsync(
        require("../../assets/audio/keyboard3.wav")
      );
      await this.keyboardSound.setIsLoopingAsync(true);
      await this.keyboardSound.setVolumeAsync(1 * this.sfxLevel);
      await this.keyboardSound.playAsync();
    } catch (e) {
      console.warn("Error starting keyboard sound", e);
    }
  }

  static async stopKeyboardLoop() {
    if (!this.keyboardSound) return;
    try {
      await this.keyboardSound.stopAsync();
      await this.keyboardSound.unloadAsync();
    } catch {
    } finally {
      this.keyboardSound = null;
    }
  }

  // ----------
  // Background
  // ----------
  static async playBackgroundFromStart() {
    if (!this.enabled || !this.musicEnabled) return;
    try {
      if (this.bgSound) {
        try {
          await this.bgSound.stopAsync();
          await this.bgSound.unloadAsync();
        } catch {}
        this.bgSound = null;
      }
      this.bgSound = new Audio.Sound();
      await this.bgSound.loadAsync(require("../../assets/audio/audio01.wav"));
      await this.bgSound.setIsLoopingAsync(true);
      await this.bgSound.setVolumeAsync(0.35 * this.musicLevel);
      await this.bgSound.playAsync();
    } catch (error) {
      console.warn("Error playBackgroundFromStart", error);
    }
  }

  static async playBackground() {
    if (!this.enabled || !this.musicEnabled) return;
    if (this.bgSound) return;
    try {
      this.bgSound = new Audio.Sound();
      await this.bgSound.loadAsync(require("../../assets/audio/audio01.wav"));
      await this.bgSound.setIsLoopingAsync(true);
      await this.bgSound.setVolumeAsync(0.35 * this.musicLevel);
      await this.bgSound.playAsync();
    } catch (error) {
      console.warn("Error playing bg music", error);
    }
  }

  static async playBackgroundGame() {
    if (!this.enabled || !this.musicEnabled) return;
    if (this.bgSound) return;
    try {
      this.bgSound = new Audio.Sound();
      await this.bgSound.loadAsync(
        require("../../assets/audio/gameplayMusic.wav")
      );
      await this.bgSound.setIsLoopingAsync(true);
      await this.bgSound.setVolumeAsync(0.75 * this.musicLevel);
      await this.bgSound.playAsync();
    } catch (error) {
      console.warn("Error playing bg music", error);
    }
  }

  static async stopBackground() {
    if (!this.bgSound) return;
    try {
      await this.bgSound.stopAsync();
      await this.bgSound.unloadAsync();
    } catch (e) {
      console.warn("Error stopping bg music", e);
    } finally {
      this.bgSound = null;
    }
  }

  // -----------------------
  // Character sound
  // -----------------------
  static async playCharacterSound(source?: AVPlaybackSource) {
    if (!this.enabled || !this.sfxEnabled) return;
    return this.playOneShot(source ?? character_sounds.screena, { volume: 1 });
  }

  // -----------------------
  // Existing curtain / misc sounds (kept)
  // -----------------------
  static async playCurtainSound() {
    if (!this.enabled) return;
    try {
      this.curtainSound = new Audio.Sound();
      await this.curtainSound.loadAsync(
        require("../../assets/audio/audioCurtains.wav")
      );
      await this.curtainSound.setVolumeAsync(0.7 * this.sfxLevel);
      await this.curtainSound.playAsync();
    } catch (error) {
      console.warn("Error playing curtain sound", error);
    }
  }

  static async playHeroSound() {
    if (!this.enabled || !this.sfxEnabled) return;
    try {
      this.curtainSound = new Audio.Sound();
      await this.curtainSound.loadAsync(
        require("../../assets/audio/screena.wav")
      );
      await this.curtainSound.setVolumeAsync(1 * this.sfxLevel);
      await this.curtainSound.playAsync();
    } catch (error) {
      console.warn("Error playing curtain sound", error);
    }
  }

  static async playCurtainSoundClose() {
    if (!this.enabled || !this.sfxEnabled) return;
    try {
      this.curtainSound = new Audio.Sound();
      await this.curtainSound.loadAsync(
        require("../../assets/audio/closeCurtain.wav")
      );
      await this.curtainSound.setVolumeAsync(1 * this.sfxLevel);
      await this.curtainSound.playAsync();
    } catch (error) {
      console.warn("Error playing curtain sound", error);
    }
  }

  static async playCount() {
    if (!this.enabled || !this.sfxEnabled) return;
    try {
      this.curtainSound = new Audio.Sound();
      await this.curtainSound.loadAsync(
        require("../../assets/audio/count.wav")
      );
      await this.curtainSound.setVolumeAsync(1 * this.sfxLevel);
      await this.curtainSound.playAsync();
    } catch (error) {
      console.warn("Error playing curtain sound", error);
    }
  }

  static async playHeroBuy() {
    if (!this.enabled || !this.sfxEnabled) return;
    try {
      this.curtainSound = new Audio.Sound();
      await this.curtainSound.loadAsync(
        require("../../assets/audio/audioHorn.mp3")
      );
      await this.curtainSound.setVolumeAsync(0.7 * this.sfxLevel);
      await this.curtainSound.playAsync();
    } catch (error) {
      console.warn("Error playing buy hero sound", error);
    }
  }

  // -----------------------
  // HeroPicker sounds
  // -----------------------
  static async playPickingHero() {
    return this.playOneShot(require("../../assets/audio/pickingHero.wav"), {
      volume: 0.95,
    });
  }

  static async playHeroPickerEnd() {
    return this.playOneShot(require("../../assets/audio/heroPickerEnd.wav"), {
      volume: 0.95,
    });
  }
  static async heroPickerSwipe() {
    return this.playOneShot(
      require("../../assets/audio/maybe/UISounds_027.wav"),
      {
        volume: 1,
      }
    );
  }

  // ----------
  // Button click
  // ----------
  static async playButtonClick() {
    if (!this.enabled || !this.sfxEnabled) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/audio/buttonClick.wav")
      );
      await sound.setVolumeAsync(0.7 * this.sfxLevel);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if ((status as any).didJustFinish) sound.unloadAsync();
      });
    } catch (error) {
      console.warn("Error playing button click", error);
    }
  }
}

export default AudioManager;
