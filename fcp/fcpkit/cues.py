"""Cue model + SRT/VTT parsing + the master project JSON.

The master file is the single source of truth for a video's captions:
timings, text, per-cue style, per-word emphasis, and translations all live
here. Every exporter (titles FCPXML, real FCP captions, karaoke) reads it.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Iterable, Optional


@dataclass
class Word:
    text: str
    start: Optional[float] = None  # seconds; None -> distributed inside the cue
    end: Optional[float] = None
    emphasize: bool = False


@dataclass
class Cue:
    start: float  # seconds
    end: float
    text: str
    style: Optional[str] = None  # preset name; None -> document default
    words: list[Word] = field(default_factory=list)

    @property
    def duration(self) -> float:
        return self.end - self.start

    def ensure_words(self) -> list[Word]:
        """Return word list; synthesize timings by character weight if absent."""
        if not self.words:
            self.words = [Word(text=w) for w in self.text.split()]
        untimed = [w for w in self.words if w.start is None or w.end is None]
        if untimed:
            weights = [max(len(w.text), 1) for w in self.words]
            total = sum(weights)
            t = self.start
            for w, wt in zip(self.words, weights):
                span = self.duration * wt / total
                w.start, w.end = t, t + span
                t += span
            if self.words:
                self.words[-1].end = self.end
        return self.words


@dataclass
class Doc:
    """A master captions document for one video."""

    fps: float = 29.97
    width: int = 1080
    height: int = 1920
    lang: str = "en"
    default_style: str = "tiktok"
    cues: list[Cue] = field(default_factory=list)
    translations: dict[str, list[str]] = field(default_factory=dict)  # lang -> text per cue

    def save(self, path: str | Path) -> None:
        Path(path).write_text(json.dumps(asdict(self), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    @classmethod
    def load(cls, path: str | Path) -> "Doc":
        raw = json.loads(Path(path).read_text(encoding="utf-8"))
        cues = []
        for c in raw.get("cues", []):
            words = [Word(**w) for w in c.pop("words", [])]
            cues.append(Cue(words=words, **c))
        return cls(
            fps=raw.get("fps", 29.97),
            width=raw.get("width", 1080),
            height=raw.get("height", 1920),
            lang=raw.get("lang", "en"),
            default_style=raw.get("default_style", "tiktok"),
            cues=cues,
            translations=raw.get("translations", {}),
        )

    def cues_for_lang(self, lang: Optional[str]) -> list[Cue]:
        """Cues with text swapped to a translation, timings untouched."""
        if lang is None or lang == self.lang:
            return self.cues
        texts = self.translations.get(lang)
        if texts is None:
            raise KeyError(f"no translation for {lang!r}; run `fcpkit translate` first")
        if len(texts) != len(self.cues):
            raise ValueError(f"translation {lang!r} has {len(texts)} lines, expected {len(self.cues)}")
        out = []
        for cue, text in zip(self.cues, texts):
            out.append(Cue(start=cue.start, end=cue.end, text=text, style=cue.style))
        return out


# ---------------------------------------------------------------- SRT / VTT

_TS = re.compile(r"(\d+):(\d{2}):(\d{2})[.,](\d{1,3})")


def _ts_to_sec(m: re.Match) -> float:
    h, mi, s, ms = m.groups()
    return int(h) * 3600 + int(mi) * 60 + int(s) + int(ms.ljust(3, "0")) / 1000


def _sec_to_srt(t: float) -> str:
    ms = round(t * 1000)
    h, ms = divmod(ms, 3600000)
    mi, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{mi:02d}:{s:02d},{ms:03d}"


_TAG = re.compile(r"<[^>]+>")


def parse_srt(text: str) -> list[Cue]:
    """Parse SRT (and WebVTT — same cue shape after the header) into Cues."""
    cues: list[Cue] = []
    # Normalize, drop the WEBVTT header and NOTE/STYLE blocks if present.
    blocks = re.split(r"\n\s*\n", text.replace("\r\n", "\n").strip())
    for block in blocks:
        lines = [ln for ln in block.strip().split("\n") if ln.strip()]
        if not lines or lines[0].startswith(("WEBVTT", "NOTE", "STYLE")):
            continue
        # Find the timing line (skips the SRT numeric index if present).
        ti = next((i for i, ln in enumerate(lines) if "-->" in ln), None)
        if ti is None:
            continue
        stamps = _TS.findall(lines[ti])
        matches = list(_TS.finditer(lines[ti]))
        if len(matches) < 2:
            continue
        start, end = _ts_to_sec(matches[0]), _ts_to_sec(matches[1])
        body = " ".join(lines[ti + 1:]).strip()
        body = _TAG.sub("", body)  # strip <i>, VTT word-timing tags, etc.
        if not body or end <= start:
            continue
        # YouTube auto-VTT repeats the same line in overlapping cues; dedupe.
        if cues and cues[-1].text == body and start < cues[-1].end + 0.05:
            cues[-1].end = max(cues[-1].end, end)
            continue
        cues.append(Cue(start=start, end=end, text=body))
    return cues


def write_srt(cues: Iterable[Cue]) -> str:
    out = []
    for i, c in enumerate(cues, 1):
        out.append(f"{i}\n{_sec_to_srt(c.start)} --> {_sec_to_srt(c.end)}\n{c.text}\n")
    return "\n".join(out)


# ---------------------------------------------------------------- selection

def select_cues(doc: Doc, ranges: Optional[str] = None, match: Optional[str] = None,
                t_from: Optional[float] = None, t_to: Optional[float] = None) -> list[int]:
    """Indices of cues selected by 1-based ranges ("3-10,15"), regex, or time window."""
    picked = set(range(len(doc.cues)))
    if ranges:
        wanted: set[int] = set()
        for part in ranges.split(","):
            part = part.strip()
            if "-" in part:
                a, b = part.split("-", 1)
                wanted.update(range(int(a) - 1, int(b)))
            else:
                wanted.add(int(part) - 1)
        picked &= wanted
    if match:
        rx = re.compile(match, re.IGNORECASE)
        picked &= {i for i, c in enumerate(doc.cues) if rx.search(c.text)}
    if t_from is not None:
        picked &= {i for i, c in enumerate(doc.cues) if c.end > t_from}
    if t_to is not None:
        picked &= {i for i, c in enumerate(doc.cues) if c.start < t_to}
    return sorted(picked)
