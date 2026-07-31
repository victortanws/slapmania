"""Frame-accurate rational time for FCPXML.

Final Cut Pro rejects (or silently nudges) any offset/duration that is not an
exact multiple of the sequence's frameDuration. Everything in this toolkit
therefore snaps to frames FIRST and only then renders "N/Ds" strings.
"""
from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction

# Canonical NTSC-family rates: float fps people type -> exact rational fps.
_KNOWN_RATES = {
    23.976: Fraction(24000, 1001),
    23.98: Fraction(24000, 1001),
    24.0: Fraction(24, 1),
    25.0: Fraction(25, 1),
    29.97: Fraction(30000, 1001),
    30.0: Fraction(30, 1),
    50.0: Fraction(50, 1),
    59.94: Fraction(60000, 1001),
    60.0: Fraction(60, 1),
}


def rational_fps(fps: float) -> Fraction:
    """Map a user-typed fps to its exact rational rate."""
    for approx, exact in _KNOWN_RATES.items():
        if abs(fps - approx) < 0.005:
            return exact
    return Fraction(fps).limit_denominator(100000)


@dataclass(frozen=True)
class Timebase:
    """A sequence timebase: exact fps plus helpers to snap and format times."""

    fps: Fraction

    @classmethod
    def from_fps(cls, fps: float) -> "Timebase":
        return cls(rational_fps(fps))

    @property
    def frame_duration(self) -> Fraction:
        return 1 / self.fps

    def frame_duration_str(self) -> str:
        return fmt_time(self.frame_duration)

    def to_frames(self, seconds: float) -> int:
        """Nearest frame index for a wall-clock time in seconds."""
        return round(Fraction(seconds).limit_denominator(1000000) * self.fps)

    def snap(self, seconds: float) -> Fraction:
        """Snap a time in seconds to the exact frame boundary (as seconds)."""
        return self.to_frames(seconds) * self.frame_duration

    def snap_str(self, seconds: float) -> str:
        return fmt_time(self.snap(seconds))

    def is_aligned(self, t: Fraction) -> bool:
        return (t / self.frame_duration).denominator == 1


def fmt_time(t: Fraction) -> str:
    """Render a Fraction of seconds the way FCPXML expects: "Ns" or "N/Ds"."""
    t = Fraction(t)
    if t.denominator == 1:
        return f"{t.numerator}s"
    return f"{t.numerator}/{t.denominator}s"


def parse_time(s: str) -> Fraction:
    """Parse an FCPXML time attribute ("3600s", "3003/30000s")."""
    s = s.strip()
    if not s.endswith("s"):
        raise ValueError(f"not an FCPXML time: {s!r}")
    body = s[:-1]
    if "/" in body:
        num, den = body.split("/", 1)
        return Fraction(int(num), int(den))
    return Fraction(int(body), 1)
