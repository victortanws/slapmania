#!/usr/bin/env python3
# ---------------------------------------------------------------------------
# voice.py — expressive VO compiler + renderer for SlapMania videos.
#
# Turns a *directed* script (a session JSON: who says what, with performance
# markup, timed against the storyboard's marks) into per-line AIFFs via macOS
# `say`, then emits an ffmpeg mix script that lays them on the score bed with
# sidechain ducking. The point is PERFORMANCE, not just speech: rising
# awareness ladders ("o-o-o?!"), sportscaster calls, drawls, whispers, and
# melodic interjections with exact pitch contours (Apple TUNE format).
#
#   python3 tools/voice.py render tools/vo-booth-demo.json          # on the Mac
#   python3 tools/voice.py render tools/vo-booth-demo.json --dry-run  # anywhere
#   python3 tools/voice.py audition        # every preset+riff as listenable files
#   python3 tools/voice.py selftest        # verify TUNE works with your voices
#   python3 tools/voice.py voices          # installed voices, classic ones marked
#
# House rules honoured: zero audio asset files in the repo — everything is
# synthesized (say) or generated (ffmpeg) at render time into media/ (ignored).
# Style + pacing guidance lives in tools/VOICE-DIRECTION.md.
#
# IMPORTANT: embedded speech commands ([[pbas]], [[rate]], TUNE, …) only work
# with the CLASSIC macOS voices (Alex, Fred, Ralph, Samantha, Daniel, Karen…).
# The newer Siri voices read the brackets out loud or ignore them. Run
# `selftest` once on the Mac before trusting a new voice.
# ---------------------------------------------------------------------------
import argparse, json, math, os, re, shutil, string, subprocess, sys

# ---------------------------------------------------------------------------
# CAST — every speaker the scripts can reference. Sessions may extend/override
# via their own "cast" object. `hz` is the voice's rough speaking fundamental,
# used as the reference pitch for TUNE riffs — tune it by ear via `selftest`.
# `pbas` (absolute, semitone-ish MIDI value) is only set where canon demands it
# (MIRACLE MIRA = Ralph at pbas 22, per the trailer sessions).
# ---------------------------------------------------------------------------
CAST = {
    # the two-man booth — the default sports-commentary duo
    'howie': {'name': "HOWLIN' HOWIE", 'voice': 'Alex', 'hz': 110, 'rate': 190,
              'pan': -0.35, 'perf': 'plain'},                     # play-by-play
    'jim':   {'name': 'BIG SLOW JIM', 'voice': 'Fred', 'hz': 92, 'rate': 145,
              'pan': 0.35, 'perf': 'drawl'},                      # color man
    # the fairground PA — always through the 'pa' effect chain
    'announcer': {'name': 'FAIR PA', 'voice': 'Daniel', 'hz': 115, 'rate': 170,
                  'fx': 'pa'},
    # canon character voices from earlier trailer work
    'mira':  {'name': 'MIRACLE MIRA', 'voice': 'Ralph', 'pbas': 22, 'hz': 85,
              'rate': 170},
    'kate':  {'name': 'FIELD REPORTER KATE', 'voice': 'Samantha', 'hz': 185,
              'rate': 185},
}

# ---------------------------------------------------------------------------
# PERF — whole-line performance presets. Applied as the line's baseline; the
# inline tags below then modulate around it. `pbas` here is an OFFSET from the
# voice's default (or from the character's absolute base). `ramp` turns the
# whole line into a build: pitch/rate climb word by word to the last word.
# ---------------------------------------------------------------------------
PERF = {
    'plain':   {},
    'deadpan': {'rate': 165, 'pmod': 2},
    'murmur':  {'rate': 150, 'volm': 0.72, 'pmod': 3},            # under the breath
    'build':   {'rate': 180, 'ramp': {'pbas': 5, 'rate': 55}},    # anticipation climb
    'call':    {'rate': 220, 'pbas': 5, 'pmod': 9},               # THE big shout
    'hype':    {'rate': 235, 'pbas': 3, 'pmod': 8},               # flight coverage
    'drawl':   {'rate': 138, 'pbas': -3, 'pmod': 4},              # slow color-man
    'awe':     {'rate': 128, 'pbas': 2, 'volm': 0.82, 'pmod': 6}, # quiet wonder
    'panic':   {'rate': 252, 'pbas': 6, 'pmod': 10},
    'whisper': {'rate': 150, 'volm': 0.5, 'pbas': -1, 'pmod': 2},
}

