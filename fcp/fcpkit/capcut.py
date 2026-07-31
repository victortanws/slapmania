"""Import captions out of CapCut.

Two routes, in order of reliability:

1. SRT export (recommended): in CapCut, Captions > Export > SRT. That file
   goes through the normal `fcpkit import` path — this module isn't needed.

2. Draft rip: point `fcpkit import` at a CapCut project's draft_content.json
   (macOS: ~/Movies/CapCut/User Data/Projects/com.lveditor.draft/<project>/
   draft_content.json). We read the text materials + track segments directly,
   which also works for drafts you never exported. CapCut stores times in
   MICROSECONDS; the format shifts between versions, so this parser is
   deliberately defensive and tells you what it skipped.
"""
from __future__ import annotations

import json
from pathlib import Path

from .cues import Cue

US = 1_000_000  # CapCut timerange unit: microseconds


def _extract_text(material: dict) -> str:
    """CapCut text materials carry either a plain `text` field or a JSON-encoded
    `content` blob (newer versions) with the string under `text`."""
    content = material.get("content")
    if isinstance(content, str) and content.strip().startswith("{"):
        try:
            inner = json.loads(content)
            if isinstance(inner.get("text"), str):
                return inner["text"]
        except (json.JSONDecodeError, TypeError):
            pass
    for key in ("text", "content", "caption_text"):
        val = material.get(key)
        if isinstance(val, str) and val and not val.strip().startswith("{"):
            return val
    return ""


def parse_capcut_draft(path: str | Path) -> tuple[list[Cue], list[str]]:
    """Returns (cues, warnings). Raises ValueError if this isn't a CapCut draft."""
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError(f"{path}: doesn't look like a CapCut draft_content.json")
    materials = raw.get("materials", {})
    tracks = raw.get("tracks", [])
    if not isinstance(materials, dict) or not isinstance(tracks, list):
        raise ValueError(f"{path}: doesn't look like a CapCut draft_content.json")

    texts_by_id: dict[str, dict] = {}
    for mat in materials.get("texts", []) or []:
        if isinstance(mat, dict) and mat.get("id"):
            texts_by_id[mat["id"]] = mat

    cues: list[Cue] = []
    warnings: list[str] = []
    for track in tracks:
        if track.get("type") != "text":
            continue
        for seg in track.get("segments", []) or []:
            mat = texts_by_id.get(seg.get("material_id"))
            if mat is None:
                continue
            tr = seg.get("target_timerange") or {}
            start, dur = tr.get("start"), tr.get("duration")
            if start is None or dur is None:
                warnings.append(f"segment {seg.get('id', '?')}: no target_timerange, skipped")
                continue
            text = _extract_text(mat).replace("\n", " ").strip()
            if not text:
                warnings.append(f"segment {seg.get('id', '?')}: empty/unreadable text, skipped")
                continue
            cues.append(Cue(start=start / US, end=(start + dur) / US, text=text))

    if not cues:
        raise ValueError(
            f"{path}: found no text segments. If this draft predates caption "
            "support, export SRT from CapCut instead (Captions > Export)."
        )
    cues.sort(key=lambda c: c.start)
    return cues, warnings
