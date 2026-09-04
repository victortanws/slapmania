"""Install presets INTO Final Cut Pro — the "make it appear in FCP" layer.

Three mechanisms, all file-system based (FCP reads these folders directly):

1. Motion templates  -> ~/Movies/Motion Templates.localized/Titles/<Pack>/
   (FCP also accepts the non-localized "Motion Templates" name; we use
   whichever already exists). Templates appear in the Titles browser.
2. Text Style presets -> ~/Library/Application Support/Motion/Library/Text Styles/
   Each .molo file is one entry in FCP's Text inspector style dropdown.
3. .fcpxml imports — opened via `open -a "Final Cut Pro"`, which launches
   FCP straight into XML import (double-clicking a .fcpxml does the same).

Plus the fix that makes generated XML land clean on ANY install:
`scan_fcp_effects` walks the Final Cut app bundle itself and derives the
exact uid for every built-in template we reference (uids are the template's
path relative to the bundle's Templates root, prefixed with "..." — that is
the literal format FCP emits). `patch_fcpxml_uids` then rewrites a pack's
files in place, so nothing imports as a red "missing effect" placeholder.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
from pathlib import Path
from typing import Optional

from .validate import validate

FCP_APP = "/Applications/Final Cut Pro.app"

# Template filenames we reference -> our effects-registry keys.
_BUNDLE_WANTED = {
    "Text.moti": "basic_title",
    "Shapes.motn": "shapes",
    "Placeholder.motn": "placeholder",
    "Drop Shadow.moef": "drop_shadow",
}
# Which uid maps onto which <effect name=...> in generated files.
_EFFECT_NAMES = {"basic_title": "Text", "shapes": "Shapes",
                 "placeholder": "Placeholder", "drop_shadow": "Drop Shadow"}


def scan_fcp_effects(app_path: str | Path = FCP_APP) -> dict[str, dict[str, str]]:
    """Harvest exact built-in template uids from a Final Cut Pro bundle.

    Returns registry entries for every wanted template found. Empty dict if
    the bundle (or its Templates root) is missing — callers decide whether
    that is fatal.
    """
    app = Path(app_path).expanduser()
    roots = [app / "Contents" / "Resources" / "Templates.localized",
             app / "Contents" / "Resources" / "Templates"]
    root = next((r for r in roots if r.is_dir()), None)
    if root is None:
        return {}
    found: dict[str, dict[str, str]] = {}
    for f in root.rglob("*"):
        key = _BUNDLE_WANTED.get(f.name)
        if key and key not in found:
            rel = f.relative_to(root).as_posix()
            found[key] = {"name": _EFFECT_NAMES[key], "uid": ".../" + rel}
    return found


def patch_fcpxml_uids(path: str | Path, effects: dict[str, dict[str, str]]) -> int:
    """Rewrite <effect> uid attributes in one .fcpxml to the harvested values,
    matching by effect name. Byte-preserving outside the uid strings.
    Returns how many uids were changed."""
    by_name = {v["name"]: v["uid"] for v in effects.values()}
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    changed = 0

    def sub(m: re.Match) -> str:
        nonlocal changed
        name = m.group(2)
        uid = by_name.get(name)
        if uid is None or m.group(4) == uid:
            return m.group(0)
        changed += 1
        return f"{m.group(1)}{name}{m.group(3)}{uid}{m.group(5)}"

    new = re.sub(r'(<effect\b[^>]*\bname=")([^"]+)("[^>]*\buid=")([^"]*)(")', sub, text)
    if changed:
        p.write_text(new, encoding="utf-8")
        problems = validate(p)
        if problems:
            raise RuntimeError(f"{p}: broken after uid patch (bug): {problems}")
    return changed


# ------------------------------------------------------------- FCP folders

def motion_titles_dir(home: str | Path) -> Path:
    movies = Path(home).expanduser() / "Movies"
    for name in ("Motion Templates.localized", "Motion Templates"):
        if (movies / name).is_dir():
            return movies / name / "Titles"
    return movies / "Motion Templates.localized" / "Titles"


def text_styles_dir(home: str | Path) -> Path:
    return (Path(home).expanduser() / "Library" / "Application Support"
            / "Motion" / "Library" / "Text Styles")


# ----------------------------------------------------------------- install

def install_pack(pack_dir: str | Path, home: str | Path = Path.home(),
                 fcp_app: str | Path = FCP_APP,
                 open_sample: bool = False) -> list[str]:
    """Install a pack into Final Cut's preset locations. Returns a report
    (one line per action). Never partial-fails silently: every skipped step
    says why."""
    pack = Path(pack_dir).expanduser()
    if not pack.is_dir():
        raise FileNotFoundError(f"{pack} is not a pack directory")
    report: list[str] = []

    # 1. Re-validate everything we are about to hand to FCP.
    fcpxmls = sorted(pack.rglob("*.fcpxml"))
    bad = {str(f): validate(f) for f in fcpxmls if validate(f)}
    if bad:
        raise RuntimeError(f"pack failed validation, not installing: {bad}")
    report.append(f"validated {len(fcpxmls)} fcpxml files")

    # 2. Fit the files to THIS machine's Final Cut.
    harvested = scan_fcp_effects(fcp_app)
    if harvested:
        patched = sum(patch_fcpxml_uids(f, harvested) for f in fcpxmls)
        report.append(f"Final Cut found — matched {len(harvested)} built-in template uids"
                      + (f", patched {patched} references" if patched else " (already exact)"))
        local = pack / "effects.local.json"
        merged = {}
        if local.exists():
            merged = json.loads(local.read_text(encoding="utf-8"))
        merged.update(harvested)
        local.write_text(json.dumps(merged, indent=2) + "\n", encoding="utf-8")
    else:
        report.append(f"Final Cut app not found at {fcp_app} — uids left as shipped "
                      "(imports still work; effects may need one learn-effects pass)")

    # 3. Motion templates -> Titles browser.
    motion_src = pack / "motion"
    if motion_src.is_dir() and any(motion_src.iterdir()):
        dest_root = motion_titles_dir(home) / pack.name.split("-v")[0]
        dest_root.mkdir(parents=True, exist_ok=True)
        n = 0
        for tpl in sorted(p for p in motion_src.iterdir() if p.is_dir()):
            dest = dest_root / tpl.name
            if dest.exists():
                shutil.rmtree(dest)
            shutil.copytree(tpl, dest)
            n += 1
        report.append(f"installed {n} Motion titles -> {dest_root} (Titles browser)")
    else:
        report.append("no motion/ folder in pack — Titles-browser tier not included")

    # 4. Text Style presets -> the Text inspector dropdown.
    styles_src = pack / "text-styles"
    if styles_src.is_dir() and any(styles_src.glob("*.molo")):
        dest = text_styles_dir(home)
        dest.mkdir(parents=True, exist_ok=True)
        n = 0
        for molo in sorted(styles_src.glob("*.molo")):
            shutil.copy2(molo, dest / molo.name)
            n += 1
        report.append(f"installed {n} Text Style presets -> {dest}")
    else:
        report.append("no text-styles/ folder in pack — run `fcpkit textstyles` "
                      "after saving one style in FCP to generate them")

    # 5. Hand the samples to FCP (macOS `open` launches straight into import).
    if open_sample:
        sample = next((f for f in fcpxmls if f.parent.name == "presets"), fcpxmls[0] if fcpxmls else None)
        if sample and shutil.which("open"):
            subprocess.run(["open", "-a", "Final Cut Pro", str(sample)], check=False)
            report.append(f"opened {sample.name} in Final Cut (import dialog)")
        elif sample:
            report.append(f"`open` unavailable — in FCP use File > Import > XML on {sample}")
    return report


# ------------------------------------------------- text style (.molo) tier

def clone_textstyles(template: str | Path, presets, out_dir: str | Path,
                     prefix: str = "SlapCaps") -> list[Path]:
    """Clone one FCP-saved Text Style (.molo) into a recolored copy per
    preset — the same calibrated, byte-preserving approach as motionize.

    Calibration (once): in FCP, style any title, then Text inspector ->
    style dropdown -> "Save All Format and Appearance Attributes…". That
    writes the template .molo this function feeds on.
    """
    from .motionize import recolor_ozml
    template = Path(template).expanduser()
    src = template.read_text(encoding="utf-8")
    out = Path(out_dir).expanduser()
    out.mkdir(parents=True, exist_ok=True)
    made: list[Path] = []
    any_hits = False
    for name, style in presets.items():
        colors = {}
        if style.font_color is not None:
            colors["Face Color"] = style.font_color
            colors["Color"] = style.font_color
        if style.stroke_color is not None and style.stroke_width:
            colors["Outline Color"] = style.stroke_color
        if style.shadow_color is not None:
            colors["Drop Shadow Color"] = style.shadow_color
        text, hits = recolor_ozml(src, colors)
        if hits:
            any_hits = True
        dest = out / f"{prefix} {name}.molo"
        dest.write_text(text, encoding="utf-8")
        made.append(dest)
    if not any_hits:
        for d in made:
            d.unlink()
        raise ValueError(
            f"{template.name}: found no color parameters to retarget — save the "
            "calibration style from FCP's Text inspector (not Motion) and retry, "
            "or pass a different template."
        )
    return made


def newest_molo(home: str | Path) -> Optional[Path]:
    d = text_styles_dir(home)
    molos = sorted(d.glob("*.molo"), key=lambda p: p.stat().st_mtime) if d.is_dir() else []
    return molos[-1] if molos else None