# ---------------------------------------------------------------------------
# RIFFS — melodic interjections in Apple TUNE format: exact per-phoneme pitch
# curves, the thing plain prosody commands cannot do. Each entry is a list of
# (phoneme, duration_ms, contour) where contour is [(percent, semitones)]
# relative to the character's `hz`; None = unpitched (consonant / silence '%').
# These are the "o-o-o" reaction sounds the booth uses when they see the
# wind-up. Validate against a voice with `selftest` — TUNE needs classic voices.
# ---------------------------------------------------------------------------
RIFFS = {
    # the awareness ladder: three 'oh's, each higher and longer — "o-o-OH?!"
    'ooo_rise': [('OW', 150, [(0, 0), (100, 1)]), ('%', 60, None),
                 ('OW', 175, [(0, 2), (100, 3.5)]), ('%', 60, None),
                 ('OW', 270, [(0, 5), (60, 8), (100, 7.5)])],
    # one long dawning 'ohhhh' that climbs and blooms
    'ohhh':     [('OW', 540, [(0, -1), (55, 4), (100, 6)])],
    # 'whoa' — snaps up, rides the top, settles
    'whoa':     [('w', 70, None), ('OW', 440, [(0, -2), (30, 6), (70, 5), (100, 1)])],
    # alarm: 'no no no', stepping down as hope leaves
    'no_no_no': [('n', 50, None), ('OW', 150, [(0, 6), (100, 4)]), ('%', 40, None),
                 ('n', 50, None), ('OW', 150, [(0, 5), (100, 3)]), ('%', 40, None),
                 ('n', 60, None), ('OW', 250, [(0, 4), (100, -1)])],
    # the call tail: 'GOOO-NE' — a long held vowel falling away like the flight
    'gooone':   [('g', 60, None), ('OW', 720, [(0, 9), (40, 8.5), (100, 3)]),
                 ('n', 130, [(0, 2), (100, 0)])],
    # question rise: 'huh?'
    'huh':      [('h', 60, None), ('AH', 250, [(0, 0), (100, 5)])],
    # sympathy: 'awww'
    'aww':      [('AO', 500, [(0, 3), (100, -2)])],
    # delight: 'heyyy'
    'heyy':     [('h', 60, None), ('EY', 430, [(0, 2), (45, 6), (100, 4)])],
}

# per-line ffmpeg effect chains (applied in the mix, not baked into the AIFF)
FX = {
    'pa':      'highpass=f=500,lowpass=f=3800,aecho=0.7:0.5:60:0.22',
    'stadium': 'aecho=0.8:0.55:120|240:0.3|0.18',
    'booth':   'highpass=f=90',
    # slow-mo replay voice: pitched down AND slowed — total speed ≈ 0.705
    'slowmo':  'aresample=22050,asetrate=22050*0.82,aresample=22050,atempo=0.86',
}
FX_SPEED = {'slowmo': 0.82 * 0.86}   # duration scale so the timeline stays honest

# classic (MacinTalk-era) voices known to honour embedded commands
CLASSIC = {'Alex', 'Fred', 'Ralph', 'Kathy', 'Samantha', 'Victoria', 'Vicki',
           'Bruce', 'Junior', 'Agnes', 'Albert', 'Daniel', 'Karen', 'Moira',
           'Rishi', 'Tessa', 'Fiona', 'Veena'}

