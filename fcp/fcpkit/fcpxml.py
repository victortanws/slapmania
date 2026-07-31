"""FCPXML writers: styled caption titles, real FCP captions, and PIP projects.

Everything here emits FCPXML 1.10 (imports into FCP 10.6+ and FCP 11).
Import via File > Import > XML, then copy the generated connected clips onto
your own timeline (they keep their offsets when pasted at the same timecode).
"""
from __future__ import annotations

import json
import os
import xml.etree.ElementTree as ET
from fractions import Fraction
from pathlib import Path
from typing import Optional

from .cues import Cue, Doc
from .styles import RGBA, Style, get_style
from .timing import Timebase, fmt_time

# ------------------------------------------------------------------ effects
#
# FCPXML references built-in effects by uid. These uids are stable across
# recent FCP versions, but the ground truth lives in YOUR install: run
# `fcpkit learn-effects <export.fcpxml>` on any timeline exported from your
# Final Cut with the effect applied once, and the harvested uids are saved to
# effects.local.json and override these defaults forever after.

DEFAULT_EFFECTS: dict[str, dict[str, str]] = {
    "basic_title": {
        "name": "Text",
        "uid": ".../Titles.localized/Basic Text.localized/Text.localized/Text.moti",
    },
    "shape_mask": {"name": "Shape Mask", "uid": "FFSuperEllipseMask"},
    "drop_shadow": {
        "name": "Drop Shadow",
        "uid": ".../Effects.localized/Basics.localized/Drop Shadow.localized/Drop Shadow.moef",
    },
    "placeholder": {
        "name": "Placeholder",
        "uid": ".../Generators.localized/Elements.localized/Placeholder.localized/Placeholder.motn",
    },
}

LOCAL_EFFECTS_FILE = "effects.local.json"


def load_effects(local_path: Optional[str] = None) -> dict[str, dict[str, str]]:
    effects = {k: dict(v) for k, v in DEFAULT_EFFECTS.items()}
    path = local_path or os.environ.get("FCPKIT_EFFECTS") or LOCAL_EFFECTS_FILE
    p = Path(path)
    if p.exists():
        effects.update(json.loads(p.read_text(encoding="utf-8")))
    return effects


def learn_effects(fcpxml_path: str | Path, save_to: str | Path = LOCAL_EFFECTS_FILE) -> dict[str, dict[str, str]]:
    """Harvest effect name->uid pairs from a real FCP export into effects.local.json."""
    tree = ET.parse(fcpxml_path)
    harvested: dict[str, dict[str, str]] = {}
    for eff in tree.getroot().iter("effect"):
        name, uid = eff.get("name"), eff.get("uid")
        if not name or not uid:
            continue
        key = name.lower().replace(" ", "_")
        # Map the common ones onto our registry keys.
        if name in ("Text", "Basic Title"):
            key = "basic_title"
        elif name == "Shape Mask":
            key = "shape_mask"
        elif name == "Drop Shadow":
            key = "drop_shadow"
        elif name == "Placeholder":
            key = "placeholder"
        harvested[key] = {"name": name, "uid": uid}
    existing: dict[str, dict[str, str]] = {}
    p = Path(save_to)
    if p.exists():
        existing = json.loads(p.read_text(encoding="utf-8"))
    existing.update(harvested)
    p.write_text(json.dumps(existing, indent=2) + "\n", encoding="utf-8")
    return harvested


# ------------------------------------------------------------------ helpers

def _rgba(c: RGBA) -> str:
    return f"{round(c[0], 4)} {round(c[1], 4)} {round(c[2], 4)} {round(c[3], 4)}"


def _num(x: float) -> str:
    return f"{x:g}"


