# fcpkit — a captions / PIP / analysis pipeline for Final Cut Pro

Final Cut has no scripting API, but it has something better for this job:
**FCPXML**, its native interchange format. Anything we can describe in FCPXML —
styled titles, real multi-language captions, transforms, effects with
parameters — appears in FCP via **File > Import > XML** as first-class timeline
objects you can still edit by hand afterwards. This toolkit is a command-line
pipeline that generates validated FCPXML, so the whole caption workflow
(CapCut-style looks, restyling, translation, PIP) becomes repeatable instead
of click-by-click.

Requires Python 3.9+ (macOS ships it). No dependencies for the core; `yt-dlp`
only if you use YouTube fetching, `ANTHROPIC_API_KEY` only for auto-translate.

```bash
cd fcp
export PYTHONPATH="$PWD"           # or: pip install -e . later if we package it
python3 -m fcpkit styles           # see the presets
```

## The single workflow

One master JSON file per video owns the truth — timings, text, per-cue style,
per-word emphasis, translations. Every export is derived from it, so nothing
ever drifts:

```
CapCut draft / SRT / VTT / YouTube ──▶ import ──▶ captions.master.json
                                                     │
                              restyle (highlight, switch preset, emphasis)
                              translate (worksheet or Claude API)
                                                     │
                 ┌───────────────────────────────────┼──────────────────────┐
                 ▼                                   ▼                      ▼
        fcpxml (styled titles)          captions (real FCP lanes)      srt (YouTube)
        colors, rotation, karaoke       en + es + zh, same timing      plain subs
                 └───────────────► File > Import > XML ◄───────────────┘
```

### 1. Get captions in

```bash
# From CapCut: either export SRT (Captions > Export) …
python3 -m fcpkit import captions.srt -o ep12.master.json --style tiktok

# … or rip the CapCut project directly (works on drafts you never exported):
python3 -m fcpkit import "~/Movies/CapCut/User Data/Projects/com.lveditor.draft/<project>/draft_content.json" -o ep12.master.json
```

`--fps 29.97 --width 1080 --height 1920` are the vertical defaults; pass
`--width 1920 --height 1080` for long-form. All sizes/positions in presets
auto-scale to the frame.

### 2. Style, restyle, highlight

```bash
python3 -m fcpkit styles                                     # the menu
python3 -m fcpkit restyle ep12.master.json --cues 5-9 --style hormozi
python3 -m fcpkit restyle ep12.master.json --match "ninety" --style sticker
python3 -m fcpkit restyle ep12.master.json --time-from 30 --time-to 45 --style karaoke
python3 -m fcpkit restyle ep12.master.json --emphasize "slap|viral"   # words go gold
```

That last one is the "highlight a caption and flip it to a type" ask: select
by number, regex, or time window; apply any preset or per-word emphasis; the
next export reflects it. Tweak any preset field at export time without
editing code:

```bash
python3 -m fcpkit fcpxml ep12.master.json -o ep12-caps.fcpxml \
    --set highlight_color=#34C759 --set rotation=-4 --set position=0,-620
```

### 3. Translate — same timing, second language

Timing lives on the cue; a translation is just parallel text. Three modes:

```bash
# Fully automatic (uses the Claude API; keeps lines within ~20% of source
# length so they fit the same on-screen window):
export ANTHROPIC_API_KEY=sk-...
python3 -m fcpkit translate ep12.master.json --to es

# Or a human/offline flow: writes a TSV worksheet, you (or anyone) fill the
# last column, then merge it back:
python3 -m fcpkit translate ep12.master.json --to es --mode worksheet
python3 -m fcpkit translate ep12.master.json --to es --mode apply
```

Then export **both** as real Final Cut captions in one file:

```bash
python3 -m fcpkit captions ep12.master.json --langs en,es -o ep12-fcp-captions.fcpxml
```

These import as native caption lanes (ITT roles), so FCP's caption editor,
per-language toggling in the timeline index, and .itt / embedded-CC export all
work — and the Spanish cues are frame-identical in timing to the English ones
by construction. For *burned-in* styled translations instead, export titles in
the other language: `fcpxml ep12.master.json --lang es`.

### 4. Picture-in-picture kit

```bash
python3 -m fcpkit pip -o pip.fcpxml --corner top-right --scale 0.32 \
    --roundness 0.6 --rotation -2 --media ~/clips/facecam.mov
```

Generates a project where the PIP layer is already scaled, cornered, slightly
tilted, given **rounded corners** (Shape Mask) and a **drop shadow**. Without
`--media` both layers are FCP Placeholder generators — replace them with your
footage, or select the PIP clip, ⌘C, then ⌥⌘V (Paste Attributes) onto any clip
to move the whole look. Corners: `top-left/right`, `bottom-left/right`.

### 5. YouTube analysis

```bash
pip install yt-dlp
python3 -m fcpkit yt "https://youtu.be/VIDEO" --master ep12.master.json
# or offline, on any SRT/VTT you already have:
python3 -m fcpkit yt --transcript talk.vtt --report report.md
```