SAMPLE = "Folks, he's winding up — and that is the [emph]biggest[/emph] slap I have ever seen."

# ---------------------------------------------------------------------------
# markup compiler: directed text -> `say` string with embedded speech commands
#
#   [beat] / [beat 500]        silence, ms (default 350)
#   [emph]word word[/emph]     every word in the span emphasised
#   [rise] .. [/rise]          pitch ladders UP across the span (arg = semitones, default 7)
#   [fall] .. [/fall]          pitch ladders DOWN across the span
#   [pitch 4] .. [/pitch]      hold a pitch offset (semitones, may be negative)
#   [slow] / [fast] .. [/...]  rate ×0.8 / ×1.25 for the span
#   [rate 120] .. [/rate]      absolute words-per-minute for the span
#   [soft] / [loud] .. [/...]  volume 0.6 / 1.0 for the span
#   [riff name]                insert a TUNE riff (see RIFFS)
#   ALL-CAPS WORD              auto-shout: emphasis + small pitch bump
# ---------------------------------------------------------------------------
TAG_RE = re.compile(r'\[(/?)([a-z_]+)(?:\s+([^\]]*))?\]')
SELF_TAGS = {'beat', 'riff'}
SPAN_TAGS = {'emph', 'rise', 'fall', 'pitch', 'slow', 'fast', 'rate', 'soft', 'loud'}


def tokenize(text):
    toks, pos = [], 0
    for m in TAG_RE.finditer(text):
        if m.start() > pos:
            toks += [('w', w) for w in text[pos:m.start()].split()]
        toks.append(('t', m.group(1) == '/', m.group(2), (m.group(3) or '').strip()))
        pos = m.end()
    toks += [('w', w) for w in text[pos:].split()]
    return toks


def words_until_close(toks, i, name):
    depth, n = 1, 0
    for t in toks[i:]:
        if t[0] == 't' and t[2] == name:
            depth += 1 if not t[1] else -1
            if depth == 0:
                break
        elif t[0] == 'w':
            n += 1
    return max(n, 1)


def is_shout(w):
    core = w.strip(string.punctuation + '—…')
    return len(core) >= 2 and core.isalpha() and core.isupper()


def tune_block(riff, base_hz):
    lines = ['[[inpt TUNE]]', '~']
    for ph, ms, contour in riff:
        if contour is None:
            lines.append(f'{ph} {{D {ms}}}')
        else:
            pts = ' '.join(f'{base_hz * 2 ** (st / 12):.1f}:{int(pct)}' for pct, st in contour)
            lines.append(f'{ph} {{D {ms}; P {pts}}}')
    lines.append('[[inpt TEXT]]')
    return '\n'.join(lines)


