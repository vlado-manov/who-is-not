import {
  createAudioPlayer,
  type AudioSource,
  type AudioPlayer,
} from "expo-audio";
import { Platform } from "react-native";

/**
 * AudioManager — centralised sound controller.
 *
 * ─── BACKGROUND MUSIC LEGEND (LAW — do not deviate) ────────────────────────
 *
 *  Screen / Component               Track method              Tag
 *  ───────────────────────────────  ──────────────────────    ──────────────
 *  Start-up loader → MenuPlay       playBackground()          "menu"
 *  MenuPlay (on return to it)       playBackground()          "menu"
 *  Other menu screens / HeroPicker  (menu music carries on)   "menu"
 *  RoundScreen (via transition)     playBackgroundGame()      "gameplay"
 *  QuestionScreen                   playBackgroundGame()      "gameplay"
 *  PassDeviceGameplayScreen         playBackgroundGame()      "gameplay"
 *  VoteNowScreen                    playBackgroundGame()      "gameplay"
 *  VoteScreen                       useGameplayMusic()        "gameplay"
 *  VoteResultsScreen                useGameplayMusic()        "gameplay"
 *  StandingsScreen                  useGameplayMusic()        "gameplay"
 *  DeathMatchScreen                 playDeathMatchBg()        "deathmatch"
 *  ResultsScreen                    playBackgroundGame()      "gameplay"  (last 20 s: tension loop instead)
 *  PreRevealScreen                  playPreRevealBg()         "prereveal"  (gameplay track at 30%)
 *  RevealScreen (win path)          playRevealWinBg()         "reveal-win"
 *  RevealScreen (lose path)         playRevealLoseBg()        "reveal-lose"
 *  PlayerDeathScreen                playDeathScreenBg()       "death"
 *  LivesRevealScreen                (reveal music carries on) "reveal-*"
 *  WinnerScreen                     playWinnerScreenBg()      "winner"
 *
 *  Rules:
 *  • Every GAME screen claims its own music on focus — none inherits. The
 *    same track plays however the screen is reached (flow, dev lab, reconnect).
 *    A claim for the track that is already playing does not restart it.
 *  • On every screen change `stopScreenSounds()` runs (App.tsx): all one-shot
 *    effects still sounding and the tension / keyboard loops are cut. Only a
 *    sound started in the last 200 ms survives (the click or sting that goes
 *    with the change). So on any screen you can hear: its claimed music, the
 *    effects it starts itself, and nothing left over from before.
 *  • A screen that stops music when it is LEFT uses `stopBackgroundOf(itsTag)`,
 *    never a plain `stopBackground()`: the next screen has usually claimed its
 *    track already, and a plain stop would silence it a moment after it starts.
 *  • WinnerScreen uses useFocusEffect + setTimeout(50ms) so it always starts
 *    AFTER any stopBackground() from screens that unmount during navigation.
 *  • Music plays automatically when both `musicEnabled` and `enabled` are true.
 *    Re-enabling settings resumes `intendedBg` without any extra screen logic.
 *
 * ─── How playback works (keep it this simple) ──────────────────────────────
 *  • Every sound has its own player, made once and kept for the life of the
 *    app: one per music track, up to two voices per effect. The menu music and
 *    the short effects are made at the start-up loader (`preloadAll`); the
 *    other tracks and the long loops the first time their screen needs them. Playing is "start this player from the beginning",
 *    stopping is "pause it and rewind". Nothing is created, loaded or thrown
 *    away while the game runs.
 *  • All players keep the iOS audio session active (`make`). Otherwise the
 *    session is torn down each time any sound ends and rebuilt on the next
 *    play — sounds start late and the music is cut into.
 *  • An effect voice rewinds itself when it ends, so the next play is instant.
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
  private static intendedBg: {
    source: AudioSource;
    volume: number;
    tag: string;
  } | null = null;

  /** Tag of the currently-playing bg track, used to skip redundant reloads. */
  private static currentBgTag: string | null = null;

  private static enabled = true;
  private static musicEnabled = true;
  private static sfxEnabled = true;
  private static musicLevel = 0.7;
  private static sfxLevel = 0.8;

  // ── Players ────────────────────────────────────────────────────────────────

  /**
   * Every player is made here. `keepAudioSessionActive`: by default iOS shuts
   * the audio session down whenever a player pauses or finishes, and brings it
   * back up on the next play. With short effects ending all the time, that
   * made sounds start late and cut into the music. The session now stays up.
   */
  private static make(source: AudioSource): AudioPlayer {
    return createAudioPlayer(source, { keepAudioSessionActive: true });
  }

  /**
   * Plays a kept player from its beginning. A player that is already at the
   * start plays at once; one that is part-way through is rewound first and
   * plays when the rewind is done (playing before that is heard as a late or
   * missing sound).
   */
  private static startFromBeginning(player: AudioPlayer): void {
    const order = this.newOrder(player);
    if (!player.playing && player.currentTime < 0.05) {
      player.play();
      return;
    }
    // Plays when the rewind is done — unless the player has been told
    // something else in the meantime (stopped, paused, started again).
    // Without this check a stop that arrives during the rewind is undone a
    // moment later, and the sound plays on with nothing left to stop it.
    const play = () => {
      if (this.orders.get(player) !== order) return;
      try {
        player.play();
      } catch {}
    };
    player.seekTo(0).then(play, play);
  }

  /** Stops a kept player and leaves it at its beginning, ready to play again. */
  private static stopAndRewind(player: AudioPlayer | null): void {
    if (!player) return;
    this.newOrder(player);
    try {
      if (player.playing) player.pause();
      if (player.currentTime > 0) void player.seekTo(0).catch(() => {});
    } catch {}
  }

  /** Pauses a kept player where it is, so it can carry on later. */
  private static pauseInPlace(player: AudioPlayer | null): void {
    if (!player) return;
    this.newOrder(player);
    try {
      if (player.playing) player.pause();
    } catch {}
  }

  /**
   * The latest thing each player was told to do, as a counter. A delayed step
   * (playing after a rewind) checks it is still the latest before it acts.
   */
  private static orders = new Map<AudioPlayer, number>();

  private static newOrder(player: AudioPlayer): number {
    const order = (this.orders.get(player) ?? 0) + 1;
    this.orders.set(player, order);
    return order;
  }

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
        await this.pauseBackgroundInner(); // keep the track loaded for re-enable
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
        await this.pauseBackgroundInner(); // keep the track loaded for re-enable
        await this.stopTensionLoopInner();
      });
    } else {
      // Logo ON is the authoritative "play music" signal — restore musicEnabled so that
      // a prior setMusicEnabled(false) call cannot silently block resumption.
      this.musicEnabled = true;
      this.resumeBgIfNeeded();
    }
  }

  /** Live music volume (settings slider): also applied to the track that is playing. */
  static setMusicVolume(level: number) {
    this.musicLevel = Math.max(0, Math.min(level, 1));
    if (this.bgPlayer && this.intendedBg) {
      this.bgPlayer.volume = this.intendedBg.volume * this.musicLevel;
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
        await this.pauseBackgroundInner(); // keep the track loaded for re-enable
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

  /**
   * Mute from settings or the logo: the track is paused, not thrown away.
   * Re-creating the player reloads the whole file, and until it has loaded the
   * music comes back late and in fits and starts.
   */
  private static async pauseBackgroundInner() {
    // Every music player, not only the one believed to be current: switching
    // the music off must leave no track sounding, whatever state it is in.
    this.bgPlayers.forEach((player) => this.pauseInPlace(player));
  }

  /**
   * Brings the music back when it is re-enabled (or the app returns to the
   * foreground), if the screen set a track. The paused track carries on from
   * where it was; a new one is loaded only when the screen has since asked
   * for a different track.
   */
  private static resumeBgIfNeeded() {
    if (!this.intendedBg) return;
    const { source, volume, tag } = this.intendedBg;
    void this.enqueueBg(async () => {
      if (!this.enabled || !this.musicEnabled) return;
      const player = this.bgPlayer;
      if (player && this.currentBgTag === tag) {
        try {
          player.volume = volume * this.musicLevel;
          if (!player.playing) player.play();
          return;
        } catch {
          // The paused player is no longer usable: load the track again.
        }
      }
      await this.switchBgTrackInner(source, volume, tag, false);
    });
  }

  // ── Private bg helpers ─────────────────────────────────────────────────────

  /**
   * @param clearIntent  true  = screen explicitly wants silence → clear intendedBg.
   *                     false = settings-driven stop → keep intendedBg for resume.
   */
  private static async stopBackgroundInner(clearIntent = true) {
    if (clearIntent) this.intendedBg = null;
    this.bgPlayer = null;
    this.currentBgTag = null;
    // The players are kept (see `bgPlayers`), only stopped — all of them,
    // so no track can be left sounding untracked.
    this.bgPlayers.forEach((p) => this.stopAndRewind(p));
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
      await this.stopTensionLoopInner();
      const player = this.bgPlayerFor(tag, source);
      // Only one music track ever sounds: every other one is stopped.
      this.bgPlayers.forEach((p) => {
        if (p !== player) this.stopAndRewind(p);
      });
      player.loop = true;
      player.volume = volume * this.musicLevel;
      this.bgPlayer = player;
      this.currentBgTag = tag;
      this.startFromBeginning(player);
    } catch (error) {
      this.currentBgTag = null;
      console.warn(`AudioManager: error starting bg [${tag}]`, error);
    }
  }

  // ── Background music ───────────────────────────────────────────────────────

  /**
   * One player per music track, made the first time the track is needed and
   * kept for the life of the app. Switching music is then just "stop this
   * one, play that one" — nothing is loaded or thrown away while the game is
   * running, which is what made music come in late and in fits and starts.
   */
  private static bgPlayers = new Map<string, AudioPlayer>();

  private static bgPlayerFor(tag: string, source: AudioSource): AudioPlayer {
    let player = this.bgPlayers.get(tag);
    if (!player) {
      player = this.make(source);
      this.bgPlayers.set(tag, player);
    }
    return player;
  }

  /** Every music track: its file and its level. */
  private static readonly TRACKS = {
    menu: { source: require("../../assets/audio/audio01.wav"), volume: 0.35 },
    gameplay: {
      source: require("../../assets/audio/gameplayMusic.wav"),
      volume: 0.75,
    },
    /** The gameplay track at 30%, as a quiet bed under the pre-reveal screen. */
    prereveal: {
      source: require("../../assets/audio/gameplayMusic.wav"),
      volume: 0.3,
    },
    death: {
      source: require("../../assets/audio/new/deathscreen-2.wav"),
      volume: 0.75,
    },
    /** The stopwatch duel between the last two players. */
    deathmatch: {
      source: require("../../assets/audio/maybe/Tension_Clock_02_120_BPM.wav"),
      volume: 0.75,
    },
    winner: {
      source: require("../../assets/audio/new/winnerscreen.wav"),
      volume: 0.75,
    },
    "reveal-win": {
      source: require("../../assets/audio/new/reveal-win.wav"),
      volume: 0.75,
    },
    "reveal-lose": {
      source: require("../../assets/audio/new/reveal-lose2.wav"),
      volume: 0.75,
    },
  } as const;

  /**
   * A screen asks for its music. `lazy`: if this track is already playing it
   * carries on; otherwise (and always when not lazy) it starts from the top.
   */
  private static claim(tag: keyof typeof AudioManager.TRACKS, lazy: boolean) {
    const track = this.TRACKS[tag];
    return this.enqueueBg(() =>
      this.switchBgTrackInner(track.source, track.volume, tag, lazy),
    );
  }

  /**
   * Makes the players that must answer instantly, before they are first used:
   * the menu music (heard the moment the menu appears) and every short effect.
   * Called from the start-up loader.
   *
   * The other music tracks and the long loops are NOT made here. They are
   * large files, and loading them all at once at start-up competed with
   * everything else the app loads then (the hero pictures, in particular).
   * Each is made the first time its screen needs it and kept from then on.
   */
  static preloadAll(): void {
    try {
      this.bgPlayerFor("menu", this.TRACKS.menu.source);
      this.prewarming = true;
      this.playPickingHero();
      this.playHeroPickerEnd();
      this.heroPickerSwipe();
      this.playButtonClick();
      this.playRevealTitleSplash();
      this.playImposterLossSound();
      this.playImposterWinSound();
      this.playImposterNotLosingLiveSound();
      this.playLosingLiveSound();
      this.playTransitionBetweenRounds();
      this.playAnswerPop();
      this.playVoteNowLanding();
      this.playHeartDeath();
      this.playFactOpen();
      this.playItemDrop();
      this.playItemDropAlt();
      this.playSwoosh();
      this.playDeathScreenSfx();
      this.playKeyTap();
    } catch (e) {
      console.warn("AudioManager: preloadAll failed", e);
    } finally {
      this.prewarming = false;
    }
  }

  /** True while `preloadAll` runs: effects are made ready but not played. */
  private static prewarming = false;

  /** Menu / lobby music. Lazy — stays if already playing. */
  static async playBackground() {
    return this.claim("menu", true);
  }

  /** Restart menu music from the beginning. */
  static async playBackgroundFromStart() {
    return this.claim("menu", false);
  }

  /** Gameplay music. Lazy — stays if already playing. */
  static async playBackgroundGame() {
    return this.claim("gameplay", true);
  }

  /** Restart gameplay music from the beginning. */
  static async playBackgroundGameFromStart() {
    return this.claim("gameplay", false);
  }

  /**
   * Quiet bed under the whole pre-reveal screen: the gameplay music (the same
   * track as VoteNow) at 30%. It has its own tag, so it always replaces what
   * is playing and the next screen's music takes over at normal volume.
   */
  static async playPreRevealBg() {
    return this.claim("prereveal", false);
  }

  /** Death screen loop for PlayerDeathScreen. Always replaces whatever is playing. */
  static async playDeathScreenBg() {
    return this.claim("death", false);
  }

  /** DeathMatch (the stopwatch duel). Lazy — stays if already playing. */
  static async playDeathMatchBg() {
    return this.claim("deathmatch", true);
  }

  /** Winner screen loop for WinnerScreen. Lazy — stays if already playing. */
  static async playWinnerScreenBg() {
    return this.claim("winner", true);
  }

  /**
   * Explicit screen-driven silence.
   * Clears intendedBg — re-enabling music will NOT resume anything.
   */
  static async stopBackground() {
    return this.enqueueBg(() => this.stopBackgroundInner(true));
  }

  /**
   * For a screen that is being left: stops the music only if it is still this
   * screen's own track. The next screen has often already claimed its music
   * by the time the old one is torn down — a plain `stopBackground()` there
   * silences the new screen's music a moment after it starts.
   */
  static async stopBackgroundOf(...tags: (keyof typeof AudioManager.TRACKS)[]) {
    return this.enqueueBg(async () => {
      const current = this.currentBgTag;
      if (current && (tags as string[]).includes(current)) {
        await this.stopBackgroundInner(true);
      }
    });
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
    try {
      this.bgPlayer.volume = volume;
    } catch {}
  }

  static restoreBackground(volume = 0.35) {
    if (!this.bgPlayer) return;
    try {
      this.bgPlayer.volume = volume;
    } catch {}
  }

  // ── Tension countdown loop ─────────────────────────────────────────────────

  static async playTensionLoop() {
    return this.enqueueBg(async () => {
      if (!this.enabled || !this.musicEnabled) return;
      if (this.tensionPlayer) return;
      try {
        const player = this.make(
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

  /**
   * Short SFX players, kept per sound and reused. Creating a player loads the
   * file again, so making one for every tap delayed the sound and stalled the
   * UI; a replay of a loaded player starts at once.
   */
  private static sfxPool = new Map<
    AudioSource,
    { players: AudioPlayer[]; startedAt: number[]; next: number }
  >();
  /** Two voices per sound, so a quick repeat does not cut the first one off. */
  private static readonly SFX_VOICES = 2;

  /** A voice of an effect: rewinds itself when it ends, so it is ready again. */
  private static makeVoice(source: AudioSource): AudioPlayer {
    const player = this.make(source);
    player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) void player.seekTo(0).catch(() => {});
    });
    return player;
  }

  private static playFireAndForget(source: AudioSource, volume: number): void {
    try {
      let entry = this.sfxPool.get(source);
      if (!entry) {
        entry = { players: [], startedAt: [], next: 0 };
        this.sfxPool.set(source, entry);
      }
      if (this.prewarming) {
        if (entry.players.length === 0)
          entry.players.push(this.makeVoice(source));
        return;
      }
      if (!this.sfxEnabled) return;

      // A voice that is not sounding starts at once. If all are busy and
      // there is room, another one is made; otherwise the oldest starts over.
      let i = entry.players.findIndex((p) => !p.playing);
      if (i === -1 && entry.players.length < this.SFX_VOICES) {
        entry.players.push(this.makeVoice(source));
        i = entry.players.length - 1;
      }
      if (i === -1) {
        i = entry.next;
        entry.next = (entry.next + 1) % entry.players.length;
      }
      const player = entry.players[i];
      entry.startedAt[i] = Date.now();
      player.volume = volume * this.sfxLevel;
      this.startFromBeginning(player);
    } catch (e) {
      console.warn("AudioManager: playFireAndForget failed", e);
    }
  }

  // ── Game keyboard key tap ─────────────────────────────────────────────────

  /**
   * One keystroke of the game keyboard. A few players are created once and
   * reused in turn: making a new player for every key press is what made
   * typing stutter.
   */
  private static keyTapPlayers: AudioPlayer[] = [];
  private static keyTapNext = 0;

  static playKeyTap(): void {
    try {
      if (this.keyTapPlayers.length === 0) {
        this.keyTapPlayers = [0, 1, 2].map(() =>
          this.makeVoice(require("../../assets/audio/keyTap.wav")),
        );
      }
      if (this.prewarming || !this.sfxEnabled) return;
      const player = this.keyTapPlayers[this.keyTapNext];
      this.keyTapNext = (this.keyTapNext + 1) % this.keyTapPlayers.length;
      player.volume = 0.8 * this.sfxLevel;
      this.startFromBeginning(player);
    } catch (e) {
      console.warn("AudioManager: playKeyTap failed", e);
    }
  }

  // ── Pre-reveal reel ───────────────────────────────────────────────────────

  /**
   * The sound of the whole spin: one file with a drop at each moment a player
   * passes the payline (built by scripts/make-reel-spin.py from the reel's own
   * timing). Firing a separate sound per player from timers — dozens within a
   * few seconds — made both the sound and the reel itself stutter.
   */
  private static readonly REEL_SPIN_SOURCES = {
    overshoot: require("../../assets/audio/new/reelSpinOvershoot.wav"),
    short: require("../../assets/audio/new/reelSpinShort.wav"),
    snap: require("../../assets/audio/new/reelSpinSnap.wav"),
  } as const;
  private static reelSpinPlayers = new Map<string, AudioPlayer>();

  /** Makes the players for every ending, so the chosen one starts at once. */
  static prepareReelSpin(): void {
    try {
      (
        Object.keys(
          this.REEL_SPIN_SOURCES,
        ) as (keyof typeof AudioManager.REEL_SPIN_SOURCES)[]
      ).forEach((ending) => {
        if (!this.reelSpinPlayers.has(ending)) {
          this.reelSpinPlayers.set(
            ending,
            this.make(this.REEL_SPIN_SOURCES[ending]),
          );
        }
      });
    } catch (e) {
      console.warn("AudioManager: prepareReelSpin failed", e);
    }
  }

  /** Call in the same moment the reel starts to move. */
  static playReelSpin(
    ending: keyof typeof AudioManager.REEL_SPIN_SOURCES,
  ): void {
    if (!this.sfxEnabled) return;
    this.prepareReelSpin();
    const player = this.reelSpinPlayers.get(ending);
    if (!player) return;
    try {
      player.volume = 1 * this.sfxLevel;
      this.startFromBeginning(player);
    } catch {}
  }

  static stopReelSpin(): void {
    this.reelSpinPlayers.forEach((player) => this.stopAndRewind(player));
  }

  // ── DeathMatch stopwatch ──────────────────────────────────────────────────

  /** Ticking clock heard while a finalist's stopwatch is running. */
  private static stopwatchLoopPlayer: AudioPlayer | null = null;

  static prepareStopwatchLoop(): void {
    if (this.stopwatchLoopPlayer) return;
    try {
      const player = this.make(
        require("../../assets/audio/maybe/Loop_Clock_03_100_BPM.wav"),
      );
      player.loop = true;
      this.stopwatchLoopPlayer = player;
    } catch (e) {
      console.warn("AudioManager: prepareStopwatchLoop failed", e);
    }
  }

  static startStopwatchLoop(): void {
    if (!this.sfxEnabled) return;
    this.prepareStopwatchLoop();
    const player = this.stopwatchLoopPlayer;
    if (!player) return;
    try {
      player.volume = 1 * this.sfxLevel;
      this.startFromBeginning(player);
    } catch {}
  }

  static stopStopwatchLoop(): void {
    this.stopAndRewind(this.stopwatchLoopPlayer);
  }

  // ── Screen change ─────────────────────────────────────────────────────────

  /**
   * A sound started this recently belongs to the screen change itself (the
   * button that caused it, a transition sting) and is left to finish.
   */
  private static readonly CARRY_OVER_MS = 200;

  /**
   * Called on every screen change (App.tsx). Silences what belonged to the
   * screen being left: every one-shot effect still sounding and the tension
   * and keyboard loops. Background music is not touched — the next screen
   * claims its own track.
   */
  static stopScreenSounds(): void {
    const now = Date.now();
    this.sfxPool.forEach((entry) => {
      entry.players.forEach((player, i) => {
        if (now - (entry.startedAt[i] ?? 0) < this.CARRY_OVER_MS) return;
        this.stopAndRewind(player);
      });
    });
    this.stopReelSpin();
    this.stopStopwatchLoop();
    void this.stopTensionLoop();
    void this.stopKeyboardLoop();
  }

  /**
   * Total silence: the music (and what the last screen wanted to play), every
   * loop and every effect, with no exception for recent sounds. For a place
   * that must be quiet whatever came before it — the dev lab. The next screen
   * starts its own sounds as usual.
   */
  static stopAllSounds(): void {
    void this.stopBackground();
    void this.stopTensionLoop();
    void this.stopKeyboardLoop();
    this.stopReelSpin();
    this.stopStopwatchLoop();
    const silence = (player: AudioPlayer | null) => this.stopAndRewind(player);
    this.sfxPool.forEach((entry) => entry.players.forEach(silence));
    this.keyTapPlayers.forEach(silence);
    silence(this.curtainPlayer);
  }

  // ── Keyboard typing loop — DIRECT ─────────────────────────────────────────

  static async startKeyboardLoop() {
    if (!this.sfxEnabled) return;
    if (this.keyboardPlayer) return;
    try {
      const player = this.make(require("../../assets/audio/keyboard3.wav"));
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
    try {
      this.curtainPlayer.remove();
    } catch {}
    this.curtainPlayer = null;
  }

  static async playCurtainSound() {
    return this.enqueueSfx(async () => {
      if (!this.sfxEnabled) return;
      try {
        await this.stopCurtainSoundInner();
        const player = this.make(
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
        const player = this.make(
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
        const player = this.make(require("../../assets/audio/screena.wav"));
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
        const player = this.make(require("../../assets/audio/count.wav"));
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
        const player = this.make(require("../../assets/audio/audioHorn.mp3"));
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
    return this.claim("reveal-win", false);
  }

  static async playRevealLoseBg() {
    return this.claim("reveal-lose", false);
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
    this.playFireAndForget(
      require("../../assets/audio/new/winningscreen-start01.wav"),
      1,
    );
  }

  static playWinnerStart02(): void {
    this.playFireAndForget(
      require("../../assets/audio/new/winningscreen-start02.wav"),
      1,
    );
  }

  static playWinnerStart03(): void {
    this.playFireAndForget(
      require("../../assets/audio/new/winnerscreen-start03.wav"),
      1,
    );
  }

  static playFactOpen(): void {
    this.playFireAndForget(require("../../assets/audio/new/factOpen.wav"), 1);
  }

  static playItemDrop(): void {
    this.playFireAndForget(require("../../assets/audio/new/itemDrop2.wav"), 1);
  }

  /** A step sliding in (DeathMatch how to play). */
  static playSwoosh(): void {
    this.playFireAndForget(require("../../assets/audio/maybe/swoosh.wav"), 1);
  }

  static playItemDropAlt(): void {
    this.playFireAndForget(require("../../assets/audio/new/itemDrop.wav"), 1);
  }

  static playDeathScreenSfx(): void {
    this.playFireAndForget(
      require("../../assets/audio/new/deathscreen-2.wav"),
      1,
    );
  }
}

export default AudioManager;
