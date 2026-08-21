"""Caption style presets.

All sizes/positions are authored for a 1080x1920 vertical frame and scaled by
frame height at emit time, so the same preset reads correctly on a 1920x1080
horizontal timeline. Colors are (r, g, b, a) floats 0-1 as FCPXML wants them.
"""
from __future__ import annotations

from dataclasses import dataclass, field, replace
from typing import Optional

RGBA = tuple[float, float, float, float]


def hex_rgba(hexstr: str, alpha: float = 1.0) -> RGBA:
    """#RRGGBB or #RRGGBBAA (the designer exports 8-digit when alpha < 1)."""
    h = hexstr.lstrip("#")
    if len(h) == 8:
        alpha = round(int(h[6:8], 16) / 255, 4)
    return (int(h[0:2], 16) / 255, int(h[2:4], 16) / 255, int(h[4:6], 16) / 255, alpha)


@dataclass(frozen=True)
class Style:
    name: str
    blurb: str
    font: str = "Helvetica Neue"
    font_face: str = "Bold"
    font_size: float = 96           # px at 1920-high reference frame
    font_color: RGBA = (1, 1, 1, 1)
    stroke_color: Optional[RGBA] = (0, 0, 0, 1)
    stroke_width: float = 3.0       # FCPXML uses negative width for outline-behind-fill
    shadow_color: Optional[RGBA] = (0, 0, 0, 0.75)
    shadow_offset: tuple[float, float] = (5, 315)  # (distance, angle°) — FCP convention
    shadow_blur: float = 10.0
    alignment: str = "center"
    uppercase: bool = True
    line_spacing: float = -8.0
    kerning: float = 0.0
    position: tuple[float, float] = (0.0, -560.0)  # px from frame center at 1920-high ref
    rotation: float = 0.0           # degrees; + is counter-clockwise in FCP
    highlight_color: RGBA = hex_rgba("#FFD400")     # emphasized/spoken-word color
    upcoming_color: Optional[RGBA] = None           # fill-mode color for words not yet spoken
    pop_in: bool = False            # 4-frame scale pop on entry
    karaoke: bool = False           # emit word-by-word highlight titles
    karaoke_mode: str = "word"      # "word" = only active word lit; "fill" = spoken words stay lit
    karaoke_display: str = "line"   # "line" = full line visible; "word" = one word at a time
    box_color: Optional[RGBA] = None  # filled box behind the text (Shapes generator layer)
    box_roundness: float = 0.35     # corner roundness param passed to the Shapes generator
    box_pad: tuple[float, float] = (34.0, 22.0)  # px padding (x, y) at 1920-high reference

    def scaled(self, height: int) -> "Style":
        """Scale reference-frame sizes/positions to the target frame height."""
        f = height / 1920
        return replace(
            self,
            font_size=self.font_size * f,
            position=(self.position[0] * f, self.position[1] * f),
            shadow_offset=(self.shadow_offset[0] * f, self.shadow_offset[1]),
            stroke_width=self.stroke_width * f if self.stroke_width else self.stroke_width,
            box_pad=(self.box_pad[0] * f, self.box_pad[1] * f),
        )


PRESETS: dict[str, Style] = {}


def _add(s: Style) -> None:
    PRESETS[s.name] = s