def compile_line(text, ch, perf, warn):
    toks = tokenize(text)
    out = []
    base_abs = ch.get('pbas')                 # absolute pitch base (Mira) or None
    base_rate = int(perf.get('rate', ch.get('rate', 175)))
    pitch_hold = float(perf.get('pbas', 0))   # steady offset from [pitch] + perf
    cur_rate, emitted_off, emph_depth, volm = None, None, 0, None
    frames = []                               # active rise/fall ramps
    stacks = {'pitch': [], 'rate': [], 'volm': []}
    est_ms = 0

    def emit_rate(r):
        nonlocal cur_rate
        r = int(round(r))
        if r != cur_rate:
            out.append(f'[[rate {r}]]')
            cur_rate = r

    def emit_pbas(off):
        nonlocal emitted_off
        if emitted_off is not None and abs(off - emitted_off) < 0.05:
            return
        if base_abs is not None:
            out.append(f'[[pbas {base_abs + off:.1f}]]')
        else:
            d = off - (emitted_off or 0.0)
            if abs(d) >= 0.05:
                out.append(f'[[pbas {"+" if d > 0 else "-"}{abs(d):.1f}]]')
        emitted_off = off

    def emit_volm(v):
        nonlocal volm
        if v is not None and v != volm:
            out.append(f'[[volm {v:.2f}]]')
            volm = v

    # line header: baseline performance
    emit_rate(base_rate)
    if base_abs is not None or pitch_hold:
        emit_pbas(pitch_hold)
    pm = perf.get('pmod', ch.get('pmod'))
    if pm is not None:
        out.append(f'[[pmod {pm}]]')
    emit_volm(perf.get('volm', ch.get('volm')))
    if 'ramp' in perf:
        n = sum(1 for t in toks if t[0] == 'w')
        frames.append({'span': perf['ramp'].get('pbas', 5), 'base': pitch_hold,
                       'rate0': base_rate, 'rate1': base_rate + perf['ramp'].get('rate', 0),
                       'k': 0, 'n': n})

    span_rate = base_rate
    for i, t in enumerate(toks):
        if t[0] == 'w':
            w = t[1]
            target = pitch_hold
            frate = span_rate
            if frames:
                f = frames[-1]
                frac = 1.0 if f['n'] <= 1 else f['k'] / (f['n'] - 1)
                target = f['base'] + f['span'] * frac
                if 'rate1' in f:
                    frate = f['rate0'] + (f['rate1'] - f['rate0']) * frac
                f['k'] += 1
            shout = is_shout(w)
            if shout:
                target += 1.2
            if emph_depth > 0 or shout:
                out.append('[[emph +]]')
            emit_rate(frate)
            emit_pbas(target)
            out.append(w)
            est_ms += 60000 / max(cur_rate, 60)
            continue

        _, closing, name, arg = t
        if not closing and name == 'beat':
            ms = int(arg) if arg else 350
            out.append(f'[[slnc {ms}]]')
            est_ms += ms
        elif not closing and name == 'riff':
            if arg not in RIFFS:
                warn(f'unknown riff "{arg}"')
                continue
            out.append(tune_block(RIFFS[arg], ch.get('hz', 110)))
            est_ms += sum(ms for _, ms, _ in RIFFS[arg])
            cur_rate, emitted_off = None, (None if base_abs is not None else emitted_off)
            emit_rate(span_rate)              # restore prosody after the TUNE block
        elif name in ('rise', 'fall') and not closing:
            span = float(arg) if arg else 7.0
            if name == 'fall':
                span = -span
            frames.append({'span': span, 'base': pitch_hold, 'k': 0,
                           'n': words_until_close(toks, i + 1, name)})
        elif name in ('rise', 'fall') and closing:
            if frames:
                frames.pop()
        elif name == 'emph':
            emph_depth += 1 if not closing else -1
        elif name == 'pitch':
            if not closing:
                stacks['pitch'].append(pitch_hold)
                pitch_hold += float(arg or 3)
            elif stacks['pitch']:
                pitch_hold = stacks['pitch'].pop()
        elif name in ('slow', 'fast', 'rate'):
            if not closing:
                stacks['rate'].append(span_rate)
                span_rate = (float(arg) if name == 'rate' and arg else
                             span_rate * (0.8 if name == 'slow' else 1.25 if name == 'fast' else 1))
            elif stacks['rate']:
                span_rate = stacks['rate'].pop()
        elif name in ('soft', 'loud'):
            if not closing:
                stacks['volm'].append(volm)
                emit_volm(0.6 if name == 'soft' else 1.0)
            elif stacks['volm']:
                emit_volm(stacks['volm'].pop() or 0.85)
        else:
            warn(f'unknown tag [{"/" if closing else ""}{name}]')

    return ' '.join(out), est_ms / 1000 + 0.25