class _Builder:
    """Shared skeleton: resources + library/event/project/sequence/spine."""

    def __init__(self, tb: Timebase, width: int, height: int, project_name: str,
                 effects: Optional[dict[str, dict[str, str]]] = None):
        self.tb = tb
        self.width, self.height = width, height
        self.effects = effects or load_effects()
        self._rid = 0
        self._tsid = 0
        self._effect_ids: dict[str, str] = {}

        self.root = ET.Element("fcpxml", version="1.10")
        self.resources = ET.SubElement(self.root, "resources")
        self.fmt_id = self._next_rid()
        ET.SubElement(self.resources, "format", id=self.fmt_id,
                      name="FFVideoFormatRateUndefined",
                      frameDuration=tb.frame_duration_str(),
                      width=str(width), height=str(height),
                      colorSpace="1-1-1 (Rec. 709)")
        lib = ET.SubElement(self.root, "library")
        event = ET.SubElement(lib, "event", name="fcpkit")
        project = ET.SubElement(event, "project", name=project_name)
        self.sequence = ET.SubElement(project, "sequence", format=self.fmt_id,
                                      tcStart="0s", tcFormat="NDF",
                                      audioLayout="stereo", audioRate="48k")
        self.spine = ET.SubElement(self.sequence, "spine")

    def _next_rid(self) -> str:
        self._rid += 1
        return f"r{self._rid}"

    def next_ts_id(self) -> str:
        self._tsid += 1
        return f"ts{self._tsid}"

    def effect_resource(self, key: str) -> str:
        """Add (once) the effect resource for a registry key; return its id."""
        if key not in self._effect_ids:
            eff = self.effects[key]
            rid = self._next_rid()
            ET.SubElement(self.resources, "effect", id=rid, name=eff["name"], uid=eff["uid"])
            self._effect_ids[key] = rid
        return self._effect_ids[key]

    def asset_resource(self, media_path: str, duration: Fraction, name: str) -> str:
        rid = self._next_rid()
        src = Path(media_path).absolute().as_uri() if not media_path.startswith("file://") else media_path
        asset = ET.SubElement(self.resources, "asset", id=rid, name=name, start="0s",
                              duration=fmt_time(duration), hasVideo="1", hasAudio="1",
                              format=self.fmt_id)
        ET.SubElement(asset, "media-rep", kind="original-media", src=src)
        return rid

    def set_duration(self, total: Fraction) -> None:
        self.sequence.set("duration", fmt_time(total))

    def tostring(self) -> str:
        ET.indent(self.root, space="    ")
        body = ET.tostring(self.root, encoding="unicode")
        return '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE fcpxml>\n\n' + body + "\n"

    def write(self, path: str | Path) -> None:
        Path(path).write_text(self.tostring(), encoding="utf-8")


def _text_style_attrs(style: Style) -> dict[str, str]:
    attrs = {
        "font": style.font,
        "fontSize": _num(style.font_size),
        "fontFace": style.font_face,
        "fontColor": _rgba(style.font_color),
        "alignment": style.alignment,
        "lineSpacing": _num(style.line_spacing),
    }
    if style.kerning:
        attrs["kerning"] = _num(style.kerning)
    if style.stroke_color and style.stroke_width:
        attrs["strokeColor"] = _rgba(style.stroke_color)
        # Negative width = outline drawn behind the fill (the CapCut look).
        attrs["strokeWidth"] = _num(-abs(style.stroke_width))
    if style.shadow_color:
        attrs["shadowColor"] = _rgba(style.shadow_color)
        attrs["shadowOffset"] = f"{_num(style.shadow_offset[0])} {_num(style.shadow_offset[1])}"
        attrs["shadowBlurRadius"] = _num(style.shadow_blur)
    return attrs


def _add_transform(title: ET.Element, style: Style, tb: Timebase) -> None:
    needs = style.position != (0.0, 0.0) or style.rotation or style.pop_in
    if not needs:
        return
    attrs = {}
    if style.position != (0.0, 0.0):
        attrs["position"] = f"{_num(style.position[0])} {_num(style.position[1])}"
    if style.rotation:
        attrs["rotation"] = _num(style.rotation)
    xf = ET.Element("adjust-transform", attrs)
    if style.pop_in:
        fd = tb.frame_duration
        param = ET.SubElement(xf, "param", name="scale")
        kfa = ET.SubElement(param, "keyframeAnimation")
        for frames, s in ((0, 0.82), (2, 1.05), (4, 1.0)):
            ET.SubElement(kfa, "keyframe", time=fmt_time(fd * frames), value=f"{s} {s}")
    title.insert(0, xf)


