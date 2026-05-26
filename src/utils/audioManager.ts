// src/utils/audioManager.ts

import { Audio, AVPlaybackSource } from "expo-av";
import { Platform } from "react-native";

type OneShotOptions = {
  volume?: number;
};

/**
 * AudioManager — centralised sound controller.
 *
 * Two serialisation queues:
 *   bgChain   — ALL background / looping music operations (universal, all platforms).
 *               Ensures only one bg track can start or stop at a time.
 *   sfxChain  — Android-only chain for short SFX that share a single Audio.Sound slot
 *               (curtain sounds, hero sounds, counts).  Kept narrow on purpose.
 *
 * Game-event sounds (one-shots fired during gameplay) use playFireAndForget:
 *   – No setOnPlaybackStatusUpdate callbacks → zero bridge overhead during playback.
 *   – Not serialised in any chain → never blocks UI, button clicks, or animations.
 *   – Auto-unloads via a timeout derived from the track's actual duration.
 *
 * Volume helpers (duckBackground / restoreBackground) and the keyboard typing
 * loop are direct async calls — no chain needed because they only touch an
 * already-loaded Sound object and must respond immediately.
 */
class AudioManager {
  // ── State ──────────────────────────────────────────────────────────────────
  private static bgSound: Audio.Sound | null = null;
  private static tensionSound: Audio.Sound | null = null;
  private static curtainSound: Audio.Sound | null = null;
  private static keyboardSound: Audio.Sound | null = null;

  /** Tag of the currently-playing bg track, used to skip redundant reloads. */
  private static currentBgTag: string | null = null;

  private static enabled = true;
  private static musicEnabled = true;
  private static sfxEnabled = true;
  private static musicLevel = 0.7;
  private static sfxLevel = 0.8;

  // ── Queues ─────────────────────────────────────────────────────────────────

  /**
   * Universal serialisation for ALL background music operations.
   * Prevents two bg tracks from loading / playing simultaneously on any platform.
   */
  private static bgChain: Promise<void> = Promise.resolve();

  private static enqueueBg<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.bgChain.then(() => fn());
    this.bgChain = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  /**
   * Android-only serialisation for SFX that share a single Audio.Sound slot
   * (curtain, hero, count sounds). Intentionally narrow scope.
   */
  private static sfxChain: Promise<void> = Promise.resolve();