# ---------------------------------------------------------------------------
# rendering + timeline
# ---------------------------------------------------------------------------
def probe_duration(path):
    try:
        r = subprocess.run(['afinfo', path], capture_output=True, text=True)
        m = re.search(r'estimated duration:\s*([\d.]+)', r.stdout)
        if m:
            return float(m.group(1))
    except FileNotFoundError:
        pass
    try:
        r = subprocess.run(['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
                            '-of', 'csv=p=0', path], capture_output=True, text=True)
        return float(r.stdout.strip())
    except (FileNotFoundError, ValueError):
        return None


def resolve_at(spec, marks):
    if isinstance(spec, (int, float)):
        return float(spec)
    m = re.fullmatch(r'(\w+)\s*([+-]\s*[\d.]+)?', spec.strip())
    if not m or m.group(1) not in marks:
        raise SystemExit(f'bad time spec "{spec}" (marks: {sorted(marks)})')
    return marks[m.group(1)] + (float(m.group(2).replace(' ', '')) if m.group(2) else 0.0)


def render_session(sess, outdir, dry, only=None):
    cast = {**CAST, **{k: {**CAST.get(k, {}), **v} for k, v in sess.get('cast', {}).items()}}
    marks = sess.get('marks', {})
    os.makedirs(outdir, exist_ok=True)
    if not dry and shutil.which('say') is None:
        raise SystemExit('`say` not found — render on the Mac (use --dry-run elsewhere).')

    rows, ends = [], {}
    for ln in sess['lines']:
        lid = ln['id']
        ch = cast.get(ln['who'])
        if ch is None:
            raise SystemExit(f'line "{lid}": unknown character "{ln["who"]}"')
        perf = dict(PERF[ln.get('perf', ch.get('perf', 'plain'))])
        for k in ('rate', 'pbas', 'volm', 'pmod'):
            if k in ln:
                perf[k] = ln[k]
        warns = []
        text, est = compile_line(ln['text'], ch, perf, warns.append)
        for w in warns:
            print(f'  ⚠ {lid}: {w}')

        txt_path = os.path.join(outdir, f'line_{lid}.txt')
        aiff = os.path.join(outdir, f'line_{lid}.aiff')
        with open(txt_path, 'w') as fh:
            fh.write(text + '\n')

        dur = est
        if not dry and (only is None or lid in only):
            subprocess.run(['say', '-v', ch['voice'], '-o', aiff, '-f', txt_path], check=True)
            dur = probe_duration(aiff) or est
        elif not dry and os.path.exists(aiff):
            dur = probe_duration(aiff) or est    # --only keeps old takes' real timing
        fx = ln.get('fx', ch.get('fx'))
        dur_fx = dur / FX_SPEED.get(fx, 1.0)

        if 'at' in ln:
            start = resolve_at(ln['at'], marks)
        elif 'after' in ln:
            if ln['after'] not in ends:
                raise SystemExit(f'line "{lid}": "after" must reference an EARLIER line id')
            start = ends[ln['after']] + float(ln.get('gap', 0.25))
        else:
            start = (rows[-1]['end'] + 0.25) if rows else 0.0
        ends[lid] = start + dur_fx
        rows.append({'id': lid, 'who': ln['who'], 'file': os.path.basename(aiff),
                     'start': round(start, 3), 'dur': round(dur_fx, 3),
                     'end': round(start + dur_fx, 3), 'fx': fx,
                     'pan': ln.get('pan', ch.get('pan', 0.0)),
                     'gain': ln.get('gain', 1.0),
                     'overlap_ok': bool(ln.get('overlap'))})

    # pacing report: flag talk-over that wasn't asked for
    prev = None
    for r in sorted(rows, key=lambda r: r['start']):
        if prev and r['start'] < prev['end'] - 0.03 and not r['overlap_ok']:
            print(f'  ⚠ overlap: "{r["id"]}" starts {prev["end"] - r["start"]:.2f}s '
                  f'before "{prev["id"]}" ends (set "overlap": true if intended)')
        prev = r

    manifest = {'name': sess.get('name', 'session'), 'bed': sess.get('bed'), 'lines': rows}
    with open(os.path.join(outdir, 'manifest.json'), 'w') as fh:
        json.dump(manifest, fh, indent=2)
    with open(os.path.join(outdir, 'timeline.txt'), 'w') as fh:
        for r in sorted(rows, key=lambda r: r['start']):
            fh.write(f'{r["start"]:7.2f} – {r["end"]:7.2f}  {r["who"]:<10} {r["id"]}'
                     f'{"  fx=" + r["fx"] if r["fx"] else ""}\n')
    write_mix(manifest, outdir)
    return manifest


