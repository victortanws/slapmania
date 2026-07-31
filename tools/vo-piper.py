#!/usr/bin/env python3
# ---------------------------------------------------------------------------
# vo-piper.py — Linux/CI fallback voice renderer for voice.py sessions.
#
# Same session JSON as tools/voice.py, rendered with Piper neural voices
# instead of macOS `say` — for containers and preview builds where `say`
# doesn't exist. Markup is honoured where piper can (beats become real
# silence, perf presets map to speed/pitch, the ooo_rise riff is built
# mechanically by pitch-stepping an "Oh!" up +0/+3/+7 semitones), and
# gracefully dropped where it can't (word-level pitch ladders).
#
#   python3 tools/vo-piper.py SESSION.json --marks marks.json \
#       --voices <dir with *.onnx> --out media/vo-piper [--bed score.wav]
#
# Voices (rhasspy/piper release v0.0.2 tarballs): en-gb-alan-low (narrator),
# en-us-ryan-high (howie), en-us-danny-low (jim), en-us-kathleen-low (PA).
# Produces per-line stems + vo-mix.wav (bed sidechain-ducked under speech).
# The Mac `say` pipeline (voice.py) remains the premium path — this one
# trades melodic control for portability.
# ---------------------------------------------------------------------------
import argparse, json, os, re, shutil, subprocess, sys, wave

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import importlib
voice = importlib.import_module('voice')          # TAG_RE, resolve_at, FX, FX_SPEED

try:
    from imageio_ffmpeg import get_ffmpeg_exe
    FFMPEG = get_ffmpeg_exe()
except ImportError:
    FFMPEG = 'ffmpeg'

PIPER_CAST = {
    'narrator':  {'model': 'en-gb-alan-low',    'length': 1.05, 'pitch': -1.0, 'pan': 0.0,  'sil': 0.3},
    'howie':     {'model': 'en-us-ryan-high',   'length': 0.90, 'pitch':  1.0, 'pan': -0.35, 'sil': 0.15},
    'jim':       {'model': 'en-us-danny-low',   'length': 1.02, 'pitch': -3.0, 'pan': 0.35, 'sil': 0.22},
    'announcer': {'model': 'en-us-kathleen-low', 'length': 1.0, 'pitch': 0.0, 'pan': 0.0,  'sil': 0.2},
}
# perf presets → speed multiplier (MULTIPLIES the voice's own — keep the product
# near 1.0-1.3 or lines crawl and start overlapping their own speaker), pitch
# shift (st), gain
PERF_MAP = {
    'plain':   (1.00,  0.0, 1.0),
    'deadpan': (1.08, -0.5, 1.0),
    'murmur':  (1.10, -0.5, 0.8),
    'build':   (0.95,  0.5, 1.05),
    'call':    (0.80,  2.0, 1.25),
    'hype':    (0.82,  1.5, 1.2),
    'drawl':   (1.25, -1.0, 1.0),
    'awe':     (1.15, -0.5, 0.9),
    'panic':   (0.72,  2.5, 1.2),
    'whisper': (1.10, -1.0, 0.6),
}
RIFF_TEXT = {'ohhh': 'Ohhhh!', 'whoa': 'Whoa!', 'no_no_no': 'No, no, no!',
             'gooone': 'Goooone!', 'huh': 'Huh?', 'aww': 'Awww.', 'heyy': 'Heyyy!'}


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(f'command failed: {" ".join(map(str, cmd))}\n{r.stderr[-600:]}')


def wav_dur(path):
    with wave.open(path, 'rb') as w:
        return w.getnframes() / w.getframerate()


def piper_say(text, model, outfile, length, voices, sil=0.2):
    r = subprocess.run(['piper', '--model', os.path.join(voices, model + '.onnx'),
                        '--length_scale', f'{length:.2f}', '--sentence_silence', f'{sil:.2f}',
                        '--output_file', outfile],
                       input=text, capture_output=True, text=True)
    if r.returncode != 0 or not os.path.exists(outfile):
        raise SystemExit(f'piper failed on "{text[:40]}": {r.stderr[-400:]}')


