"""Analyze your YouTube videos and feed them into the caption pipeline.

fetch:   uses yt-dlp (pip install yt-dlp) to pull metadata + subtitles
         (your uploaded subs if present, else YouTube's auto-captions) without
         downloading the video itself.
analyze: pure-python pacing/caption report from any transcript — works
         offline on a fetched video or on any local SRT/VTT.

The analyzer's job is editorial: where the dead air is, whether the hook is
fast enough, which caption preset fits the delivery, and chapter candidates.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from .cues import Cue, Doc, parse_srt


def fetch(url: str, workdir: str | Path, lang: str = "en") -> tuple[Path, dict]:
    """Pull metadata + subtitles via yt-dlp. Returns (subtitle_file, info_dict)."""
    if shutil.which("yt-dlp") is None:
        raise RuntimeError("yt-dlp not found — install with: pip install yt-dlp")
    workdir = Path(workdir)
    workdir.mkdir(parents=True, exist_ok=True)
    out = workdir / "%(id)s.%(ext)s"
    subprocess.run(
        ["yt-dlp", "--skip-download", "--write-info-json",
         "--write-subs", "--write-auto-subs", "--sub-langs", lang,
         "--sub-format", "vtt/srt", "-o", str(out), url],
        check=True, capture_output=True, text=True,
    )
    info_files = sorted(workdir.glob("*.info.json"), key=lambda p: p.stat().st_mtime)
    if not info_files:
        raise RuntimeError("yt-dlp produced no info.json")
    info = json.loads(info_files[-1].read_text(encoding="utf-8"))
    vid = info.get("id", "")
    subs = [p for p in workdir.glob(f"{vid}*.vtt")] + [p for p in workdir.glob(f"{vid}*.srt")]
    if not subs:
        raise RuntimeError(f"no subtitles found for language {lang!r} (video may have none)")
    return subs[0], info


_STOP = set("the a an and or but of to in on for with is are was were it its im "
            "i you we they this that so just like really going gonna get got".split())


@dataclass
class Report:
    markdown: str
    chapter_candidates: list[tuple[float, str]]


def analyze(cues: list[Cue], info: Optional[dict] = None) -> Report:
    info = info or {}
    if not cues:
        raise ValueError("no cues to analyze")
    total = cues[-1].end
    words = [w for c in cues for w in re.findall(r"[\w']+", c.text.lower())]
    wpm = len(words) / (total / 60) if total else 0

    # Hook: spoken density in the first 15 seconds decides scroll-past.
    hook_words = sum(len(c.text.split()) for c in cues if c.start < 15)

    # Silence gaps between consecutive cues.
    gaps = []
    for a, b in zip(cues, cues[1:]):
        g = b.start - a.end
        if g > 1.2:
            gaps.append((a.end, g, b.text))
    gaps.sort(key=lambda x: -x[1])

    # Per-minute pace buckets to spot sagging middles.
    buckets: dict[int, int] = {}
    for c in cues:
        buckets[int(c.start // 60)] = buckets.get(int(c.start // 60), 0) + len(c.text.split())
    slow = [m for m, n in buckets.items() if n < max(1, wpm * 0.5)]

    # Repeated phrases = your verbal tics.
    grams = Counter()
    for c in cues:
        toks = [w for w in re.findall(r"[\w']+", c.text.lower()) if w not in _STOP]
        for i in range(len(toks) - 1):
            grams[" ".join(toks[i:i + 2])] += 1
    tics = [(g, n) for g, n in grams.most_common(8) if n >= 3]

    # Caption readability vs the ~42-char two-line norm for vertical.
    long_lines = [c for c in cues if len(c.text) > 42]
    avg_len = sum(len(c.text) for c in cues) / len(cues)
    avg_dur = sum(c.duration for c in cues) / len(cues)

    # Chapter candidates: long gaps are natural topic seams.
    chapters = [(round(t + g, 1), f"after: “{nxt[:48]}”") for t, g, nxt in gaps[:8] if g > 1.8]
    chapters.sort()

    style = ("hormozi" if wpm > 175 else "tiktok" if wpm > 140 else "clean")
    md = [f"# Video analysis — {info.get('title', 'transcript')}", ""]
    if info:
        md.append(f"- **Length** {int(total // 60)}m{int(total % 60):02d}s · "
                  f"**views** {info.get('view_count', '?')} · **id** {info.get('id', '?')}")
    md += [
        f"- **Pace**: {wpm:.0f} wpm overall ({'fast' if wpm > 160 else 'moderate' if wpm > 120 else 'slow'})",
        f"- **Hook**: {hook_words} words in the first 15s "
        f"({'strong — keep it' if hook_words >= 35 else 'thin — front-load the payoff or tighten the cold open'})",
        f"- **Captions**: avg {avg_len:.0f} chars / {avg_dur:.1f}s per cue"
        + (f"; {len(long_lines)} cues exceed 42 chars — split them for vertical" if long_lines else " — good for vertical"),
        f"- **Suggested caption preset**: `{style}` (from pacing)",
        "",
    ]
    if gaps:
        md.append("## Dead air (cut or b-roll these)")
        for t, g, nxt in gaps[:10]:
            md.append(f"- {_mmss(t)} — {g:.1f}s silent, before “{nxt[:60]}”")
        md.append("")
    if slow:
        md.append(f"## Sagging minutes (word count < 50% of average): "
                  + ", ".join(f"{m}:00–{m+1}:00" for m in sorted(slow)) + "")
        md.append("")
    if tics:
        md.append("## Verbal tics (repeated 2-word phrases)")
        for g, n in tics:
            md.append(f"- “{g}” ×{n}")
        md.append("")
    if chapters:
        md.append("## Chapter candidates (paste into your description)")
        for t, why in chapters:
            md.append(f"- {_mmss(t)} — {why}")
        md.append("")
    return Report(markdown="\n".join(md), chapter_candidates=chapters)


def _mmss(t: float) -> str:
    return f"{int(t // 60)}:{int(t % 60):02d}"


def to_doc(cues: list[Cue], fps: float = 29.97, width: int = 1080, height: int = 1920,
           lang: str = "en") -> Doc:
    return Doc(fps=fps, width=width, height=height, lang=lang, cues=cues)


def load_transcript(path: str | Path) -> list[Cue]:
    return parse_srt(Path(path).read_text(encoding="utf-8"))
