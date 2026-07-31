"""Translate captions while keeping timing byte-for-byte identical.

The master doc owns timing; a translation is just a parallel list of strings,
one per cue. Three ways to fill it:

- auto:      Claude API (needs ANTHROPIC_API_KEY). Translates in context, told
             to keep each line roughly the same length so it fits the same
             on-screen window.
- worksheet: writes a TSV (index, start, end, source, empty target) you can
             fill with any tool/human, then `apply` merges it back.
- apply:     merge a completed worksheet back into the master doc.
"""
from __future__ import annotations

import csv
import io
import json
import os
import urllib.request
from pathlib import Path

from .cues import Doc

API_URL = "https://api.anthropic.com/v1/messages"
MODEL = os.environ.get("FCPKIT_MODEL", "claude-sonnet-5")
BATCH = 40  # cues per request; keeps context tight and JSON small


def make_worksheet(doc: Doc, lang: str) -> str:
    buf = io.StringIO()
    w = csv.writer(buf, delimiter="\t", lineterminator="\n")
    w.writerow(["index", "start", "end", doc.lang, lang])
    existing = doc.translations.get(lang, [])
    for i, cue in enumerate(doc.cues):
        tgt = existing[i] if i < len(existing) else ""
        w.writerow([i + 1, f"{cue.start:.3f}", f"{cue.end:.3f}", cue.text, tgt])
    return buf.getvalue()


def apply_worksheet(doc: Doc, lang: str, tsv_text: str) -> int:
    rows = list(csv.reader(io.StringIO(tsv_text), delimiter="\t"))
    if not rows:
        raise ValueError("empty worksheet")
    body = rows[1:] if rows[0] and rows[0][0] == "index" else rows
    texts = [""] * len(doc.cues)
    filled = 0
    for row in body:
        if len(row) < 5 or not row[0].strip().isdigit():
            continue
        idx = int(row[0]) - 1
        if 0 <= idx < len(texts) and row[4].strip():
            texts[idx] = row[4].strip()
            filled += 1
    missing = [i + 1 for i, t in enumerate(texts) if not t]
    if missing:
        raise ValueError(f"worksheet is missing translations for cues: {missing[:20]}")
    doc.translations[lang] = texts
    return filled


def auto_translate(doc: Doc, lang: str, tone: str = "natural, casual, spoken") -> list[str]:
    """Translate every cue via the Claude API, preserving cue boundaries."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Either export it, or use "
            "`fcpkit translate --mode worksheet` for a manual/offline flow."
        )
    out: list[str] = []
    for i in range(0, len(doc.cues), BATCH):
        chunk = doc.cues[i:i + BATCH]
        numbered = [{"n": j + 1, "text": c.text} for j, c in enumerate(chunk)]
        prompt = (
            f"Translate these {len(chunk)} video caption lines from '{doc.lang}' to '{lang}'.\n"
            f"Tone: {tone}. They are consecutive lines of one spoken video, so keep\n"
            "continuity between lines. Each translation must fit the same on-screen\n"
            "time window as its source, so keep each line's length within ~20% of the\n"
            "source line's character count — compress rather than overflow.\n"
            "Return ONLY a JSON array of objects like {\"n\": 1, \"text\": \"...\"},\n"
            "one per input line, same n values, no commentary.\n\n"
            + json.dumps(numbered, ensure_ascii=False)
        )
        req = urllib.request.Request(
            API_URL,
            data=json.dumps({
                "model": MODEL,
                "max_tokens": 8000,
                "messages": [{"role": "user", "content": prompt}],
            }).encode("utf-8"),
            headers={
                "content-type": "application/json",
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
            },
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        text = "".join(b.get("text", "") for b in data.get("content", []))
        text = text.strip()
        if text.startswith("```"):
            text = text.strip("`\n")
            if text.startswith("json"):
                text = text[4:]
        items = json.loads(text)
        by_n = {item["n"]: item["text"] for item in items}
        for j in range(len(chunk)):
            if j + 1 not in by_n:
                raise ValueError(f"model dropped line {i + j + 1}; re-run this batch")
            out.append(by_n[j + 1])
    doc.translations[lang] = out
    return out


def worksheet_path(master_path: str | Path, lang: str) -> Path:
    p = Path(master_path)
    return p.with_name(f"{p.stem}.{lang}.tsv")
