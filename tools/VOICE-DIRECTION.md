# VOICE DIRECTION — expressive VO for SlapMania videos

How we get *performances* out of macOS `say` instead of flat text-to-speech:
rising awareness ("o-o-OH?!"), sportscaster calls, drawls, whispers, and
melodic interjections with exact pitch curves — plus the pacing/sync rules that
make them land against the picture. The tool is `tools/voice.py`; this file is
the craft.

## Quick start (on the Mac)

```bash
python3 tools/voice.py selftest                    # 1. verify TUNE + commands work
python3 tools/voice.py audition                    # 2. listen to every preset & riff
python3 tools/voice.py render tools/vo-booth-demo.json --mix   # 3. hear a full call
python3 tools/voice.py render tools/vo-booth-demo.json --dry-run  # works anywhere
```

`render` writes per-line AIFFs + `manifest.json` + `timeline.txt` + `vo-mix.sh`
into `media/vo/<name>/` (media/ is gitignored — no audio assets in the repo).
`vo-mix.sh` lays every line at its resolved time, ducks the score bed under
speech (sidechain compression), and prints the mux command for the picture.

## Why this works: the two expression layers

1. **Prosody commands** (robust, works everywhere a classic voice does):
   `[[rate]]`, `[[pbas]]` (pitch base), `[[pmod]]` (pitch wobble), `[[emph]]`,
   `[[slnc]]`, `[[volm]]`. voice.py compiles friendly markup into these.
2. **TUNE riffs** (the melodic layer): Apple's TUNE input format specifies an
   exact pitch curve in Hz over each phoneme — real intonation contours, not
   just a higher/lower baseline. This is how "o-o-o" actually *rises*.

**Casting constraint:** only the CLASSIC voices (Alex, Fred, Ralph, Samantha,
Daniel, Karen, Moira, Tessa, Fiona, …) honour embedded commands and TUNE. The
newer Siri voices sound better flat but ignore all direction — never cast them
for expressive lines. `voice.py voices` stars the safe ones; `selftest` proves
a voice before you build a session on it.

## The cast (extend per session via `"cast"`)

| key | who | voice | role |
|---|---|---|---|
| `howie` | HOWLIN' HOWIE | Alex | play-by-play — fast, panned left |
| `jim` | BIG SLOW JIM | Fred | color man — slow drawl, panned right |
| `announcer` | FAIR PA | Daniel | tannoy, always through the `pa` effect |
| `mira` | MIRACLE MIRA | Ralph @ pbas 22 | canon baritone from the trailers |
| `kate` | FIELD REPORTER KATE | Samantha | ringside stand-ups |

Each cast entry carries `hz` — the voice's rough fundamental, the reference
pitch for its TUNE riffs. If a riff sounds transposed wrong, tune `hz` by ear.

## The markup

| tag | effect |
|---|---|
| `[beat]` / `[beat 500]` | silence (ms, default 350) — comedy lives here |
| `[emph]…[/emph]` | every word in the span emphasised |
| `[rise]…[/rise]` / `[rise 4]` | pitch ladders **up** across the span (semitones) |
| `[fall]…[/fall]` | pitch ladders down |
| `[pitch 4]…[/pitch]` | hold a pitch offset (negative allowed) |
| `[slow]` `[fast]` `[rate 120]` … | rate for the span |
| `[soft]` / `[loud]` … | volume for the span |
| `[riff name]` | insert a melodic interjection (below) |
| `ALL CAPS` | auto-shout: emphasis + small pitch bump |

**Performances** (`"perf"` per line): `plain`, `deadpan`, `murmur`, `build`
(pitch+rate climb word-by-word across the whole line), `call` (the big shout),
`hype`, `drawl`, `awe`, `panic`, `whisper`.

**Riffs**: `ooo_rise` (the awareness ladder — three 'oh's, each higher),
`ohhh` (long dawning rise), `whoa` (up-and-settle), `no_no_no` (stepping-down
alarm), `gooone` (the long falling call tail), `huh` (question rise), `aww`
(sympathy fall), `heyy` (delight).

**Effects** (`"fx"`, applied in the mix): `pa` (tannoy), `stadium` (echo),
`booth` (rumble cut), `slowmo` (pitched down + slowed ≈0.7× for replay VO —
the timeline accounts for the stretch).

## The sportscaster style bible

Anatomy of a call — five beats, and the shape of each one matters more than
the words:

1. **The settle** (`murmur`): quiet, low, drawing the viewer in.
   *"Folks. [beat] Watch the feet."*
2. **The recognition** (`build` + `[riff ooo_rise]`): the commentator sees the
   wind-up before the audience understands it. Pitch climbs word by word; the
   ladder riff crests **right at contact**. This is the "o-o-o" moment — put
   the riff so its last, highest 'OH' lands on the crack.
3. **The call** (`call`, ALL CAPS, ≤6 words): lands 150–300 ms *after* the
   slap SFX, never on top of it. Repetition is the genre:
   *"HE SLAPPED HIM! [beat 200] HE SLAPPED HIM CLEAN!"*
4. **The flight** (`hype` + `[rise]` + `[riff gooone]`): ride the arc; the held
   falling vowel mirrors the body coming down.
5. **The punchline** (color man, `drawl`, after a real gap): slow, flat,
   deadpan against the hysteria. The contrast IS the joke.

Two-man booth rules: play-by-play left (`pan -0.35`), color right (`pan 0.35`)
so ears separate them; the color man **never** talks during beats 2–3; if you
want talk-over chaos set `"overlap": true` deliberately — the tool warns on
accidental overlaps otherwise.

## Pacing & sync

- Times are seconds, resolved against the session's `"marks"` table:
  `"at": "contact+0.15"`. Get marks from the storyboard (e.g. the standard
  scripted swing hits at **4.083 s** — `CONTACT` in tools/promo.js) or from
  the cinema report's shot times; they're the same clock score.js uses, so VO,
  music and picture all agree.
- `"after": "<id>", "gap": 0.5` chains conversation without arithmetic —
  real rendered durations are used, so re-takes re-flow automatically.
- **Protect the crack.** Nothing but the riff tail within ±150 ms of contact —
  the slap SFX is the star; the call comes after.
- Silence is a performance: a `[beat 400]` before a punchline outperforms any
  clever wording. When in doubt, add silence, not words.
- Slow-mo picture wants slow-mo voice (`"fx": "slowmo"`) or none. Half-speed
  footage under full-speed chatter reads as a mistake.
- `--dry-run` estimates durations from the speaking rate; on the Mac the real
  AIFF durations replace them — re-render before trusting tight joins, and use
  `--only id1,id2` to re-take single lines without touching good ones
  (existing takes keep their true timing).

## Gotchas

- TUNE blocks silently depend on classic voices — `selftest` FIRST on any
  new machine or voice, before recording sessions against it.
- After a TUNE block the compiler re-asserts the line's rate; if a riff ever
  audibly resets pitch on an absolute-pbas character (Mira), file it — the
  compiler force-re-emits pbas for those.
- `say -f` reads the compiled text from a file (voice.py writes
  `line_<id>.txt` beside each AIFF) — that's also the file to read when
  debugging what the compiler actually emitted.
- The `slowmo` chain changes duration by ≈1/0.705; the manifest already
  reflects it — don't hand-correct.
- Keep rendered audio in `media/` (gitignored). The repo ships zero audio
  assets — same house rule as audio.js and score.js.