Pulls your subs (or YouTube's auto-captions) without downloading the video and
writes a markdown report: words-per-minute overall and per minute (sagging
middles), hook density in the first 15 s, **dead-air list** (cut or b-roll
these), verbal tics (repeated phrases), caption line-length audit for
vertical, chapter candidates ready for the description, and which caption
preset fits the delivery. `--master` also drops the transcript straight into
the caption pipeline for repurposing long-form into Shorts.

### 6. Round-trip an SRT for YouTube uploads

```bash
python3 -m fcpkit srt ep12.master.json --lang es -o ep12.es.srt
```

## Selling the presets — packs, brand kits, Motion templates

Three layers, from "ship today" to "premium tier":

```bash
# 1. A distributable pack (folder + zip): every preset as an importable
#    .fcpxml with sample cues, 4 PIP corners, preview.html catalog (doubles
#    as the sales page), README, LICENSE, manifest.json with sha256 hashes.
python3 -m fcpkit pack -o dist --name SlapCaps --version 0.2.0 \
    --brand examples/brandkit.victortan.json

# 2. Brand kits re-skin every preset from one JSON (colors/fonts) — the same
#    six looks become a "Podcast Pack", a "Fitness Pack", or a client's
#    custom pack without touching code.

# 3. Motion templates (.moti) — the premium tier. Author ONE master caption
#    title in Motion, then stamp out a recolored variant per preset:
python3 -m fcpkit motionize "~/Movies/Motion Templates/Titles/SlapCaps/SlapCaps Master" \
    --brand examples/brandkit.victortan.json
```

`motionize` is deliberately conservative: Motion's OZML format is
undocumented, so we never author it from scratch — we clone your master
template folder and rewrite only the Red/Green/Blue/Opacity values inside
recognized color parameter blocks (Face/Outline/Drop Shadow/Glow), leaving
every other byte identical. If the master doesn't expose those parameters it
fails loudly instead of guessing. The variants appear in FCP's Titles browser
immediately; zipping the category folder is the sellable Motion tier
(customers unzip into `~/Movies/Motion Templates/Titles/`).

Licensing when you sell: everything fcpkit generates is your own content.
Don't redistribute Apple's built-in .moti files, and only bundle fonts whose
license allows it (OFL fonts like Montserrat are fine; system fonts are
referenced, never bundled). `LICENSE.txt` in each pack is a starting-point
personal-use license — review it before charging money.

## Presets (`fcpkit styles`)

| Preset | Look |
|---|---|
| `tiktok` | Big bold white, black outline, soft shadow, 4-frame pop-in — the CapCut default |
| `hormozi` | ALL-CAPS word-by-word karaoke, active word flips gold |
| `karaoke` | Whole line visible, current word tints red as audio reaches it |
| `clean` | Sentence-case subtitle, shadow only — long-form YouTube |
| `lowerthird` | Small left-anchored label for names/places |
| `sticker` | Heavy outline, tilted 3°, pop-in — punchlines |

Every field (`font`, `font_size`, `font_color`, `stroke_*`, `shadow_*`,
`position`, `rotation`, `highlight_color`, `uppercase`, `pop_in`, `karaoke`)
is overridable per-export with `--set`, so presets are starting points, not
cages.

## Validation — how you know an export will import

1. **Unit suite** (`python3 -m unittest discover tests`, 24 tests): timing
   math, SRT/VTT round-trips, CapCut draft parsing, karaoke explosion,
   emphasis runs, multi-language caption lanes, PIP structure.
2. **Every export self-validates** before it reports success: well-formed XML,
   no dangling `ref`s, no duplicate style ids, and — the one that actually
   kills imports — every offset/duration checked as an exact multiple of the
   sequence `frameDuration` (all times are rational, e.g. `21021/10000s`,
   never floats).
3. **Strict mode**: `python3 -m fcpkit validate file.fcpxml --dtd
   "/Applications/Final Cut Pro.app/Contents/Resources/FCPXMLv1_10.dtd"`
   runs Apple's own DTD via xmllint.
4. **Effect uid calibration**: built-in effect uids (Basic Title, Shape Mask,
   Drop Shadow, Placeholder) can differ across FCP versions. Export any tiny
   timeline from *your* FCP with those effects applied once, then:
   `python3 -m fcpkit learn-effects MyExport.fcpxml` — the harvested uids are
   saved to `effects.local.json` and used automatically from then on. Run this
   once per FCP upgrade and the toolkit can never emit an effect your install
   doesn't recognize.

## Ready-made examples (import these right now)

`examples/output/` is generated by the test workflow and committed:

- `demo-captions.fcpxml` — 6 cues: tiktok pop-in, hormozi karaoke, a tilted
  sticker line, gold emphasized words.
- `demo-fcp-captions-en-es.fcpxml` — native English + Spanish caption lanes,
  identical timing.
- `demo-pip.fcpxml` — the PIP block on placeholders.
- `demo-yt-report.md` — an analysis report from a sample transcript.

## Notes & limits

- Titles import on **lane 1 above a gap**; copy them onto your own timeline
  (paste at the same timecode and offsets are preserved), or drop your footage
  into the gap's storyline.
- CapCut's *animated* effects (bounce presets, sounds) don't translate — the
  text, timing, and an equivalent look do. The pop-in keyframes cover the most
  common CapCut entrance.
- A true rounded-box *background* behind text (the CapCut "label" look) isn't
  expressible in plain FCPXML text styles; the presets use stroke + shadow
  instead. If you want the label look, that's a 10-minute custom Motion title
  — ask and we'll build it as a `.moti` you drop in `~/Movies/Motion Templates`.
- `fcpkit yt` respects YouTube only via `yt-dlp`; auto-captions are
  deduplicated on import (YouTube's rolling VTT repeats lines).