def write_mix(man, outdir):
    rows = man['lines']
    bed = man.get('bed')
    inputs, graph, labels = [], [], []
    for i, r in enumerate(rows):
        idx = i + (1 if bed else 0)
        inputs.append(f'-i "{r["file"]}"')
        p = max(-1.0, min(1.0, float(r['pan'] or 0)))
        lg, rg = (1 - p) / 2 + 0.35, (1 + p) / 2 + 0.35   # gentle constant-ish power pan
        fx = (FX[r['fx']] + ',') if r.get('fx') in FX else ''
        ms = int(round(r['start'] * 1000))
        graph.append(f'[{idx}:a]{fx}aresample=44100,'
                     f'pan=stereo|c0={lg:.2f}*c0|c1={rg:.2f}*c0,'
                     f'adelay={ms}|{ms},volume={r["gain"]}[l{i}]')
        labels.append(f'[l{i}]')
    if len(rows) > 1:
        graph.append(f'{"".join(labels)}amix=inputs={len(rows)}:duration=longest:normalize=0[vo]')
    else:
        graph.append(f'{labels[0]}anull[vo]')
    if bed:
        graph.append('[vo]asplit=2[vo1][vo2]')
        graph.append('[0:a][vo1]sidechaincompress=threshold=0.02:ratio=10:attack=10:release=400[mus]')
        graph.append('[mus][vo2]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95[mix]')
        pre, out = f'-i "{bed}" ', 'vo-mix.wav'
    else:
        graph.append('[vo]alimiter=limit=0.95[mix]')
        pre, out = '', 'vo.wav'
    sh = os.path.join(outdir, 'vo-mix.sh')
    with open(sh, 'w') as fh:
        fh.write('#!/bin/bash\n'
                 '# generated by voice.py — VO over the score bed, music ducked under speech.\n'
                 '# mux into the picture afterwards, e.g.:\n'
                 '#   ffmpeg -i movie.mp4 -i vo-mix.wav -map 0:v -map 1:a -c:v copy out.mp4\n'
                 'cd "$(dirname "$0")"\n'
                 f'ffmpeg -y {pre}{" ".join(inputs)} \\\n'
                 f'  -filter_complex "{";".join(graph)}" \\\n'
                 f'  -map "[mix]" -ar 44100 {out}\n')
    os.chmod(sh, 0o755)


# ---------------------------------------------------------------------------
# subcommands
# ---------------------------------------------------------------------------
def cmd_render(a):
    with open(a.session) as fh:
        sess = json.load(fh)
    outdir = a.out or os.path.join('media', 'vo', sess.get('name', 'session'))
    man = render_session(sess, outdir, a.dry_run, set(a.only.split(',')) if a.only else None)
    print(f'{"compiled" if a.dry_run else "rendered"} {len(man["lines"])} lines → {outdir}')
    print(open(os.path.join(outdir, 'timeline.txt')).read(), end='')
    if not a.dry_run and a.mix:
        subprocess.run(['bash', os.path.join(outdir, 'vo-mix.sh')], check=True)


