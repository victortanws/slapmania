"""Build a distributable FCP preset pack — the sellable artifact.

A pack is a folder (and optional zip) a customer can use with zero tooling:

    <PackName>-v<version>/
      README.md            how to install & use (drag-import + Paste Attributes)
      LICENSE.txt          personal-use license (edit before selling)
      manifest.json        version + sha256 of every file (support/refund proof)
      preview.html         visual catalog of every preset (doubles as sales page)
      presets/<name>.fcpxml   one import per preset, sample cues incl. karaoke
      pip/pip-<corner>.fcpxml four PIP blocks (rounded + shadow)

Every .fcpxml is run through the validator before it lands in the pack.
"""
from __future__ import annotations

import hashlib
import html
import json
import shutil
import tempfile
from pathlib import Path
from typing import Optional

from . import fcpxml
from .brand import branded_presets
from .cues import Cue, Doc
from .styles import RGBA, Style
from .validate import validate

SAMPLE_CUES = [
    ("your captions but louder", 0.4, 2.2),
    ("this word hits different", 2.2, 4.4),
    ("smooth is fast", 4.7, 6.4),
]
EMPHASIS_WORD = "different"


def _css_rgba(c: Optional[RGBA]) -> str:
    if c is None:
        return "transparent"
    return f"rgba({round(c[0]*255)},{round(c[1]*255)},{round(c[2]*255)},{round(c[3], 3)})"


def _sample_doc(style_name: str, width: int, height: int, fps: float) -> Doc:
    cues = []
    for text, t0, t1 in SAMPLE_CUES:
        cue = Cue(start=t0, end=t1, text=text, style=style_name)
        for w in cue.ensure_words():
            if w.text == EMPHASIS_WORD:
                w.emphasize = True
        cues.append(cue)
    return Doc(fps=fps, width=width, height=height, default_style=style_name, cues=cues)


