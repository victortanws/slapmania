"""`fcpkit verify` — prove the whole workflow end-to-end on THIS machine.

Runs every stage in a scratch directory with real exports and the real
validators, then checks the Final Cut side of the street (app bundle, preset
folders, DTD) where present. One command, a PASS/FAIL line per stage, exit
code 1 if anything fails — so "it works" is a claim the tool earns, not one
it assumes.
"""
from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

from . import fcpxml, installer, pack as pk
from .cues import Doc, parse_srt
from .styles import PRESETS
from .validate import validate

SAMPLE_SRT = """1
00:00:00,400 --> 00:00:02,100
verify the entire chain

2
00:00:02,100 --> 00:00:04,000
from words to final cut

3
00:00:04,000 --> 00:00:06,200
with nothing taken on faith
"""


class _Run:
    def __init__(self):
        self.rows: list[tuple[str, bool, str]] = []

    def step(self, label: str):
        run = self

        class _Ctx:
            def __enter__(self):
                return self

            def __exit__(self, et, ev, tb):
                if et is None:
                    run.rows.append((label, True, ""))
                    return True
                run.rows.append((label, False, f"{et.__name__}: {ev}"))
                return True  # keep going; report everything
        return _Ctx()

    @property
    def ok(self) -> bool:
        return all(okay for _, okay, _ in self.rows)


def run_verify(home: str | Path = Path.home(),
               fcp_app: str | Path = installer.FCP_APP) -> _Run:
    r = _Run()
    tmp = Path(tempfile.mkdtemp(prefix="fcpkit-verify-"))
    try:
        doc = None
        with r.step("parse SRT -> master doc"):
            cues = parse_srt(SAMPLE_SRT)
            assert len(cues) == 3, f"expected 3 cues, got {len(cues)}"
            doc = Doc(cues=cues)

        with r.step(f"export + validate all {len(PRESETS)} caption presets"):
            for name in PRESETS:
                d = Doc(cues=parse_srt(SAMPLE_SRT), default_style=name)
                out = tmp / f"cap-{name}.fcpxml"
                fcpxml.build_titles(d, project_name=f"verify {name}").write(out)
                problems = validate(out)
                assert not problems, f"{name}: {problems}"

        with r.step("boxed presets carry a Shapes layer under every title"):
            root = ET.parse(tmp / "cap-submagic.fcpxml").getroot()
            boxes = [v for v in root.iter("video") if v.get("name") == "caption box"]
            titles = list(root.iter("title"))
            assert boxes and len(boxes) == len(titles), (len(boxes), len(titles))

        with r.step("bilingual captions, frame-identical timings"):
            doc.translations["es"] = ["[es] " + c.text for c in doc.cues]
            out = tmp / "captions-en-es.fcpxml"
            fcpxml.build_captions(doc, langs=["en", "es"]).write(out)
            assert not validate(out)
            root = ET.parse(out).getroot()
            offs = {}
            for c in root.iter("caption"):
                offs.setdefault(c.get("role")[-2:], []).append(c.get("offset"))
            assert offs["en"] == offs["es"], "translation timing drifted"

        with r.step("PIP: rounded / circle / rect, framed, all valid"):
            for shape in ("rounded", "circle", "rect"):
                out = tmp / f"pip-{shape}.fcpxml"
                fcpxml.build_pip(shape=shape, frame_color=(1, 1, 1, 1)).write(out)
                assert not validate(out), shape
            root = ET.parse(tmp / "pip-circle.fcpxml").getroot()
            clip = [v for v in root.iter("video") if v.get("name", "").startswith("PIP (")][0]
            assert clip.find("adjust-crop") is not None, "circle lost its square crop"

        with r.step("pack build: files complete, checksums honest"):
            pack_root = pk.build_pack(tmp / "dist", name="VerifyPack", version="0.0.1",
                                      make_zip=False)
            manifest = json.loads((pack_root / "manifest.json").read_text())
            for rel, sha in manifest["files"].items():
                if rel == "manifest.json":
                    continue
                actual = hashlib.sha256((pack_root / rel).read_bytes()).hexdigest()
                assert actual == sha, f"checksum mismatch: {rel}"

        with r.step("installer: uid patch keeps files valid"):
            fake = {"basic_title": {"name": "Text", "uid": ".../Titles.localized/X/Text.moti"}}
            target = tmp / "cap-tiktok.fcpxml"
            n = installer.patch_fcpxml_uids(target, fake)
            assert n == 1 and not validate(target)

        # ---- machine-side checks (informational on non-mac, real on the Mac)
        app = Path(fcp_app).expanduser()
        if app.is_dir():
            with r.step("Final Cut bundle: harvest built-in template uids"):
                got = installer.scan_fcp_effects(app)
                assert "basic_title" in got, f"only found {sorted(got)}"
            with r.step("FCP preset folders reachable"):
                td = installer.motion_titles_dir(home)
                sd = installer.text_styles_dir(home)
                assert td.parent.parent.exists(), f"no Movies dir under {home}"
                r.rows.append((f"  titles -> {td}", True, ""))
                r.rows.append((f"  text styles -> {sd}", True, ""))
            dtd = app / "Contents" / "Resources" / "FCPXMLv1_10.dtd"
            if dtd.exists() and shutil.which("xmllint"):
                with r.step("Apple DTD validation (xmllint)"):
                    p = subprocess.run(["xmllint", "--noout", "--dtdvalid", str(dtd),
                                        str(tmp / "cap-tiktok.fcpxml")],
                                       capture_output=True, text=True)
                    assert p.returncode == 0, p.stderr.strip()[:300]
        else:
            r.rows.append((f"Final Cut app not found at {app} — machine-side "
                           "checks skipped (run this on the editing Mac)", True, ""))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return r