  private static enqueueSfx<T>(fn: () => Promise<T>): Promise<T> {
    if (Platform.OS !== "android") return fn();
    const next = this.sfxChain.then(() => fn());
    this.sfxChain = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  static applySettingsFromStore(enabled: boolean, musicEnabled = true) {
    this.enabled = enabled;
    this.musicEnabled = musicEnabled;
    if (!enabled) void this.stopBackground();
  }

  static setSoundEnabled(enabled: boolean, useGameMusic = false) {
    this.enabled = enabled;
    if (!enabled) {
      void this.stopBackground();
      void this.stopTensionLoop();
    } else {
      if (useGameMusic) {
        void this.playBackgroundGameFromStart();
      } else {
        void this.playBackgroundFromStart();
      }
    }
  }

  static setMusicEnabled(enabled: boolean, level = 0.7) {
    this.musicEnabled = enabled;
    this.musicLevel = Math.max(0, Math.min(level, 1));
    if (!enabled) void this.stopBackground();
  }

  static setSfxEnabled(enabled: boolean, level = 0.8) {
    this.sfxEnabled = enabled;
    this.sfxLevel = Math.max(0, Math.min(level, 1));
  }

  // ── Private bg helpers ─────────────────────────────────────────────────────

  /** Must only be called from inside enqueueBg. */
  private static async stopBackgroundInner() {
    if (!this.bgSound) return;
    const sound = this.bgSound;
    this.bgSound = null;
    this.currentBgTag = null;
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("not loaded")) {
        console.warn("AudioManager: error stopping bg", e);
      }
    }
  }

  /** Must only be called from inside enqueueBg. */
  private static async stopTensionLoopInner() {
    if (!this.tensionSound) return;
    const sound = this.tensionSound;
    this.tensionSound = null;
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch (e) {
      console.warn("AudioManager: error stopping tension", e);
    }
  }

  /**
   * Core bg switcher — called from all bg-playing methods.
   *
   * @param tag   Short unique string for the track (e.g. "gameplay", "results").
   *              Pass the same tag as the currently-playing track to skip reload.
   * @param lazy  If true:  skip if the same tag is already playing (don't restart).
   *              If false: always stop current and start fresh.
   */
  private static async switchBgTrackInner(
    source: AVPlaybackSource,
    volume: number,
    tag: string,
    lazy: boolean,
  ) {
    if (!this.enabled || !this.musicEnabled) return;
    if (lazy && this.currentBgTag === tag && this.bgSound) return;
    try {
      await this.stopBackgroundInner();
      await this.stopTensionLoopInner();
      const sound = new Audio.Sound();
      await sound.loadAsync(source);
      await sound.setIsLoopingAsync(true);
      await sound.setVolumeAsync(volume * this.musicLevel);
      await sound.playAsync();
      this.bgSound = sound;
      this.currentBgTag = tag;
    } catch (error) {
      this.currentBgTag = null;
      console.warn(`AudioManager: error starting bg [${tag}]`, error);
    }
  }

  // ── Background music ───────────────────────────────────────────────────────

  /** Menu / lobby music. Lazy — stays if already playing. */
  static async playBackground() {
    return this.enqueueBg(() =>
      this.switchBgTrackInner(
        require("../../assets/audio/audio01.wav"),
        0.35,
        "menu",
        true,
      ),
    );
  }

  /** Restart menu music from the beginning (e.g. when re-enabling sound). */
  static async playBackgroundFromStart() {
    return this.enqueueBg(() =>
      this.switchBgTrackInner(
        require("../../assets/audio/audio01.wav"),
        0.35,
        "menu",
        false,
      ),
    );
  }

  /** Gameplay music. Lazy — stays if already playing. */
  static async playBackgroundGame() {
    return this.enqueueBg(() =>
      this.switchBgTrackInner(
        require("../../assets/audio/gameplayMusic.wav"),
        0.75,
        "gameplay",
        true,
      ),
    );
  }

  /** Restart gameplay music from the beginning. */
  static async playBackgroundGameFromStart() {
    return this.enqueueBg(() =>
      this.switchBgTrackInner(
        require("../../assets/audio/gameplayMusic.wav"),
        0.75,
        "gameplay",
        false,
      ),
    );
  }

  /** Pre-reveal suspense loop. Always replaces whatever is playing. */
  static async playPreRevealBg() {
    return this.enqueueBg(() =>
      this.switchBgTrackInner(
        require("../../assets/audio/new/preRevealScreenBgSound.mp3"),
        0.75,
        "prereveal",
        false,
      ),
    );
  }

  /** Discussion-phase loop for ResultsScreen. Always replaces whatever is playing. */
  static async playResultsBgMusic() {
    return this.enqueueBg(() =>
      this.switchBgTrackInner(
        require("../../assets/audio/new/resultsScreenBgMusicLoop.wav"),
        0.65,
        "results",
        false,
      ),
    );
  }

  /** Stop the background track entirely. */
  static async stopBackground() {
    return this.enqueueBg(() => this.stopBackgroundInner());
  }

  // ── Volume helpers — DIRECT, no chain ────────────────────────────────────
  //
  // These are simple setVolumeAsync calls on an already-loaded sound.
  // They must respond immediately (e.g. at the exact moment typing starts),
  // so serialising them in bgChain would introduce unpredictable delays.

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

  // ── Tension countdown loop ─────────────────────────────────────────────────

  /** Short suspense loop that plays during the countdown; ducks bgSound first. */
  static async playTensionLoop() {
    return this.enqueueBg(async () => {
      if (!this.enabled || !this.musicEnabled) return;
      if (this.tensionSound) return;
      try {
        this.tensionSound = new Audio.Sound();
        await this.tensionSound.loadAsync(
          require("../../assets/audio/maybe/A_short_sound.wav"),
        );
        await this.tensionSound.setIsLoopingAsync(true);
        await this.tensionSound.setVolumeAsync(0.7 * this.musicLevel);
        await this.tensionSound.playAsync();
      } catch (error) {
        console.warn("AudioManager: error starting tension", error);
      }
    });
  }

  static async stopTensionLoop() {
    return this.enqueueBg(() => this.stopTensionLoopInner());
  }

  // ── Fire-and-forget game events ────────────────────────────────────────────
  //
  // Creates a sound, starts playback, then auto-unloads after the track ends.
  //
  // Why this beats playOneShot + setOnPlaybackStatusUpdate for game events:
  //   1. No status callbacks → zero bridge overhead while the sound plays.
  //   2. Not serialised in any chain → never delays button clicks or animations.
  //   3. Cleanup is handled by a simple setTimeout using the track's own duration.

  private static playFireAndForget(
    source: AVPlaybackSource,
    volume: number,
  ): void {
    if (!this.enabled || !this.sfxEnabled) return;
    void (async () => {
      try {
        const { sound, status } = await Audio.Sound.createAsync(source, {
          shouldPlay: true,
          volume: volume * this.sfxLevel,
        });
        // Derive cleanup delay from the track's actual duration.
        // Fall back to 8 s if durationMillis is not yet available (streamed assets).
        const durationMs =
          typeof (status as any).durationMillis === "number"
            ? (status as any).durationMillis + 1000
            : 8000;
        setTimeout(() => {
          void sound.unloadAsync().catch(() => {});
        }, durationMs);
      } catch (e) {
        console.warn("AudioManager: playFireAndForget failed", e);
      }
    })();
  }

  // ── Keyboard typing loop — DIRECT, no sfxChain ────────────────────────────
  //
  // The keyboard loop starts/stops tightly coupled to the typewriter animation.
  // Serialising it in sfxChain would let any game-event sound (e.g. title splash)
  // delay the loop start by its full playback duration — which is the main
  // source of the "laggy quote animation" issue.

  static async startKeyboardLoop() {
    if (!this.enabled || !this.sfxEnabled) return;
    if (this.keyboardSound) return;
    try {
      this.keyboardSound = new Audio.Sound();
      await this.keyboardSound.loadAsync(
        require("../../assets/audio/keyboard3.wav"),
      );
      await this.keyboardSound.setIsLoopingAsync(true);
      await this.keyboardSound.setVolumeAsync(1 * this.sfxLevel);
      await this.keyboardSound.playAsync();
    } catch (e) {
      this.keyboardSound = null;
      console.warn("AudioManager: error starting keyboard", e);
    }
  }

  static async stopKeyboardLoop() {
    if (!this.keyboardSound) return;
    const sound = this.keyboardSound;
    this.keyboardSound = null;
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch {}
  }

  // ── Curtain / misc SFX ─────────────────────────────────────────────────────
  // These share the curtainSound slot, so they still use enqueueSfx on Android
  // to avoid stop/start races on the same object.

  private static async stopCurtainSoundInner() {
    if (!this.curtainSound) return;
    try {
      await this.curtainSound.stopAsync();
      await this.curtainSound.unloadAsync();
    } catch {}
    this.curtainSound = null;
  }

  static async playCurtainSound() {
    return this.enqueueSfx(async () => {
      if (!this.enabled) return;
      try {
        await this.stopCurtainSoundInner();
        this.curtainSound = new Audio.Sound();
        await this.curtainSound.loadAsync(
          require("../../assets/audio/audioCurtains.wav"),
        );
        await this.curtainSound.setVolumeAsync(0.7 * this.sfxLevel);
        await this.curtainSound.playAsync();
      } catch (error) {
        console.warn("AudioManager: error playCurtainSound", error);
      }
    });
  }

  static async playCurtainSoundClose() {
    return this.enqueueSfx(async () => {
      if (!this.enabled || !this.sfxEnabled) return;
      try {
        await this.stopCurtainSoundInner();
        this.curtainSound = new Audio.Sound();
        await this.curtainSound.loadAsync(
          require("../../assets/audio/closeCurtain.wav"),
        );
        await this.curtainSound.setVolumeAsync(1 * this.sfxLevel);
        await this.curtainSound.playAsync();
      } catch (error) {
        console.warn("AudioManager: error playCurtainSoundClose", error);
      }
    });
  }

  static async playHeroSound() {
    return this.enqueueSfx(async () => {
      if (!this.enabled || !this.sfxEnabled) return;
      try {
        this.curtainSound = new Audio.Sound();
        await this.curtainSound.loadAsync(
          require("../../assets/audio/screena.wav"),
        );
        await this.curtainSound.setVolumeAsync(1 * this.sfxLevel);
        await this.curtainSound.playAsync();
      } catch (error) {
        console.warn("AudioManager: error playHeroSound", error);
      }
    });
  }

  static async playCount() {
    return this.enqueueSfx(async () => {
      if (!this.enabled || !this.sfxEnabled) return;
      try {
        await this.stopCurtainSoundInner();
        this.curtainSound = new Audio.Sound();
        await this.curtainSound.loadAsync(
          require("../../assets/audio/count.wav"),
        );
        await this.curtainSound.setVolumeAsync(1 * this.sfxLevel);
        await this.curtainSound.playAsync();
      } catch (error) {
        console.warn("AudioManager: error playCount", error);
      }
    });
  }

  static async playHeroBuy() {
    return this.enqueueSfx(async () => {
      if (!this.enabled || !this.sfxEnabled) return;
      try {
        this.curtainSound = new Audio.Sound();
        await this.curtainSound.loadAsync(
          require("../../assets/audio/audioHorn.mp3"),
        );
        await this.curtainSound.setVolumeAsync(0.7 * this.sfxLevel);
        await this.curtainSound.playAsync();
      } catch (error) {
        console.warn("AudioManager: error playHeroBuy", error);
      }
    });
  }

  // ── HeroPicker SFX — fire-and-forget ─────────────────────────────────────
  // No ordering requirement; fire-and-forget avoids all bridge callback overhead.

  static playPickingHero() {
    this.playFireAndForget(require("../../assets/audio/pickingHero.wav"), 0.95);
  }

  static playHeroPickerEnd() {
    this.playFireAndForget(
      require("../../assets/audio/heroPickerEnd.wav"),
      0.95,
    );
  }

  static heroPickerSwipe() {
    this.playFireAndForget(
      require("../../assets/audio/maybe/UISounds_027.wav"),
      1,
    );
  }

  // ── Button click ───────────────────────────────────────────────────────────

  static playButtonClick() {
    this.playFireAndForget(
      require("../../assets/audio/buttonClick.wav"),
      0.7,
    );
  }

  // ── Game-event SFX — fire-and-forget ─────────────────────────────────────

  /** Splash whoosh fired when a title / question plate animates into view. */
  static playRevealTitleSplash() {
    this.playFireAndForget(
      require("../../assets/audio/new/revealScreenTitleSplashSound.mp3"),
      0.9,
    );
  }

  /** Played on RevealScreen after the title animation finishes — impostor lost. */
  static playImposterLossSound() {
    this.playFireAndForget(
      require("../../assets/audio/new/imposterLossSound.wav"),
      1,
    );
  }

  /** Played on RevealScreen after the title animation finishes — impostor won. */
  static playImposterWinSound() {
    this.playFireAndForget(
      require("../../assets/audio/new/imposterWinSound.mp3"),
      1,
    );
  }

  /**
   * Played on LivesRevealScreen when the impostor won and we first show
   * that they didn't lose a life (happy-jump moment).
   */
  static playImposterNotLosingLiveSound() {
    this.playFireAndForget(
      require("../../assets/audio/new/imposterNotLosingLiveSound.mp3"),
      0.95,
    );
  }

  /** Plays every time a life-loss animation starts. */
  static playLosingLiveSound() {
    this.playFireAndForget(
      require("../../assets/audio/new/losingLiveSound.mp3"),
      1,
    );
  }

  /** One-shot played when the player taps "continue" to start a new round. */
  static playTransitionBetweenRounds() {
    this.playFireAndForget(
      require("../../assets/audio/new/transitionBetweenRoundsSound.mp3"),
      1,
    );
  }

  /** Pop sound played for each answer card that stamps onto the ResultsScreen. */
  static playAnswerPop(): void {
    this.playFireAndForget(
      require("../../assets/audio/new/resultscreenAnswerPop.wav"),
      0.9,
    );
  }
}

export default AudioManager;
