"""fcpkit — captions/PIP/analysis workflow for Final Cut Pro.

    python3 -m fcpkit <command> ...     (run from the fcp/ directory)

Typical flow:
    import  ->  (restyle / translate)  ->  fcpxml | captions  ->  FCP
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from . import capcut, fcpxml, motionize as mo, pack as pk, translate as tr, validate as val, youtube as yt
from .brand import load_brand
from .cues import Cue, Doc, parse_srt, select_cues, write_srt
from .styles import PRESETS, get_style, with_overrides


def _load(path: str) -> Doc:
    return Doc.load(path)


def _parse_set(pairs: list[str]) -> dict[str, str]:
    out = {}
    for p in pairs or []:
        if "=" not in p:
            raise SystemExit(f"--set expects key=value, got {p!r}")
        k, v = p.split("=", 1)
        out[k.strip()] = v.strip()
    return out


def cmd_import(a) -> None:
    src = Path(a.input)
    if src.suffix == ".json":  # CapCut draft
        cues, warnings = capcut.parse_capcut_draft(src)
        for w in warnings:
            print(f"  ! {w}", file=sys.stderr)
        print(f"CapCut draft: {len(cues)} caption segments")
    else:
        cues = parse_srt(src.read_text(encoding="utf-8"))
        print(f"{src.suffix} file: {len(cues)} cues")
    doc = Doc(fps=a.fps, width=a.width, height=a.height, lang=a.lang,
              default_style=a.style, cues=cues)
    doc.save(a.output)
    print(f"wrote {a.output}  (default style: {a.style}, {a.width}x{a.height} @ {a.fps})")


def cmd_styles(a) -> None:
    for name, s in PRESETS.items():
        flags = " ".join(x for x in [
            "karaoke" if s.karaoke else "", "pop-in" if s.pop_in else "",
            f"rot {s.rotation}°" if s.rotation else ""] if x)
        print(f"  {name:<12} {s.blurb}" + (f"  [{flags}]" if flags else ""))
    print("\nOverride any field:  --set font_size=110 --set highlight_color=#34C759 "
          "--set rotation=-4 --set position=0,-620")


def cmd_restyle(a) -> None:
    doc = _load(a.master)
    idx = select_cues(doc, ranges=a.cues, match=a.match, t_from=a.time_from, t_to=a.time_to)
    if not idx:
        raise SystemExit("selection matched no cues")
    if a.style:
        get_style(a.style)  # validate the name early
        for i in idx:
            doc.cues[i].style = a.style
    if a.emphasize:
        import re
        rx = re.compile(a.emphasize, re.IGNORECASE)
        n = 0
        for i in idx:
            for w in doc.cues[i].ensure_words():
                if rx.search(w.text):
                    w.emphasize = True
                    n += 1
        print(f"emphasized {n} words matching /{a.emphasize}/")
    doc.save(a.master)
    what = f"style -> {a.style}" if a.style else "emphasis"
    print(f"updated {len(idx)} cues ({what}); saved {a.master}")


def cmd_fcpxml(a) -> None:
    doc = _load(a.master)
    overrides = _parse_set(a.set)
    if overrides:
        # Apply overrides by materializing a temp preset the doc points at.
        base = get_style(doc.default_style)
        from .styles import PRESETS as reg
        reg["_custom"] = with_overrides(base, overrides)
        doc.default_style = "_custom"
    b = fcpxml.build_titles(doc, project_name=a.name, lang=a.lang,
                            effects=fcpxml.load_effects(a.effects))
    b.write(a.output)
    problems = val.validate(a.output)
    _report(a.output, problems)


def cmd_captions(a) -> None:
    doc = _load(a.master)
    langs = a.langs.split(",") if a.langs else [doc.lang]
    b = fcpxml.build_captions(doc, langs=langs, project_name=a.name)
    b.write(a.output)
    problems = val.validate(a.output)
    _report(a.output, problems, extra=f"languages: {', '.join(langs)}")


def cmd_translate(a) -> None:
    doc = _load(a.master)
    if a.mode == "worksheet":
        p = tr.worksheet_path(a.master, a.to)
        p.write_text(tr.make_worksheet(doc, a.to), encoding="utf-8")
        print(f"wrote {p} — fill the last column, then run:\n"
              f"  python3 -m fcpkit translate {a.master} --to {a.to} --mode apply")
    elif a.mode == "apply":
        p = Path(a.worksheet) if a.worksheet else tr.worksheet_path(a.master, a.to)
        n = tr.apply_worksheet(doc, a.to, p.read_text(encoding="utf-8"))
        doc.save(a.master)
        print(f"merged {n} translated lines for '{a.to}' into {a.master}")
    else:  # auto
        lines = tr.auto_translate(doc, a.to, tone=a.tone)
        doc.save(a.master)
        print(f"translated {len(lines)} cues to '{a.to}' via {tr.MODEL}; saved {a.master}")
    print("export both languages with e.g.:\n"
          f"  python3 -m fcpkit captions {a.master} --langs {doc.lang},{a.to} -o captions.fcpxml")


def cmd_pip(a) -> None:
    b = fcpxml.build_pip(width=a.width, height=a.height, fps=a.fps,
                         duration_s=a.duration, corner=a.corner, scale=a.scale,
                         rotation=a.rotation, roundness=a.roundness,
                         media=a.media, effects=fcpxml.load_effects(a.effects))
    b.write(a.output)
    problems = val.validate(a.output)
    _report(a.output, problems,
            extra=f"{a.corner}, scale {a.scale}, roundness {a.roundness}, rotation {a.rotation}°")


def cmd_yt(a) -> None:
    if a.transcript:
        cues = yt.load_transcript(a.transcript)
        info = {}
    else:
        sub_file, info = yt.fetch(a.url, a.workdir, lang=a.lang)
        cues = yt.load_transcript(sub_file)
        print(f"fetched: {info.get('title')!r} — captions: {sub_file.name}")
    report = yt.analyze(cues, info)
    Path(a.report).write_text(report.markdown, encoding="utf-8")
    print(f"wrote {a.report}")
    if a.master:
        yt.to_doc(cues, fps=a.fps).save(a.master)
        print(f"wrote {a.master} — transcript is now a caption master; "
              "restyle + export it like any other")


def cmd_pack(a) -> None:
    brand = load_brand(a.brand) if a.brand else None
    root = pk.build_pack(a.out, name=a.name, version=a.version, brand=brand,
                         width=a.width, height=a.height, fps=a.fps,
                         make_zip=not a.no_zip,
                         effects=fcpxml.load_effects(a.effects))
    n_files = sum(1 for p in root.rglob("*") if p.is_file())
    print(f"built {root} ({n_files} files, all fcpxml validated)")
    if not a.no_zip:
        print(f"zip:   {root}.zip  <- this is the deliverable you sell")
    print(f"open   {root / 'preview.html'} to see the catalog")


def cmd_motionize(a) -> None:
    brand = load_brand(a.brand) if a.brand else None
    made = mo.motionize(a.master, out_parent=a.out, brand=brand,
                        name_prefix=a.prefix)
    for d in made:
        print(f"  {d}")
    print(f"{len(made)} Motion titles written — they show up in FCP's Titles "
          "browser immediately (restart FCP if the category was new)")


def cmd_learn(a) -> None:
    got = fcpxml.learn_effects(a.export, save_to=a.save)
    for key, eff in got.items():
        print(f"  {key:<14} {eff['name']:<20} {eff['uid']}")
    print(f"saved to {a.save} — future exports use these uids automatically")


def cmd_validate(a) -> None:
    problems = val.validate(a.file)
    _report(a.file, problems)
    if a.dtd:
        ok, msg = val.dtd_validate(a.file, a.dtd)
        print(f"DTD: {'OK' if ok else msg}")


def cmd_srt(a) -> None:
    doc = _load(a.master)
    cues = doc.cues_for_lang(a.lang)
    Path(a.output).write_text(write_srt(cues), encoding="utf-8")
    print(f"wrote {a.output} ({len(cues)} cues)")


def _report(path: str, problems: list[str], extra: str = "") -> None:
    if problems:
        print(f"{path}: {len(problems)} problem(s):", file=sys.stderr)
        for p in problems:
            print(f"  ✗ {p}", file=sys.stderr)
        raise SystemExit(1)
    msg = f"wrote {path} — validated, frame-aligned, ready for File > Import > XML"
    if extra:
        msg += f"  ({extra})"
    print(msg)


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(prog="fcpkit", description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("import", help="SRT/VTT/CapCut draft -> master captions JSON")
    p.add_argument("input")
    p.add_argument("-o", "--output", default="captions.master.json")
    p.add_argument("--fps", type=float, default=29.97)
    p.add_argument("--width", type=int, default=1080)
    p.add_argument("--height", type=int, default=1920)
    p.add_argument("--lang", default="en")
    p.add_argument("--style", default="tiktok", help="default preset (see `styles`)")
    p.set_defaults(fn=cmd_import)

    p = sub.add_parser("styles", help="list caption presets")
    p.set_defaults(fn=cmd_styles)

    p = sub.add_parser("restyle", help="switch selected cues to another preset / add emphasis")
    p.add_argument("master")
    p.add_argument("--cues", help='1-based ranges, e.g. "3-10,15"')
    p.add_argument("--match", help="regex on cue text")
    p.add_argument("--time-from", type=float)
    p.add_argument("--time-to", type=float)
    p.add_argument("--style", help="preset to apply to the selection")
    p.add_argument("--emphasize", help="regex; matching WORDS get the highlight color")
    p.set_defaults(fn=cmd_restyle)

    p = sub.add_parser("fcpxml", help="master -> styled caption titles (FCPXML)")
    p.add_argument("master")
    p.add_argument("-o", "--output", default="captions.fcpxml")
    p.add_argument("--name", default="Captions")
    p.add_argument("--lang", help="export a translation instead of the source language")
    p.add_argument("--set", action="append", help="style override key=value (repeatable)")
    p.add_argument("--effects", help="path to effects.local.json")
    p.set_defaults(fn=cmd_fcpxml)

    p = sub.add_parser("captions", help="master -> real FCP caption lanes (multi-language)")
    p.add_argument("master")
    p.add_argument("-o", "--output", default="fcp-captions.fcpxml")
    p.add_argument("--langs", help="comma list, e.g. en,es,zh")
    p.add_argument("--name", default="FCP Captions")
    p.set_defaults(fn=cmd_captions)

    p = sub.add_parser("translate", help="add a translation lane (same timing)")
    p.add_argument("master")
    p.add_argument("--to", required=True, help="target language code, e.g. es")
    p.add_argument("--mode", choices=["auto", "worksheet", "apply"], default="auto")
    p.add_argument("--worksheet", help="TSV path for apply mode")
    p.add_argument("--tone", default="natural, casual, spoken")
    p.set_defaults(fn=cmd_translate)

    p = sub.add_parser("pip", help="picture-in-picture kit: corner + scale + rounded + shadow")
    p.add_argument("-o", "--output", default="pip.fcpxml")
    p.add_argument("--corner", choices=sorted(fcpxml.PIP_CORNERS), default="top-right")
    p.add_argument("--scale", type=float, default=0.32)
    p.add_argument("--rotation", type=float, default=-2.0)
    p.add_argument("--roundness", type=float, default=0.55)
    p.add_argument("--media", help="file path for the PIP layer (else a Placeholder)")
    p.add_argument("--width", type=int, default=1080)
    p.add_argument("--height", type=int, default=1920)
    p.add_argument("--fps", type=float, default=29.97)
    p.add_argument("--duration", type=float, default=20.0)
    p.add_argument("--effects", help="path to effects.local.json")
    p.set_defaults(fn=cmd_pip)

    p = sub.add_parser("yt", help="fetch + analyze a YouTube video (or local transcript)")
    p.add_argument("url", nargs="?", help="video URL or id (needs yt-dlp)")
    p.add_argument("--transcript", help="analyze a local SRT/VTT instead of fetching")
    p.add_argument("--lang", default="en")
    p.add_argument("--workdir", default="yt-cache")
    p.add_argument("--report", default="yt-report.md")
    p.add_argument("--master", help="also write the transcript as a caption master JSON")
    p.add_argument("--fps", type=float, default=29.97)
    p.set_defaults(fn=cmd_yt)

    p = sub.add_parser("pack", help="build a distributable preset pack (folder + zip)")
    p.add_argument("-o", "--out", default="dist")
    p.add_argument("--name", default="SlapCaps")
    p.add_argument("--version", default="0.1.0")
    p.add_argument("--brand", help="brandkit.json to re-skin every preset")
    p.add_argument("--width", type=int, default=1080)
    p.add_argument("--height", type=int, default=1920)
    p.add_argument("--fps", type=float, default=29.97)
    p.add_argument("--no-zip", action="store_true")
    p.add_argument("--effects", help="path to effects.local.json")
    p.set_defaults(fn=cmd_pack)

    p = sub.add_parser("motionize", help="clone a master Motion title into per-preset .moti variants")
    p.add_argument("master", help="folder of the master template (contains the .moti)")
    p.add_argument("-o", "--out", help="parent dir for the variants (default: next to master)")
    p.add_argument("--brand", help="brandkit.json for the color set")
    p.add_argument("--prefix", help="template name prefix (default from master name)")
    p.set_defaults(fn=cmd_motionize)

    p = sub.add_parser("learn-effects", help="harvest exact effect uids from a real FCP export")
    p.add_argument("export", help="any .fcpxml exported from YOUR Final Cut")
    p.add_argument("--save", default=fcpxml.LOCAL_EFFECTS_FILE)
    p.set_defaults(fn=cmd_learn)

    p = sub.add_parser("validate", help="pre-flight check any FCPXML")
    p.add_argument("file")
    p.add_argument("--dtd", help="path to Apple's FCPXML DTD for strict validation")
    p.set_defaults(fn=cmd_validate)

    p = sub.add_parser("srt", help="master -> plain SRT (for YouTube upload etc.)")
    p.add_argument("master")
    p.add_argument("-o", "--output", default="captions.srt")
    p.add_argument("--lang", help="a translation language instead of the source")
    p.set_defaults(fn=cmd_srt)

    a = ap.parse_args(argv)
    if a.cmd == "yt" and not a.url and not a.transcript:
        ap.error("yt needs a URL or --transcript")
    a.fn(a)


if __name__ == "__main__":
    main()
