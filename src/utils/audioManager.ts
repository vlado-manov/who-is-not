import { createAudioPlayer, type AudioSource, type AudioPlayer } from "expo-audio";
import { Platform } from "react-native";

/**
 * AudioManager — centralised sound controller.
 *
 * ─── BACKGROUND MUSIC LEGEND (LAW — do not deviate) ────────────────────────
 *
 *  Screen / Component               Track method              Tag
 *  ───────────────────────────────  ──────────────────────    ──────────────
 *  Lobby / menu / HeroPicker        playBackground()          "menu"
 *  RoundScreen (via transition)     playBackgroundGame()      "gameplay"
 *  QuestionScreen                   playBackgroundGame()      "gameplay"
 *  PassDeviceGameplayScreen         playBackgroundGame()      "gameplay"
 *  VoteNowScreen                    playBackgroundGame()      "gameplay"
 *  VoteScreen                       (inherits gameplay)       "gameplay"
 *  VoteResultsScreen                (inherits gameplay)       "gameplay"
 *  StandingsScreen                  (inherits gameplay)       "gameplay"
 *  DeathMatchScreen                 (inherits gameplay)       "gameplay"
 *  ResultsScreen (answers phase)    playResultsBgMusic()      "results"
 *  PreRevealScreen                  playPreRevealBg()         "prereveal"
 *  RevealScreen (win path)          playRevealWinBg()         "reveal-win"
 *  RevealScreen (lose path)         playRevealLoseBg()        "reveal-lose"
 *  PlayerDeathScreen                playDeathScreenBg()       "death"
 *  LivesRevealScreen                (no music — silent)       —
 *  WinnerScreen                     playWinnerScreenBg()      "winner"
 *
 *  Rules:
 *  • Each screen CLAIMS its music on focus (useFocusEffect or useEffect on mount).
 *  • "inherits" screens must not call stopBackground() — the previous screen's
 *    music continues until the next explicit claim.
 *  • WinnerScreen uses useFocusEffect + setTimeout(50ms) so it always starts
 *    AFTER any stopBackground() from screens that unmount during navigation.
 *  • Music plays automatically when both `musicEnabled` and `enabled` are true.
 *    Re-enabling settings resumes `intendedBg` without any extra screen logic.
 *
 * ─── Settings hierarchy (absolute — settings always win) ───────────────────
 *   enabled      — master mute (the logo toggle on menu screens)
 *   musicEnabled — background / loop tracks only
 *   sfxEnabled   — all fire-and-forget SFX, keyboard loop, curtain sounds
 *
 * Intent tracking:
 *   intendedBg   — the bg track the current screen WANTS to play.
 *                  Set every time switchBgTrackInner is called (even when disabled).
 *                  Cleared only when a screen explicitly requests silence via stopBackground().
 *                  Preserved on settings-driven stops so re-enabling resumes the right track.
 *
 * Two serialisation queues:
 *   bgChain  — ALL background / looping music operations.
 *   sfxChain — Android-only, SFX that share one AudioPlayer slot.
 */
class AudioManager {
  // ── State ──────────────────────────────────────────────────────────────────
  private static bgPlayer: AudioPlayer | null = null;
  private static tensionPlayer: AudioPlayer | null = null;
  private static curtainPlayer: AudioPlayer | null = null;
  private static keyboardPlayer: AudioPlayer | null = null;

  /** What the current screen intends to play. Preserved across settings toggles. */
  private static intendedBg: { source: AudioSource; volume: number; tag: string } | null = null;

  /** Tag of the currently-playing bg track, used to skip redundant reloads. */
  private static currentBgTag: string | null = null;

  private static enabled = true;
  private static musicEnabled = true;
  private static sfxEnabled = true;
  private static musicLevel = 0.7;
  private static sfxLevel = 0.8;

  // ── Queues ─────────────────────────────────────────────────────────────────

  private static bgChain: Promise<void> = Promise.resolve();

