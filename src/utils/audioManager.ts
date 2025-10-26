// src/utils/audioManager.ts
import { Audio } from "expo-av";

class AudioManager {
  private static bgSound: Audio.Sound | null = null;
  private static curtainSound: Audio.Sound | null = null;
  private static enabled = true;

  static setSoundEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopBackground();
    } else {
      this.playBackgroundFromStart();
    }
  }

  static async playBackgroundFromStart() {
    if (!this.enabled) return;
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
      await this.bgSound.setVolumeAsync(0.5);
      await this.bgSound.playAsync();
    } catch (error) {
      console.warn("Error playBackgroundFromStart", error);
    }
  }

  static async playBackground() {
    if (!this.enabled) return;
    if (this.bgSound) return; // вече свири
    try {
      this.bgSound = new Audio.Sound();
      await this.bgSound.loadAsync(require("../../assets/audio/audio01.wav"));
      await this.bgSound.setIsLoopingAsync(true);
      await this.bgSound.setVolumeAsync(0.5);
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

  static async playCurtainSound() {
    if (!this.enabled) return;
    try {
      this.curtainSound = new Audio.Sound();
      await this.curtainSound.loadAsync(
        require("../../assets/audio/audioCurtains.wav")
      );
      await this.curtainSound.setVolumeAsync(0.7);
      await this.curtainSound.playAsync();
    } catch (error) {
      console.warn("Error playing curtain sound", error);
    }
  }

  static async playButtonClick() {
    if (!this.enabled) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/audio/buttonClick.wav")
      );
      await sound.setVolumeAsync(0.7);
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