def cmd_audition(a):
    lines, t = [], 0.0
    who = a.voice or 'howie'
    for p in PERF:
        lines.append({'id': f'perf_{p}', 'who': who, 'at': t, 'perf': p, 'text': SAMPLE,
                      'overlap': True})   # files are auditioned solo — timeline is nominal
        t += 8
    for rf in RIFFS:
        for w in (who, 'jim'):
            lines.append({'id': f'riff_{rf}_{w}', 'who': w, 'at': t, 'text': f'[riff {rf}]',
                          'overlap': True})
            t += 3
    sess = {'name': 'audition', 'lines': lines}
    render_session(sess, os.path.join('media', 'vo', 'audition'), a.dry_run)
    print('audition files in media/vo/audition — listen with:  '
          'for f in media/vo/audition/*.aiff; do echo $f; afplay $f; done')


def cmd_selftest(a):
    if shutil.which('say') is None:
        raise SystemExit('selftest needs macOS `say` — run it on the Mac.')
    outdir = os.path.join('media', 'vo', 'selftest')
    os.makedirs(outdir, exist_ok=True)
    ok = True
    battery = {'commands': '[[rate 200]] fast [[rate 120]] slow [[pbas +6]] high '
                           '[[pbas -6]] low [[emph +]] PUNCH [[slnc 400]] done'}
    for rf, spec in RIFFS.items():
        battery[f'riff_{rf}'] = tune_block(spec, 110)
    for name, text in battery.items():
        txt = os.path.join(outdir, f'{name}.txt')
        aiff = os.path.join(outdir, f'{name}.aiff')
        open(txt, 'w').write(text + '\n')
        r = subprocess.run(['say', '-v', a.voice, '-o', aiff, '-f', txt],
                           capture_output=True, text=True)
        dur = probe_duration(aiff) if r.returncode == 0 else None
        good = r.returncode == 0 and dur and dur > 0.12
        ok &= bool(good)
        print(f'  {"PASS" if good else "FAIL"}  {name}'
              f'{f"  ({dur:.2f}s)" if dur else "  " + r.stderr.strip()[:80]}')
    print('all good — this voice honours embedded commands + TUNE' if ok else
          f'FAILURES — voice "{a.voice}" may not support embedded commands; try a CLASSIC voice')
    sys.exit(0 if ok else 1)


def cmd_voices(a):
    if shutil.which('say') is None:
        raise SystemExit('needs macOS `say`.')
    out = subprocess.run(['say', '-v', '?'], capture_output=True, text=True).stdout
    for line in out.splitlines():
        name = line.split(' ')[0]
        print(('★ ' if name in CLASSIC else '  ') + line)
    print('\n★ = classic voice: honours [[embedded commands]] and TUNE riffs')


def main():
    ap = argparse.ArgumentParser(description='expressive VO compiler/renderer (see tools/VOICE-DIRECTION.md)')
    sub = ap.add_subparsers(dest='cmd', required=True)
    r = sub.add_parser('render', help='render a session JSON to per-line AIFFs + mix script')
    r.add_argument('session')
    r.add_argument('--out')
    r.add_argument('--dry-run', action='store_true', help='compile + timeline only (works off-Mac)')
    r.add_argument('--only', help='comma-separated line ids to re-render')
    r.add_argument('--mix', action='store_true', help='run the generated vo-mix.sh')
    r.set_defaults(fn=cmd_render)
    au = sub.add_parser('audition', help='render every preset + riff as listenable files')
    au.add_argument('--voice', help='cast key to audition with (default howie)')
    au.add_argument('--dry-run', action='store_true')
    au.set_defaults(fn=cmd_audition)
    st = sub.add_parser('selftest', help='verify embedded commands + TUNE against a voice')
    st.add_argument('--voice', default='Alex')
    st.set_defaults(fn=cmd_selftest)
    vo = sub.add_parser('voices', help='list installed voices, classic ones starred')
    vo.set_defaults(fn=cmd_voices)
    a = ap.parse_args()
    a.fn(a)


if __name__ == '__main__':
    main()