def pitch_shift(src, dst, semitones):
    # asetrate shifts pitch AND speed; atempo undoes the speed so only pitch moves
    if abs(semitones) < 0.05:
        shutil.copyfile(src, dst)      # non-destructive: riffs reuse the source
        return
    f = 2 ** (semitones / 12)
    run([FFMPEG, '-y', '-i', src, '-af',
         f'asetrate=22050*{f:.5f},aresample=22050,atempo={1/f:.5f}', dst])


def concat(parts, dst, gaps_ms):
    # parts interleaved with silences — build via one filter graph
    ins, graph, labels = [], [], []
    for i, p in enumerate(parts):
        ins += ['-i', p]
        graph.append(f'[{i}:a]aresample=22050[p{i}]')
        labels.append(f'[p{i}]')
        if i < len(gaps_ms):
            graph.append(f'aevalsrc=0:d={gaps_ms[i]/1000:.3f}:s=22050[g{i}]')
            labels.append(f'[g{i}]')
    graph.append(f'{"".join(labels)}concat=n={len(labels)}:v=0:a=1[o]')
    run([FFMPEG, '-y', *ins, '-filter_complex', ';'.join(graph), '-map', '[o]', dst])


def render_line(ln, ch, outdir, voices, tmpn):
    """text (voice.py markup) -> one processed mono wav; returns (path, dur)."""
    perf = PERF_MAP.get(ln.get('perf', 'plain'), PERF_MAP['plain'])
    length = ch['length'] * perf[0]
    # split into speakable segments + silence gaps at [beat] / riff boundaries
    segs, gaps, cur = [], [], []
    toks = voice.tokenize(ln['text'])
    def flush(gap_after=0):
        txt = ' '.join(cur).strip()
        if txt:
            segs.append(('text', txt)); cur.clear(); gaps.append(gap_after)
        elif segs and gap_after:
            gaps[-1] += gap_after
    for t in toks:
        if t[0] == 'w':
            cur.append(t[1])
        elif t[2] == 'beat' and not t[1]:
            flush(int(t[3]) if t[3] else 350)
        elif t[2] == 'riff' and not t[1]:
            flush(60)
            segs.append(('riff', t[3])); gaps.append(60)
        # span tags (rise/emph/…) are dropped — piper reads the words flat
    flush()
    if not segs:
        return None, 0

    parts = []
    for i, (kind, val) in enumerate(segs):
        p = os.path.join(outdir, f'{tmpn}_{i}.wav')
        if kind == 'text':
            piper_say(val, ch['model'], p, length, voices, ch.get('sil', 0.2))
        elif val == 'ooo_rise':
            # the awareness ladder, mechanically: one "Oh!" stepped up the scale
            base = os.path.join(outdir, f'{tmpn}_oh.wav')
            piper_say('Oh!', ch['model'], base, length * 0.9, voices, 0.05)
            steps = []
            for k, st in enumerate([0, 3, 7]):
                sp = os.path.join(outdir, f'{tmpn}_oh{k}.wav')
                pitch_shift(base, sp, st)
                steps.append(sp)
            concat(steps, p, [70, 70])
        else:
            piper_say(RIFF_TEXT.get(val, 'Oh!'), ch['model'], p, length, voices, 0.05)
        parts.append(p)
    joined = os.path.join(outdir, f'{tmpn}_j.wav')
    if len(parts) == 1 and not gaps[:len(parts) - 1]:
        os.replace(parts[0], joined)
    else:
        concat(parts, joined, gaps[:len(parts) - 1])
    final = os.path.join(outdir, f'line_{ln["id"]}.wav')
    pitch_shift(joined, final, ch['pitch'] + perf[1])
    return final, wav_dur(final)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('session')
    ap.add_argument('--marks', help='marks.json from a headless render (shot starts + stamps)')
    ap.add_argument('--voices', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--bed', help='score wav to duck under the VO')
    a = ap.parse_args()

    sess = json.load(open(a.session))
    marks = dict(sess.get('marks', {}))
    if a.marks:
        mj = json.load(open(a.marks))
        for s in mj.get('shots', []):
            marks[s['id']] = s['t']
        marks.update(mj.get('extra', {}).get('marks', {}))
    os.makedirs(a.out, exist_ok=True)

    rows, ends = [], {}
    for ln in sess['lines']:
        ch = PIPER_CAST.get(ln['who'])
        if ch is None:
            print(f'  ⚠ no piper cast for "{ln["who"]}" — skipping {ln["id"]}')
            continue
        path, dur = render_line(ln, ch, a.out, a.voices, f'tmp_{ln["id"]}')
        if not path:
            continue
        fx = ln.get('fx')
        dur_fx = dur / voice.FX_SPEED.get(fx, 1.0)
        if 'at' in ln:
            start = voice.resolve_at(ln['at'], marks)
        elif 'after' in ln and ln['after'] in ends:
            start = ends[ln['after']] + float(ln.get('gap', 0.25))
        else:
            start = rows[-1]['end'] + 0.25 if rows else 0.0
        ends[ln['id']] = start + dur_fx
        gain = PERF_MAP.get(ln.get('perf', 'plain'), PERF_MAP['plain'])[2] * float(ln.get('gain', 1.0))
        rows.append({'id': ln['id'], 'file': os.path.basename(path), 'start': round(start, 3),
                     'dur': round(dur_fx, 3), 'end': round(start + dur_fx, 3),
                     'fx': fx, 'pan': ln.get('pan', ch['pan']), 'gain': round(gain, 2)})
        print(f'  {start:7.2f}s  {ln["id"]:<12} {dur_fx:5.2f}s  {ln["who"]}')

    for f in os.listdir(a.out):                       # sweep piper temp segments
        if f.startswith('tmp_'):
            os.remove(os.path.join(a.out, f))
    json.dump({'lines': rows}, open(os.path.join(a.out, 'manifest.json'), 'w'), indent=2)

    # ---- the mix: every stem placed, bed ducked underneath ----
    ins, graph, labels = [], [], []
    if a.bed:
        ins += ['-i', a.bed]
    for i, r in enumerate(rows):
        idx = i + (1 if a.bed else 0)
        ins += ['-i', os.path.join(a.out, r['file'])]
        p = max(-1.0, min(1.0, r['pan'] or 0))
        lg, rg = (1 - p) / 2 + 0.35, (1 + p) / 2 + 0.35
        fx = (voice.FX[r['fx']] + ',') if r.get('fx') in voice.FX else ''
        ms = int(r['start'] * 1000)
        graph.append(f'[{idx}:a]{fx}aresample=44100,pan=stereo|c0={lg:.2f}*c0|c1={rg:.2f}*c0,'
                     f'adelay={ms}|{ms},volume={r["gain"]}[l{i}]')
        labels.append(f'[l{i}]')
    graph.append(f'{"".join(labels)}amix=inputs={len(labels)}:duration=longest:normalize=0[vo]'
                 if len(labels) > 1 else f'{labels[0]}anull[vo]')
    if a.bed:
        graph.append('[vo]asplit=2[vo1][vo2]')
        graph.append('[0:a][vo1]sidechaincompress=threshold=0.02:ratio=10:attack=10:release=400[mus]')
        graph.append('[mus][vo2]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95[mix]')
    else:
        graph.append('[vo]alimiter=limit=0.95[mix]')
    out = os.path.join(a.out, 'vo-mix.wav')
    run([FFMPEG, '-y', *ins, '-filter_complex', ';'.join(graph), '-map', '[mix]', '-ar', '44100', out])
    print(f'mixed → {out}')


if __name__ == '__main__':
    main()