_add(Style(
    name="tiktok",
    blurb="Big bold white, black outline, soft shadow, pop-in. The CapCut default look.",
    font_size=100, stroke_width=4, pop_in=True,
))
_add(Style(
    name="hormozi",
    blurb="Word-by-word karaoke, ALL CAPS, emphasized word flips yellow. Retention-bait.",
    font="Futura", font_face="Bold", font_size=104,
    stroke_width=5, karaoke=True, pop_in=True,
    highlight_color=hex_rgba("#FFD400"),
))
_add(Style(
    name="karaoke",
    blurb="Whole line visible, current word tinted brand-red as the audio reaches it.",
    font_size=88, karaoke=True, uppercase=False,
    highlight_color=hex_rgba("#FF3B30"),
))
_add(Style(
    name="clean",
    blurb="Sentence-case subtitle, no outline, gentle shadow. YouTube long-form default.",
    font_face="Medium", font_size=64, uppercase=False,
    stroke_color=None, stroke_width=0, shadow_blur=6, shadow_color=(0, 0, 0, 0.6),
    position=(0.0, -700.0),
))
_add(Style(
    name="lowerthird",
    blurb="Small left-anchored label for names/locations. Pairs with the PIP presets.",
    font_face="Medium", font_size=54, uppercase=False, alignment="left",
    stroke_color=None, stroke_width=0,
    position=(-380.0, -760.0),
))
_add(Style(
    name="submagic",
    blurb="Colored follow-text on a filled box: spoken words one color, upcoming another.",
    font_size=84, uppercase=False, stroke_color=None, stroke_width=0,
    shadow_color=None, karaoke=True, karaoke_mode="fill",
    font_color=hex_rgba("#FFD400"),          # fallback if fill colors unset
    highlight_color=hex_rgba("#FFD400"),     # spoken / current words
    upcoming_color=hex_rgba("#FFFFFF"),      # words still coming
    box_color=hex_rgba("#E62117"), box_roundness=0.3,
))
_add(Style(
    name="oneword",
    blurb="One giant word at a time on a colored box — the CapCut one-word look.",
    font_size=140, karaoke=True, karaoke_display="word", pop_in=True,
    stroke_color=None, stroke_width=0, shadow_color=(0, 0, 0, 0.5), shadow_blur=14,
    highlight_color=hex_rgba("#FFFFFF"),     # the active word IS the text
    box_color=hex_rgba("#E62117"), box_roundness=0.4, box_pad=(46.0, 30.0),
    position=(0.0, -430.0),
))
_add(Style(
    name="sticker",
    blurb="Heavy outline, tilted 3° like a slapped-on sticker. For punchlines.",
    font_size=112, stroke_width=7, rotation=-3.0, pop_in=True,
    highlight_color=hex_rgba("#34C759"),
))


def load_custom_presets(path: str | None = None) -> list[str]:
    """Merge user-designed presets (from designer.html or hand-written JSON)
    into the registry. Format — presets.local.json:

        { "my-look": { "base": "submagic", "box_color": "#0A84FF",
                       "font_size": "96", "rotation": "-2" } }

    Values are strings and coerced exactly like CLI --set overrides, so the
    designer, the CLI and this file all speak one dialect. Auto-loaded by the
    CLI from ./presets.local.json or $FCPKIT_PRESETS.
    """
    import json as _json
    import os as _os
    from pathlib import Path as _Path
    p = _Path(path or _os.environ.get("FCPKIT_PRESETS") or "presets.local.json")
    if not p.exists():
        return []
    data = _json.loads(p.read_text(encoding="utf-8"))
    loaded = []
    for name, fields in data.items():
        fields = dict(fields)
        base = get_style(fields.pop("base", "tiktok"))
        style = with_overrides(base, {k: str(v) for k, v in fields.items()})
        PRESETS[name] = replace(style, name=name,
                                blurb=fields.get("blurb", f"custom (base: {base.name})"))
        loaded.append(name)
    return loaded


def get_style(name: str) -> Style:
    try:
        return PRESETS[name]
    except KeyError:
        raise KeyError(f"unknown style {name!r}; available: {', '.join(sorted(PRESETS))}") from None


def with_overrides(style: Style, overrides: dict[str, str]) -> Style:
    """Apply CLI --set key=value overrides with light type coercion."""
    kwargs = {}
    for key, val in overrides.items():
        if not hasattr(style, key):
            raise KeyError(f"style has no field {key!r}")
        cur = getattr(style, key)
        if key.endswith("_color"):
            kwargs[key] = hex_rgba(val)
        elif key in ("position", "shadow_offset", "box_pad"):
            x, y = val.split(",")
            kwargs[key] = (float(x), float(y))
        elif isinstance(cur, bool):
            kwargs[key] = val.lower() in ("1", "true", "yes", "on")
        elif isinstance(cur, (int, float)):
            kwargs[key] = float(val)
        else:
            kwargs[key] = val
    return replace(style, **kwargs)
