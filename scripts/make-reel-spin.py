#!/usr/bin/env python3
"""Builds the sounds of the pre-reveal reel: assets/audio/new/reelSpin*.wav.

One short "drop" (assets/audio/new/itemDrop.wav) is placed at the moment each
player passes the payline, following the reel's own motion curve. The app then
plays one file when the spin starts, instead of firing dozens of separate
sounds from timers — that made both the sound and the reel stutter.

There is one file per ending of the spin. The numbers below must match
REEL_TILES and REEL_ENDINGS in src/components/PreRevealLoadingLayer.tsx. Run
again after changing any of them:

    python3 scripts/make-reel-spin.py
"""
import array
import os
import wave

REEL_TILES = 30

# name: easing as cubic-bezier(x1, y1, x2, y2), spin time, how far past (+) or
# short of (-) the result the spin ends (in tiles), then the pause and the
# time of the move onto the result.
ENDINGS = {
    "Overshoot": dict(bezier=(0.3, 0.0, 0.06, 1.0), spin_ms=4200, offset=0.5, hold_ms=200, settle_ms=380),
    "Short": dict(bezier=(0.3, 0.0, 0.06, 1.0), spin_ms=4200, offset=-0.5, hold_ms=200, settle_ms=380),
    "Snap": dict(bezier=(0.3, 0.0, 1.0, 1.0), spin_ms=2600, offset=0.0, hold_ms=0, settle_ms=0),
}

# How much of the drop sample each tick keeps, and its fade-out.
TICK_MS = 260
TICK_FADE_MS = 90
TICK_GAIN = 0.7
PEAK = 0.9

HERE = os.path.dirname(os.path.abspath(__file__))
AUDIO = os.path.join(HERE, "..", "assets", "audio", "new")


def curve(u, a, b):
    return 3 * (1 - u) ** 2 * u * a + 3 * (1 - u) * u**2 * b + u**3


def time_for_share(share, bezier):
    """Fraction of the spin's time at which the easing has covered `share`."""
    x1, y1, x2, y2 = bezier
    lo, hi = 0.0, 1.0
    for _ in range(40):
        mid = (lo + hi) / 2
        if curve(mid, y1, y2) < share:
            lo = mid
        else:
            hi = mid
    return curve(hi, x1, x2)


def tick_times(e):
    """When each of the REEL_TILES players reaches the payline, in ms."""
    run = REEL_TILES + e["offset"]
    times = []
    for k in range(1, REEL_TILES + 1):
        if k <= run:
            times.append(time_for_share(k / run, e["bezier"]) * e["spin_ms"])
        else:
            # The spin stopped short: this player arrives with the final hop.
            times.append(e["spin_ms"] + e["hold_ms"] + e["settle_ms"] * 0.5)
    return times


def main():
    with wave.open(os.path.join(AUDIO, "itemDrop.wav")) as w:
        channels, width, rate = w.getnchannels(), w.getsampwidth(), w.getframerate()
        assert width == 2, "expected 16-bit audio"
        drop = array.array("h", w.readframes(w.getnframes()))

    tick_frames = int(rate * TICK_MS / 1000)
    fade_frames = int(rate * TICK_FADE_MS / 1000)
    tick = [0.0] * (tick_frames * channels)
    for f in range(tick_frames):
        gain = TICK_GAIN * min(1.0, (tick_frames - f) / fade_frames)
        for c in range(channels):
            i = f * channels + c
            if i < len(drop):
                tick[i] = drop[i] * gain

    for name, e in ENDINGS.items():
        times = tick_times(e)
        total_ms = max(times) + TICK_MS + 50
        mix = [0.0] * (int(rate * total_ms / 1000) * channels)
        for at_ms in times:
            start = int(rate * at_ms / 1000) * channels
            for i, v in enumerate(tick):
                if start + i < len(mix):
                    mix[start + i] += v
        peak = max(1.0, max(abs(v) for v in mix))
        scale = PEAK * 32767 / peak
        out = array.array("h", (int(max(-32767, min(32767, v * scale))) for v in mix))
        path = os.path.join(AUDIO, f"reelSpin{name}.wav")
        with wave.open(path, "wb") as w:
            w.setnchannels(channels)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes(out.tobytes())
        print(f"reelSpin{name}.wav  {total_ms / 1000:.2f}s  last ticks at {[round(t) for t in times[-3:]]} ms")


if __name__ == "__main__":
    main()
