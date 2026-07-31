"""Brand kits: one JSON file that recolors/refonts every preset.

This is the mechanism that turns the preset library into sellable inventory:
the same six looks re-skinned per brand (yours, a client's, a niche pack like
"Podcast Pack" or "Fitness Pack") without touching code.

brandkit.json:
{
  "name": "VictorTan",
  "primary": "#FFD400",        // karaoke/emphasis highlight
  "secondary": "#34C759",      // sticker highlight
  "font": "Montserrat",        // optional; omit to keep preset fonts
  "font_face": "ExtraBold",
  "text": "#FFFFFF",           // optional fill override
  "outline": "#000000"         // optional stroke override
}
"""
from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path
from typing import Optional

from .styles import PRESETS, Style, hex_rgba


def load_brand(path: str | Path) -> dict:
    kit = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(kit, dict) or "name" not in kit:
        raise ValueError(f"{path}: a brand kit needs at least a \"name\"")
    return kit


def branded_style(style: Style, kit: dict) -> Style:
    kwargs = {}
    if kit.get("primary"):
        kwargs["highlight_color"] = hex_rgba(kit["primary"])
    # The sticker preset uses the secondary accent so packs get two voices.
    if kit.get("secondary") and style.name == "sticker":
        kwargs["highlight_color"] = hex_rgba(kit["secondary"])
    if kit.get("font"):
        kwargs["font"] = kit["font"]
        kwargs["font_face"] = kit.get("font_face", style.font_face)
    if kit.get("text"):
        kwargs["font_color"] = hex_rgba(kit["text"])
    if kit.get("outline") and style.stroke_color is not None:
        kwargs["stroke_color"] = hex_rgba(kit["outline"])
    return replace(style, **kwargs) if kwargs else style


def branded_presets(kit: Optional[dict]) -> dict[str, Style]:
    if not kit:
        return dict(PRESETS)
    return {name: branded_style(s, kit) for name, s in PRESETS.items()}