# ------------------------------------------------------------ titles writer

def build_titles(doc: Doc, project_name: str = "Captions",
                 lang: Optional[str] = None,
                 effects: Optional[dict[str, dict[str, str]]] = None) -> _Builder:
    """Master doc -> a project whose spine gap carries one styled title per cue.

    Styles with karaoke=True expand each cue into per-word titles where the
    active word wears the highlight color. Cues with emphasized words get
    mixed style ranges inside a single title.
    """
    tb = Timebase.from_fps(doc.fps)
    b = _Builder(tb, doc.width, doc.height, project_name, effects)
    title_ref = b.effect_resource("basic_title")

    cues = doc.cues_for_lang(lang)
    total = tb.snap(max((c.end for c in cues), default=1.0)) + tb.frame_duration
    b.set_duration(total)
    gap = ET.SubElement(b.spine, "gap", name="Captions", offset="0s", start="0s",
                        duration=fmt_time(total))

    for src_cue in cues:
        style = get_style(src_cue.style or doc.default_style).scaled(doc.height)
        if style.karaoke:
            for i, word in enumerate(src_cue.ensure_words()):
                _emit_title(b, gap, title_ref, src_cue, style,
                            t0=word.start, t1=word.end, active_word=i)
        else:
            _emit_title(b, gap, title_ref, src_cue, style,
                        t0=src_cue.start, t1=src_cue.end, active_word=None)
    return b


def _emit_title(b: _Builder, gap: ET.Element, title_ref: str, cue: Cue, style: Style,
                t0: float, t1: float, active_word: Optional[int]) -> None:
    tb = b.tb
    offset, end = tb.snap(t0), tb.snap(t1)
    if end <= offset:
        end = offset + tb.frame_duration
    label = cue.text if len(cue.text) < 60 else cue.text[:57] + "..."
    title = ET.SubElement(gap, "title", ref=title_ref, lane="1",
                          offset=fmt_time(offset), duration=fmt_time(end - offset),
                          name=label)
    text_el = ET.SubElement(title, "text")

    def styled_run(text: str, highlighted: bool) -> None:
        ts_id = b.next_ts_id()
        run = ET.SubElement(text_el, "text-style-ref", ref=ts_id)
        run.text = text.upper() if style.uppercase else text
        attrs = _text_style_attrs(style)
        if highlighted:
            attrs["fontColor"] = _rgba(style.highlight_color)
        tsd = ET.SubElement(title, "text-style-def", id=ts_id)
        ET.SubElement(tsd, "text-style", attrs)

    words = cue.ensure_words() if (active_word is not None or any(w.emphasize for w in cue.words)) else None
    if words is None:
        styled_run(cue.text, highlighted=False)
    else:
        # Group consecutive words with the same highlight state into runs.
        runs: list[tuple[str, bool]] = []
        for i, w in enumerate(words):
            hot = (i == active_word) or w.emphasize
            token = w.text + (" " if i < len(words) - 1 else "")
            if runs and runs[-1][1] == hot:
                runs[-1] = (runs[-1][0] + token, hot)
            else:
                runs.append((token, hot))
        for text, hot in runs:
            styled_run(text, hot)

    _add_transform(title, style, tb)


# ---------------------------------------------------------- captions writer