def build_pack(out_dir: str | Path, name: str = "SlapCaps", version: str = "0.1.0",
               brand: Optional[dict] = None, width: int = 1080, height: int = 1920,
               fps: float = 29.97, make_zip: bool = True,
               effects: Optional[dict] = None) -> Path:
    presets = branded_presets(brand)
    root = Path(out_dir) / f"{name}-v{version}"
    if root.exists():
        shutil.rmtree(root)
    (root / "presets").mkdir(parents=True)
    (root / "pip").mkdir()

    files: list[Path] = []
    for pname, style in presets.items():
        doc = _sample_doc(pname, width, height, fps)
        # Route the exporter through the branded style, not the stock preset.
        with _patched_presets(presets):
            b = fcpxml.build_titles(doc, project_name=f"{name} — {pname}", effects=effects)
        path = root / "presets" / f"{pname}.fcpxml"
        b.write(path)
        files.append(path)

    for corner in sorted(fcpxml.PIP_CORNERS):
        b = fcpxml.build_pip(width=width, height=height, fps=fps, corner=corner,
                             project_name=f"{name} PIP — {corner}", effects=effects)
        path = root / "pip" / f"pip-{corner}.fcpxml"
        b.write(path)
        files.append(path)

    problems = {str(p): validate(p) for p in files}
    bad = {k: v for k, v in problems.items() if v}
    if bad:
        raise RuntimeError(f"pack failed validation: {bad}")

    (root / "preview.html").write_text(render_preview(name, version, presets, brand),
                                       encoding="utf-8")
    (root / "README.md").write_text(_readme(name, version, presets), encoding="utf-8")
    (root / "LICENSE.txt").write_text(_license(name), encoding="utf-8")

    manifest = {
        "name": name, "version": version,
        "brand": (brand or {}).get("name"),
        "frame": f"{width}x{height}@{fps}",
        "files": {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
                  for p in sorted(root.rglob("*")) if p.is_file()},
    }
    (root / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    if make_zip:
        shutil.make_archive(str(root), "zip", root_dir=root.parent, base_dir=root.name)
    return root


class _patched_presets:
    """Temporarily swap the global preset registry for a branded one."""

    def __init__(self, presets: dict[str, Style]):
        self.presets = presets

    def __enter__(self):
        from . import styles
        self._saved = dict(styles.PRESETS)
        styles.PRESETS.clear()
        styles.PRESETS.update(self.presets)

    def __exit__(self, *exc):
        from . import styles
        styles.PRESETS.clear()
        styles.PRESETS.update(self._saved)


# ------------------------------------------------------------- preview page

def render_preview(name: str, version: str, presets: dict[str, Style],
                   brand: Optional[dict]) -> str:
    """The pack's catalog page — and the draft sales page.

    Deliberately single-theme dark: captions are judged against video black,
    so the preview surface is an edit-suite viewport, not a document. Each
    preset renders inside a 9:16 stage at its true on-frame position; the
    CSS look (fill, outline, shadow, rotation, highlight) is derived from the
    same Style objects that emit the FCPXML.
    """
    # Per-card footage blobs so the stages read as different shots, not clones.
    blob_hues = [28, 205, 335, 160, 262, 48, 12, 190]
    cards = []
    for idx, (pname, s) in enumerate(presets.items()):
        words = ["slapped", "into", "next", "week"]
        if s.uppercase:
            words = [w.upper() for w in words]
        hot = 2 if s.karaoke else -1  # karaoke: current word lit
        spans = []
        for i, w in enumerate(words):
            emphasized = (i == hot) or (not s.karaoke and i == 2 and pname in ("tiktok", "sticker"))
            color = _css_rgba(s.highlight_color) if emphasized else _css_rgba(s.font_color)
            spans.append(f'<span style="color:{color}">{html.escape(w)}</span>')
        stroke = (f"-webkit-text-stroke:{max(1, round(s.stroke_width * 0.5))}px {_css_rgba(s.stroke_color)};"
                  f"paint-order:stroke fill;" if s.stroke_color and s.stroke_width else "")
        shadow = (f"text-shadow:0 {round(s.shadow_blur * 0.35)}px {round(s.shadow_blur * 0.7)}px {_css_rgba(s.shadow_color)};"
                  if s.shadow_color else "")
        size = round(s.font_size * 0.30)
        # True vertical placement: style y is px from center of a 1920 frame.
        bottom_pct = max(4.0, min(60.0, (960 + s.position[1]) / 1920 * 100))
        align_css = ("justify-content:flex-start;text-align:left;padding-left:9%;"
                     if s.alignment == "left" else "justify-content:center;text-align:center;")
        hue = blob_hues[idx % len(blob_hues)]
        badges = "".join(f"<i>{b}</i>" for b in
                         (["karaoke"] if s.karaoke else [])
                         + (["pop-in"] if s.pop_in else [])
                         + ([f"tilt {s.rotation:g}°"] if s.rotation else []))
        tc = f"00:00:{4 + idx:02d};{(7 * idx) % 30:02d}"
        cards.append(f"""
    <figure class="card">
      <div class="stage" style="--blob:{hue}">
        <p class="cap" style="font-size:{size}px;{stroke}{shadow}transform:rotate({s.rotation}deg);bottom:{bottom_pct:.1f}%;{align_css}font-weight:900;">{' '.join(spans)}</p>
      </div>
      <div class="scrub"><span class="head" style="left:{12 + idx * 13}%"></span></div>
      <figcaption>
        <div class="row"><b>{pname}</b>{badges}<code>{tc}</code></div>
        <span>{html.escape(s.blurb)}</span>
      </figcaption>
    </figure>""")

    brand_chip = (f'<span class="chip">brand · {html.escape(brand["name"])}</span>' if brand else "")
    n = len(presets)
    return f"""<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(name)} v{version} — caption presets for Final Cut Pro</title>
<style>
  :root {{
    color-scheme: dark; /* edit-suite viewport: single-theme by design */
    --ink:#0b0d12; --panel:#141823; --line:#242b3b;
    --text:#e9ecf4; --muted:#8b93a8; --gold:#ffd400; --ok:#34c759;
    --mono:ui-monospace,"SF Mono",Menlo,monospace;
  }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; background:var(--ink); color:var(--text);
         font:15px/1.55 -apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif; }}
  header {{ max-width:1160px; margin:0 auto; padding:52px 24px 10px; }}
  .eyebrow {{ font:600 12px/1 var(--mono); letter-spacing:.18em; text-transform:uppercase;
              color:var(--gold); }}
  h1 {{ margin:14px 0 6px; font-size:clamp(30px,5vw,44px); font-weight:900;
        letter-spacing:-.01em; text-wrap:balance; }}
  h1 small {{ font:500 16px var(--mono); color:var(--muted); letter-spacing:0; }}
  header p {{ color:var(--muted); max-width:60ch; margin:6px 0 18px; }}
  .chips {{ display:flex; flex-wrap:wrap; gap:8px; }}
  .chip {{ font:500 12px/1 var(--mono); color:var(--muted); border:1px solid var(--line);
           border-radius:99px; padding:6px 12px; }}
  .chip.ok {{ color:var(--ok); border-color:color-mix(in srgb,var(--ok) 35%,var(--line)); }}
  .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr));
           gap:18px; padding:26px 24px 8px; max-width:1160px; margin:0 auto; }}
  .card {{ margin:0; background:var(--panel); border:1px solid var(--line);
           border-radius:10px; overflow:hidden; }}
  .stage {{ position:relative; aspect-ratio:9/12; overflow:hidden;
    background:
      radial-gradient(60% 42% at 50% 30%, hsl(var(--blob) 45% 26% / .55), transparent 70%),
      radial-gradient(120% 70% at 50% 110%, #05060a 20%, transparent 70%),
      linear-gradient(180deg,#1d2330 0%,#12161f 55%,#0a0c11 100%); }}
  .cap {{ position:absolute; left:0; right:0; margin:0; display:flex; flex-wrap:wrap;
          gap:0 .38em; line-height:1.02; letter-spacing:.01em; }}
  .scrub {{ position:relative; height:5px; background:#0a0c11; border-top:1px solid var(--line); }}
  .scrub .head {{ position:absolute; top:-1px; width:2px; height:7px; background:var(--gold); }}
  figcaption {{ padding:11px 14px 14px; }}
  .row {{ display:flex; align-items:center; gap:8px; }}
  .row b {{ font-size:15px; }}
  .row code {{ margin-left:auto; font:500 11px var(--mono); color:var(--muted);
               font-variant-numeric:tabular-nums; }}
  .row i {{ font-style:normal; font:500 10.5px/1 var(--mono); color:var(--gold);
            border:1px solid color-mix(in srgb,var(--gold) 30%,var(--line));
            border-radius:4px; padding:3px 6px; }}
  figcaption > span {{ display:block; color:var(--muted); font-size:12.5px; margin-top:5px; }}
  section {{ max-width:1160px; margin:0 auto; padding:22px 24px; }}
  h2 {{ font-size:13px; font-weight:600; letter-spacing:.16em; text-transform:uppercase;
        color:var(--muted); margin:0 0 14px; font-family:var(--mono); }}
  .pipwrap {{ display:grid; grid-template-columns:2fr 1fr; gap:18px; align-items:stretch; }}
  .pipstage {{ position:relative; aspect-ratio:16/9; border-radius:10px; border:1px solid var(--line);
    overflow:hidden;
    background: radial-gradient(70% 60% at 40% 40%, hsl(215 40% 24% / .6), transparent 70%),
                linear-gradient(180deg,#1a1f2b,#0c0f16); }}
  .pip {{ position:absolute; top:7%; right:5%; width:30%; aspect-ratio:9/16;
    border-radius:14px; transform:rotate(-2deg);
    background: radial-gradient(80% 60% at 50% 35%, hsl(28 55% 38%), hsl(24 45% 20%));
    box-shadow: 0 18px 34px rgba(0,0,0,.55); border:1px solid rgba(255,255,255,.14); }}
  .pipnotes {{ background:var(--panel); border:1px solid var(--line); border-radius:10px;
               padding:16px; color:var(--muted); font-size:13.5px; }}
  .pipnotes code {{ font:500 12px var(--mono); color:var(--text); }}
  .ship {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:12px; }}
  .ship div {{ border:1px solid var(--line); border-radius:8px; padding:12px 14px; }}
  .ship code {{ font:600 12.5px var(--mono); color:var(--gold); }}
  .ship p {{ margin:5px 0 0; color:var(--muted); font-size:12.5px; }}
  footer {{ max-width:1160px; margin:0 auto; padding:8px 24px 46px; color:#5b6377; font-size:12.5px; }}
  @media (max-width:760px) {{ .pipwrap {{ grid-template-columns:1fr; }} }}
  @media (prefers-reduced-motion: no-preference) {{
    .card {{ transition:transform .15s ease, border-color .15s ease; }}
    .card:hover {{ transform:translateY(-2px); border-color:#33405c; }}
  }}
</style>
<header>
  <div class="eyebrow">Final Cut Pro · caption system</div>
  <h1>{html.escape(name)} <small>v{version}</small></h1>
  <p>Six caption voices and a picture-in-picture kit, shipped as validated FCPXML.
     Import once, retype the words, or Paste&nbsp;Attributes (&#8679;&#8984;V) onto your own titles.</p>
  <div class="chips">
    <span class="chip ok">{n} presets + 4 PIP · all validated</span>
    <span class="chip">frame-aligned rational timing</span>
    {brand_chip}
  </div>
</header>
<div class="grid">{''.join(cards)}
</div>
<section>
  <h2>Picture-in-picture</h2>
  <div class="pipwrap">
    <div class="pipstage"><div class="pip"></div></div>
    <div class="pipnotes">Four corners, pre-built: scaled to <code>0.32</code>, rounded with
      Shape&nbsp;Mask, drop shadow, resting tilt <code>-2&#176;</code>. Replace the placeholder
      with your facecam or paste its attributes onto any connected clip.</div>
  </div>
</section>
<section>
  <h2>In the box</h2>
  <div class="ship">
    <div><code>presets/*.fcpxml</code><p>one import per voice, sample cues included</p></div>
    <div><code>pip/pip-*.fcpxml</code><p>all four corners, rounded + shadowed</p></div>
    <div><code>manifest.json</code><p>version + sha256 of every file</p></div>
    <div><code>README + LICENSE</code><p>60-second install, personal-use license</p></div>
  </div>
</section>
<footer>Preview is a CSS approximation of the Final Cut render — the .fcpxml files are the
source of truth. Rate/frame noted in manifest.json.</footer>
</html>
"""


def _readme(name: str, version: str, presets: dict[str, Style]) -> str:
    lst = "\n".join(f"- **{n}** — {s.blurb}" for n, s in presets.items())
    return f"""# {name} v{version} — caption presets & PIP kit for Final Cut Pro

## Install (60 seconds)
1. Open Final Cut Pro.
2. **File > Import > XML…** and pick any file from `presets/` (start with
   `tiktok.fcpxml`). A small project appears in the *fcpkit* event with sample
   captions already styled.
3. Open `preview.html` in any browser to see every look before importing.

## Use on your own video
- **Copy a look**: select a sample title, `⌘C`, select your own title(s),
  `⇧⌘V` (Paste *Attributes*) → tick Text Style + Transform. Done.
- **Or keep the samples** as a scratch palette at the end of your timeline and
  option-drag one whenever you need it, then retype the words.
- **PIP**: import a file from `pip/`, replace the placeholder with your
  facecam, or Paste Attributes from the PIP clip onto any connected clip to
  get the corner + rounded mask + shadow in one move.

## The presets
{lst}

## Frame & rate
Built for the frame noted in `manifest.json`. Import into any project — FCP
conforms rates — but sizes are tuned for that frame.

## Support
Every file is listed with its sha256 in `manifest.json`; if an import fails,
verify the hash first, then reach out with your FCP version.
"""


def _license(name: str) -> str:
    return f"""{name} — Personal & Commercial Content License (v1)

You may: use these presets in any videos you publish, personal or commercial,
on any platform, forever.

You may not: resell, redistribute, or bundle the preset files themselves
(free or paid), or claim authorship of the pack.

One purchase = one editor. Team licenses available on request.
(This is a starting-point license — review before selling.)
"""