  private static enqueueBg<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.bgChain.then(() => fn());
    this.bgChain = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

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

  /**
   * Called once on app boot from App.tsx to apply persisted settings.
   * Does NOT restart any music — screens start their own tracks on mount.
   */
  static applySettingsFromStore(settings: {
    soundEnabled: boolean;
    musicLevel?: number;
    sfxLevel?: number;
  }) {
    const ml = settings.musicLevel ?? 0.7;
    const sl = settings.sfxLevel ?? 0.8;
    this.enabled = settings.soundEnabled;
    // soundEnabled is the single source of truth for music on/off.
    // musicLevel is volume only; a stale 0 from a past settings-modal disable must not
    // block playback when the logo toggle is ON.
    this.musicEnabled = settings.soundEnabled;
    this.musicLevel = ml > 0 ? ml : 0.7;
    this.sfxEnabled = sl > 0; // SFX is independent of the logo mute toggle
    this.sfxLevel = sl;
    // If audio should be off, stop whatever may be playing (edge case: hot-reload).
    if (!this.enabled || !this.musicEnabled) {
      void this.enqueueBg(async () => {
        await this.stopBackgroundInner(false); // preserve intent for re-enable
        await this.stopTensionLoopInner();
      });
    }
    if (!this.sfxEnabled) {
      void this.stopKeyboardLoop();
    }
  }