def build_captions(doc: Doc, langs: list[str], project_name: str = "FCP Captions",
                   effects: Optional[dict[str, dict[str, str]]] = None) -> _Builder:
    """Master doc -> real FCP caption lanes (ITT roles), one per language.

    These import as native captions: they show up in FCP's caption editor,
    export to .itt / embedded CC, and are toggled per-language in the
    timeline index. Timings are identical across languages by construction.
    """
    tb = Timebase.from_fps(doc.fps)
    b = _Builder(tb, doc.width, doc.height, project_name, effects)
    total = tb.snap(max((c.end for c in doc.cues), default=1.0)) + tb.frame_duration
    b.set_duration(total)
    gap = ET.SubElement(b.spine, "gap", name="Captions", offset="0s", start="0s",
                        duration=fmt_time(total))
    for lang in langs:
        for cue in doc.cues_for_lang(lang):
            offset, end = tb.snap(cue.start), tb.snap(cue.end)
            if end <= offset:
                end = offset + tb.frame_duration
            cap = ET.SubElement(gap, "caption", role=f"iTT?captionFormat=ITT.{lang}",
                                offset=fmt_time(offset), duration=fmt_time(end - offset),
                                name=cue.text[:40])
            ts_id = b.next_ts_id()
            text_el = ET.SubElement(cap, "text", placement="bottom")
            run = ET.SubElement(text_el, "text-style-ref", ref=ts_id)
            run.text = cue.text
            tsd = ET.SubElement(cap, "text-style-def", id=ts_id)
            ET.SubElement(tsd, "text-style", font=".AppleSystemUIFont", fontSize="13",
                          fontColor="1 1 1 1", backgroundColor="0 0 0 1")
    return b


# --------------------------------------------------------------- PIP writer

PIP_CORNERS = {
    # Fractions of half-frame; converted to px at build time.
    "top-right": (0.58, 0.58),
    "top-left": (-0.58, 0.58),
    "bottom-right": (0.58, -0.55),
    "bottom-left": (-0.58, -0.55),
}


def build_pip(width: int = 1080, height: int = 1920, fps: float = 29.97,
              duration_s: float = 20.0, corner: str = "top-right",
              scale: float = 0.32, rotation: float = -2.0, roundness: float = 0.55,
              media: Optional[str] = None, project_name: str = "PIP Kit",
              effects: Optional[dict[str, dict[str, str]]] = None) -> _Builder:
    """A ready-made picture-in-picture block: scaled + cornered + rounded
    corners (Shape Mask) + drop shadow, over a full-frame base layer.

    With --media the PIP layer references your file; otherwise both layers are
    FCP Placeholder generators — drop your own footage in their place and the
    applied effects survive (or copy-paste attributes with ⌥⌘V).
    """
    tb = Timebase.from_fps(fps)
    b = _Builder(tb, width, height, project_name, effects)
    total = tb.snap(duration_s)
    b.set_duration(total)

    placeholder_ref = b.effect_resource("placeholder")
    base = ET.SubElement(b.spine, "video", ref=placeholder_ref, offset="0s", start="0s",
                         duration=fmt_time(total), name="Main (replace me)")

    if media:
        asset_ref = b.asset_resource(media, total, Path(media).stem)
        pip = ET.SubElement(base, "asset-clip", ref=asset_ref, lane="1", offset="0s",
                            duration=fmt_time(total), name="PIP")
    else:
        pip = ET.SubElement(base, "video", ref=placeholder_ref, lane="1", offset="0s",
                            start="0s", duration=fmt_time(total), name="PIP (replace me)")

    fx, fy = PIP_CORNERS[corner]
    px, py = fx * width / 2, fy * height / 2
    ET.SubElement(pip, "adjust-transform",
                  position=f"{_num(px)} {_num(py)}",
                  scale=f"{_num(scale)} {_num(scale)}",
                  rotation=_num(rotation))

    mask = ET.SubElement(pip, "filter-video", ref=b.effect_resource("shape_mask"),
                         name=b.effects["shape_mask"]["name"])
    ET.SubElement(mask, "param", name="Radius",
                  value=f"{_num(width * 0.47)} {_num(height * 0.47)}")
    ET.SubElement(mask, "param", name="Curvature", value=_num(roundness))
    ET.SubElement(mask, "param", name="Feather", value="0")

    shadow = ET.SubElement(pip, "filter-video", ref=b.effect_resource("drop_shadow"),
                           name=b.effects["drop_shadow"]["name"])
    ET.SubElement(shadow, "param", name="Opacity", value="0.55")
    ET.SubElement(shadow, "param", name="Blur", value="14")
    ET.SubElement(shadow, "param", name="Distance", value="18")
    return b
