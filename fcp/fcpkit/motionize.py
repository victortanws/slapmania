"""Stamp out Motion title templates (.moti) — the premium preset tier.

Straight talk about what's possible: a `.moti` is Motion's OZML scene format.
It is undocumented and NOT safely authorable from scratch outside Motion —
but it IS safely *parameterizable*: given one master caption title authored
once in Motion (with a text layer whose Face/Outline/Glow colors you intend
to vary), we clone the template folder per preset and rewrite only the color
parameter values, byte-for-byte preserving everything else. Same philosophy
as `learn-effects`: your Mac provides ground truth once; the toolkit
multiplies it.

Workflow on the Mac:
1. In Motion: File > New > Final Cut Title, style one caption, save as e.g.
   "SlapCaps Master" (lands in ~/Movies/Motion Templates/Titles/<Category>/).
2. `python3 -m fcpkit motionize "~/Movies/Motion Templates/Titles/SlapCaps/SlapCaps Master"`
   → sibling folders "SlapCaps tiktok", "SlapCaps hormozi", … each recolored.
3. They appear in FCP's Titles browser immediately. Zip the Category folder —
   that zip is the sellable Motion tier (installer: unzip into
   ~/Movies/Motion Templates/Titles/).

Only `value="..."` numbers inside recognized color parameter blocks are
touched. If the master has no matching parameter names, we say so instead of
guessing.
"""
from __future__ import annotations

import re
import shutil
from pathlib import Path
from typing import Optional

from .brand import branded_presets
from .styles import RGBA, Style

# Motion parameter block names -> which Style field supplies the color.
DEFAULT_COLOR_MAP = {
    "Face Color": "font_color",
    "Color": "font_color",           # some rigs publish the face as just "Color"
    "Outline Color": "stroke_color",
    "Drop Shadow Color": "shadow_color",
    "Glow Color": "highlight_color",
    "Highlight Color": "highlight_color",
}

_OPEN = re.compile(r'<parameter\b[^>]*\bname="([^"]+)"')
_CHANNEL = re.compile(r'(<parameter\b[^>]*\bname="(Red|Green|Blue|Opacity|Alpha)"[^>]*\bvalue=")([^"]*)(")')
_SELFCLOSE = re.compile(r'/>\s*$')


def recolor_ozml(text: str, colors: dict[str, RGBA]) -> tuple[str, list[str]]:
    """Rewrite Red/Green/Blue/Opacity channel values inside named color
    parameter blocks. Returns (new_text, names_actually_recolored).

    Line-based with a depth counter so nested <parameter> blocks are handled
    and every untouched line stays byte-identical (Motion is picky; we do not
    round-trip through an XML parser).
    """
    lines = text.split("\n")
    out: list[str] = []
    hits: list[str] = []
    target: Optional[RGBA] = None
    target_name = ""
    depth = 0

    for line in lines:
        m = _OPEN.search(line)
        if target is None and m and m.group(1) in colors:
            # A self-closing color parameter has no channels to rewrite; skip.
            if not _SELFCLOSE.search(line.strip()):
                target = colors[m.group(1)]
                target_name = m.group(1)
                depth = 0
        if target is not None:
            def sub(mm: re.Match) -> str:
                chan = mm.group(2)
                idx = {"Red": 0, "Green": 1, "Blue": 2, "Opacity": 3, "Alpha": 3}[chan]
                return f"{mm.group(1)}{round(target[idx], 6):g}{mm.group(4)}"
            new_line, n = _CHANNEL.subn(sub, line)
            if n and target_name not in hits:
                hits.append(target_name)
            out.append(new_line)
            # Track block depth: opens minus closes on this line.
            opens = len(re.findall(r"<parameter\b(?![^>]*/>)", line))
            closes = line.count("</parameter>")
            depth += opens - closes
            if depth <= 0:
                target = None
        else:
            out.append(line)
    return "\n".join(out), hits


def motionize(master: str | Path, out_parent: Optional[str | Path] = None,
              presets: Optional[dict[str, Style]] = None, brand: Optional[dict] = None,
              color_map: Optional[dict[str, str]] = None,
              name_prefix: Optional[str] = None) -> list[Path]:
    """Clone a master Motion title folder into one recolored copy per preset."""
    master = Path(master).expanduser()
    if master.is_file():
        master = master.parent
    motis = list(master.glob("*.moti"))
    if len(motis) != 1:
        raise ValueError(f"{master}: expected exactly one .moti in the template folder, "
                         f"found {len(motis)}")
    color_map = color_map or DEFAULT_COLOR_MAP
    presets = presets or branded_presets(brand)
    out_parent = Path(out_parent).expanduser() if out_parent else master.parent
    prefix = name_prefix or master.name.replace(" Master", "").strip()

    src_text = motis[0].read_text(encoding="utf-8")
    made: list[Path] = []
    missing_all = True
    for pname, style in presets.items():
        colors: dict[str, RGBA] = {}
        for param_name, field in color_map.items():
            val = getattr(style, field, None)
            if val is not None:
                colors[param_name] = val
        new_text, hits = recolor_ozml(src_text, colors)
        if hits:
            missing_all = False
        dest = out_parent / f"{prefix} {pname}"
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(master, dest)
        old_moti = dest / motis[0].name
        old_moti.unlink()
        (dest / f"{dest.name}.moti").write_text(new_text, encoding="utf-8")
        made.append(dest)
    if missing_all:
        for d in made:
            shutil.rmtree(d)
        raise ValueError(
            f"{motis[0].name}: found none of the color parameters "
            f"{sorted(color_map)} — open the master in Motion and check the "
            "parameter names, or pass a custom --map."
        )
    return made