  /**
   * Logo music toggle — controls only background music, never SFX.
   * Off → pauses bg music, preserves intendedBg for re-enable.
   * On  → resumes bg music unconditionally (logo ON is the authoritative "play" signal).
   */
  static setSoundEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      void this.enqueueBg(async () => {
        await this.stopBackgroundInner(false); // preserve intent
        await this.stopTensionLoopInner();
      });
    } else {
      // Logo ON is the authoritative "play music" signal — restore musicEnabled so that
      // a prior setMusicEnabled(false) call cannot silently block resumption.
      this.musicEnabled = true;
      this.resumeBgIfNeeded();
    }
  }

  /**
   * Music-only toggle (from settings modal).
   * Off → stops bg immediately, intent is preserved for re-enable.
   * On  → also clears the logo mute so music actually resumes.
   */
  static setMusicEnabled(enabled: boolean, level = 0.7) {
    this.musicEnabled = enabled;
    this.musicLevel = Math.max(0, Math.min(level, 1));
    if (!enabled) {
      void this.enqueueBg(async () => {
        await this.stopBackgroundInner(false); // preserve intent
        await this.stopTensionLoopInner();
      });
    } else {
      // Enabling music from settings clears any logo-level mute.
      this.enabled = true;
      this.resumeBgIfNeeded();
    }
  }

  /**
   * SFX-only toggle (from settings modal).
   * Off → stops keyboard loop immediately, blocks all future SFX.
   * On  → unblocks future SFX (event-driven, nothing to restart automatically).
   */
  static setSfxEnabled(enabled: boolean, level = 0.8) {
    this.sfxEnabled = enabled;
    this.sfxLevel = Math.max(0, Math.min(level, 1));
    if (!enabled) {
      void this.stopKeyboardLoop();
    }
  }

  /** Replays intendedBg when music re-enabled, if the screen set one. */
  private static resumeBgIfNeeded() {
    if (!this.intendedBg) return;
    const { source, volume, tag } = this.intendedBg;
    void this.enqueueBg(() => this.switchBgTrackInner(source, volume, tag, false));
  }

  // ── Private bg helpers ─────────────────────────────────────────────────────

  /**
   * @param clearIntent  true  = screen explicitly wants silence → clear intendedBg.
   *                     false = settings-driven stop → keep intendedBg for resume.
   */
  private static async stopBackgroundInner(clearIntent = true) {
    if (clearIntent) this.intendedBg = null;
    if (!this.bgPlayer) {
      this.currentBgTag = null;
      return;
    }
    const player = this.bgPlayer;
    this.bgPlayer = null;
    this.currentBgTag = null;
    try {
      player.pause();
      player.remove();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("not loaded")) {
        console.warn("AudioManager: error stopping bg", e);
      }
    }
  }

  private static async stopTensionLoopInner() {
    if (!this.tensionPlayer) return;
    const player = this.tensionPlayer;
    this.tensionPlayer = null;
    try {
      player.pause();
      player.remove();
    } catch (e) {
      console.warn("AudioManager: error stopping tension", e);
    }
  }

  /**
   * Core bg switcher — all bg-playing methods funnel through here.
   * Always records intendedBg first (even when disabled) so settings re-enable works.
   */
  private static async switchBgTrackInner(
    source: AudioSource,
    volume: number,
    tag: string,
    lazy: boolean,
  ) {
    // Record intent regardless of enabled state — needed for settings re-enable.
    this.intendedBg = { source, volume, tag };

    if (!this.enabled || !this.musicEnabled) return;
    if (lazy && this.currentBgTag === tag && this.bgPlayer) return;
    try {
      await this.stopBackgroundInner(false); // new track replaces old — keep intent (we just set it)
      await this.stopTensionLoopInner();
      const player = createAudioPlayer(source);
      player.loop = true;
      player.volume = volume * this.musicLevel;
      player.play();
      this.bgPlayer = player;
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

  /** Restart menu music from the beginning. */
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

  /** Death screen loop for PlayerDeathScreen. Always replaces whatever is playing. */
  static async playDeathScreenBg() {
    return this.enqueueBg(() =>
      this.switchBgTrackInner(
        require("../../assets/audio/new/deathscreen-2.wav"),
        0.75,
        "death",
        false,
      ),
    );
  }

  /** Winner screen loop for WinnerScreen. Lazy — stays if already playing. */
  static async playWinnerScreenBg() {
    return this.enqueueBg(() =>
      this.switchBgTrackInner(
        require("../../assets/audio/new/winnerscreen.wav"),
        0.75,
        "winner",
        true,
      ),
    );
  }

  /**
   * Explicit screen-driven silence.
   * Clears intendedBg — re-enabling music will NOT resume anything.
   */
  static async stopBackground() {
    return this.enqueueBg(() => this.stopBackgroundInner(true));
  }

  /**
   * Temporarily silences bg music WITHOUT clearing intendedBg.
   * Use on screens that don't have music but shouldn't erase the previous
   * screen's intent (e.g. dev lab) — music resumes via resumeBackground()
   * when focus returns to the originating screen.
   */
  static async silenceBackground() {
    return this.enqueueBg(() => this.stopBackgroundInner(false));
  }

  /**
   * Resumes the bg track the current screen last requested, if any.
   * No-op if nothing was playing before or if music is disabled.
   */
  static resumeBackground() {
    this.resumeBgIfNeeded();
  }

  // ── Volume helpers — DIRECT, no chain ────────────────────────────────────
  //
  // Must respond immediately (e.g. at the exact moment typing starts).

  static duckBackground(volume = 0.05) {
    if (!this.bgPlayer) return;
    try { this.bgPlayer.volume = volume; } catch {}
  }

  static restoreBackground(volume = 0.35) {
    if (!this.bgPlayer) return;
    try { this.bgPlayer.volume = volume; } catch {}
  }

  // ── Tension countdown loop ─────────────────────────────────────────────────

  static async playTensionLoop() {
    return this.enqueueBg(async () => {
      if (!this.enabled || !this.musicEnabled) return;
      if (this.tensionPlayer) return;
      try {
        const player = createAudioPlayer(
          require("../../assets/audio/maybe/A_short_sound.wav"),
        );
        player.loop = true;
        player.volume = 0.7 * this.musicLevel;
        player.play();
        this.tensionPlayer = player;
      } catch (error) {
        console.warn("AudioManager: error starting tension", error);
      }
    });
  }

  static async stopTensionLoop() {
    return this.enqueueBg(() => this.stopTensionLoopInner());
  }

  // ── Fire-and-forget SFX ────────────────────────────────────────────────────

  private static playFireAndForget(source: AudioSource, volume: number): void {
    if (!this.sfxEnabled) return;
    try {
      const player = createAudioPlayer(source);
      player.volume = volume * this.sfxLevel;
      player.addListener("playbackStatusUpdate", (status) => {
        if (status.didJustFinish) {
          try { player.remove(); } catch {}
        }
      });
      player.play();
    } catch (e) {
      console.warn("AudioManager: playFireAndForget failed", e);
    }
  }


  // ── Keyboard typing loop — DIRECT ─────────────────────────────────────────

  static async startKeyboardLoop() {
    if (!this.sfxEnabled) return;
    if (this.keyboardPlayer) return;
    try {
      const player = createAudioPlayer(
        require("../../assets/audio/keyboard3.wav"),
      );
      player.loop = true;
      player.volume = 1 * this.sfxLevel;
      player.play();
      this.keyboardPlayer = player;
    } catch (e) {
      this.keyboardPlayer = null;
      console.warn("AudioManager: error starting keyboard", e);
    }
  }

  static async stopKeyboardLoop() {
    if (!this.keyboardPlayer) return;
    const player = this.keyboardPlayer;
    this.keyboardPlayer = null;
    try {
      player.pause();
      player.remove();
    } catch {}
  }

  // ── Curtain / misc SFX ─────────────────────────────────────────────────────

  private static async stopCurtainSoundInner() {
    if (!this.curtainPlayer) return;
    try { this.curtainPlayer.remove(); } catch {}
    this.curtainPlayer = null;
  }

  static async playCurtainSound() {
    return this.enqueueSfx(async () => {
      if (!this.sfxEnabled) return;
      try {
        await this.stopCurtainSoundInner();
        const player = createAudioPlayer(
          require("../../assets/audio/audioCurtains.wav"),
        );
        player.volume = 0.7 * this.sfxLevel;
        player.play();
        this.curtainPlayer = player;
      } catch (error) {
        console.warn("AudioManager: error playCurtainSound", error);
      }
    });
  }

  static async playCurtainSoundClose() {
    return this.enqueueSfx(async () => {
      if (!this.sfxEnabled) return;
      try {
        await this.stopCurtainSoundInner();
        const player = createAudioPlayer(
          require("../../assets/audio/closeCurtain.wav"),
        );
        player.volume = 1 * this.sfxLevel;
        player.play();
        this.curtainPlayer = player;
      } catch (error) {
        console.warn("AudioManager: error playCurtainSoundClose", error);
      }
    });
  }

  static async playHeroSound() {
    return this.enqueueSfx(async () => {
      if (!this.sfxEnabled) return;
      try {
        const player = createAudioPlayer(
          require("../../assets/audio/screena.wav"),
        );
        player.volume = 1 * this.sfxLevel;
        player.play();
        this.curtainPlayer = player;
      } catch (error) {
        console.warn("AudioManager: error playHeroSound", error);
      }
    });
  }

  static async playCount() {
    return this.enqueueSfx(async () => {
      if (!this.sfxEnabled) return;
      try {
        await this.stopCurtainSoundInner();
        const player = createAudioPlayer(
          require("../../assets/audio/count.wav"),
        );
        player.volume = 1 * this.sfxLevel;
        player.play();
        this.curtainPlayer = player;
      } catch (error) {
        console.warn("AudioManager: error playCount", error);
      }
    });
  }

  static async playHeroBuy() {
    return this.enqueueSfx(async () => {
      if (!this.sfxEnabled) return;
      try {
        const player = createAudioPlayer(
          require("../../assets/audio/audioHorn.mp3"),
        );
        player.volume = 0.7 * this.sfxLevel;
        player.play();
        this.curtainPlayer = player;
      } catch (error) {
        console.warn("AudioManager: error playHeroBuy", error);
      }
    });
  }

  // ── HeroPicker SFX ────────────────────────────────────────────────────────

  static playPickingHero() {
    this.playFireAndForget(require("../../assets/audio/pickingHero.wav"), 0.95);
  }

  static playHeroPickerEnd() {
    this.playFireAndForget(require("../../assets/audio/heroPickerEnd.wav"), 0.95);
  }

  static heroPickerSwipe() {
    this.playFireAndForget(require("../../assets/audio/maybe/UISounds_027.wav"), 1);
  }

  // ── Button click ───────────────────────────────────────────────────────────

  static playButtonClick() {
    this.playFireAndForget(require("../../assets/audio/buttonClick.wav"), 0.7);
  }

  // ── Game-event SFX ────────────────────────────────────────────────────────

  static playRevealTitleSplash() {
    this.playFireAndForget(
      require("../../assets/audio/new/revealScreenTitleSplashSound.mp3"),
      0.9,
    );
  }

  static playImposterLossSound() {
    this.playFireAndForget(
      require("../../assets/audio/new/imposterLossSound.wav"),
      1,
    );
  }

  static playImposterWinSound() {
    this.playFireAndForget(
      require("../../assets/audio/new/imposterWinSound.mp3"),
      1,
    );
  }

  static async playRevealWinBg() {
    return this.enqueueBg(() =>
      this.switchBgTrackInner(
        require("../../assets/audio/new/reveal-win.wav"),
        0.75,
        "reveal-win",
        false,
      ),
    );
  }

  static async playRevealLoseBg() {
    return this.enqueueBg(() =>
      this.switchBgTrackInner(
        require("../../assets/audio/new/reveal-lose2.wav"),
        0.75,
        "reveal-lose",
        false,
      ),
    );
  }

  static playImposterNotLosingLiveSound() {
    this.playFireAndForget(
      require("../../assets/audio/new/imposterNotLosingLiveSound.mp3"),
      0.95,
    );
  }

  static playLosingLiveSound() {
    this.playFireAndForget(
      require("../../assets/audio/new/losingLiveSound.mp3"),
      1,
    );
  }

  static playTransitionBetweenRounds() {
    this.playFireAndForget(
      require("../../assets/audio/new/transitionBetweenRoundsSound.mp3"),
      1,
    );
  }

  static playAnswerPop(): void {
    this.playFireAndForget(
      require("../../assets/audio/new/resultscreenAnswerPop.wav"),
      0.9,
    );
  }

  static playVoteNowLanding(): void {
    this.playFireAndForget(
      require("../../assets/audio/maybe/UISounds_046.wav"),
      0.85,
    );
  }

  static playHeartDeath(): void {
    this.playFireAndForget(
      require("../../assets/audio/new/heartDeath01.wav"),
      1,
    );
  }

  static playWinnerStart01(): void {
    this.playFireAndForget(require("../../assets/audio/new/winningscreen-start01.wav"), 1);
  }

  static playWinnerStart02(): void {
    this.playFireAndForget(require("../../assets/audio/new/winningscreen-start02.wav"), 1);
  }

  static playWinnerStart03(): void {
    this.playFireAndForget(require("../../assets/audio/new/winnerscreen-start03.wav"), 1);
  }

  static playFactOpen(): void {
    this.playFireAndForget(require("../../assets/audio/new/factOpen.wav"), 1);
  }

  static playItemDrop(): void {
    this.playFireAndForget(
      require("../../assets/audio/new/itemDrop2.wav"),
      1,
    );
  }

  static playItemDropAlt(): void {
    this.playFireAndForget(
      require("../../assets/audio/new/itemDrop.wav"),
      1,
    );
  }

  static playDeathScreenSfx(): void {
    this.playFireAndForget(
      require("../../assets/audio/new/deathscreen-2.wav"),
      1,
    );
  }
}

export default AudioManager;
