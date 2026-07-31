"""End-to-end tests for fcpkit. Run from fcp/:  python3 -m unittest discover tests"""
import json
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fcpkit import capcut, fcpxml, translate as tr, validate as val, youtube as yt
from fcpkit.cues import Cue, Doc, parse_srt, select_cues, write_srt
from fcpkit.styles import PRESETS, get_style, hex_rgba, with_overrides
from fcpkit.timing import Timebase, fmt_time, parse_time

FIX = Path(__file__).parent / "fixtures"


def demo_doc(**kw):
    cues = [
        Cue(start=0.5, end=2.0, text="I slapped a volunteer"),
        Cue(start=2.0, end=4.1, text="ninety meters into a cornfield"),
        Cue(start=4.5, end=6.0, text="and the crowd went wild", style="sticker"),
    ]
    return Doc(cues=cues, **kw)


class TestTiming(unittest.TestCase):
    def test_ntsc_snap(self):
        tb = Timebase.from_fps(29.97)
        self.assertEqual(tb.fps, Fraction(30000, 1001))
        t = tb.snap(1.0)
        self.assertTrue(tb.is_aligned(t))
        self.assertEqual(tb.to_frames(1.0), 30)  # 29.97: 1s ≈ frame 30
        self.assertEqual(fmt_time(tb.snap(0)), "0s")

    def test_fmt_parse_roundtrip(self):
        # Fractions may reduce (3003/30000 -> 1001/10000) — value must survive.
        for s in ("3600s", "3003/30000s", "0s"):
            self.assertEqual(parse_time(fmt_time(parse_time(s))), parse_time(s))

    def test_integer_rates(self):
        tb = Timebase.from_fps(25)
        self.assertEqual(fmt_time(tb.snap(0.2)), "1/5s")


class TestCues(unittest.TestCase):
    def test_srt_roundtrip(self):
        srt = "1\n00:00:01,500 --> 00:00:03,000\nhello there\n\n2\n00:00:03,000 --> 00:00:04,250\n<i>general kenobi</i>\n"
        cues = parse_srt(srt)
        self.assertEqual(len(cues), 2)
        self.assertAlmostEqual(cues[0].start, 1.5)
        self.assertEqual(cues[1].text, "general kenobi")  # tags stripped
        back = parse_srt(write_srt(cues))
        self.assertEqual([c.text for c in back], [c.text for c in cues])

    def test_vtt_with_header_and_dedupe(self):
        vtt = ("WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nsame line\n\n"
               "00:00:02.000 --> 00:00:04.000\nsame line\n\n"
               "00:00:04.000 --> 00:00:05.000\nnew line\n")
        cues = parse_srt(vtt)
        self.assertEqual(len(cues), 2)
        self.assertEqual(cues[0].end, 4.0)

    def test_word_synthesis_covers_cue(self):
        c = Cue(start=10.0, end=12.0, text="one two three")
        words = c.ensure_words()
        self.assertEqual(words[0].start, 10.0)
        self.assertEqual(words[-1].end, 12.0)
        self.assertTrue(all(w.end > w.start for w in words))

    def test_master_roundtrip_and_selection(self):
        doc = demo_doc()
        doc.cues[0].ensure_words()[1].emphasize = True
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "m.json"
            doc.save(p)
            back = Doc.load(p)
        self.assertEqual(back.cues[0].words[1].emphasize, True)
        self.assertEqual(select_cues(back, ranges="1-2"), [0, 1])
        self.assertEqual(select_cues(back, match="crowd"), [2])
        self.assertEqual(select_cues(back, t_from=4.2), [2])

    def test_cues_for_lang(self):
        doc = demo_doc()
        doc.translations["es"] = ["a", "b", "c"]
        es = doc.cues_for_lang("es")
        self.assertEqual(es[1].text, "b")
        self.assertEqual(es[1].start, doc.cues[1].start)
        with self.assertRaises(KeyError):
            doc.cues_for_lang("fr")


class TestStyles(unittest.TestCase):
    def test_presets_scale(self):
        s = get_style("tiktok").scaled(1080)
        self.assertAlmostEqual(s.font_size, 100 * 1080 / 1920)

    def test_overrides(self):
        s = with_overrides(get_style("clean"), {"rotation": "-4", "font_color": "#ff0000", "uppercase": "true"})
        self.assertEqual(s.rotation, -4.0)
        self.assertEqual(s.font_color, hex_rgba("#ff0000"))
        self.assertTrue(s.uppercase)
        with self.assertRaises(KeyError):
            with_overrides(s, {"nope": "1"})


class TestFcpxmlTitles(unittest.TestCase):
    def build(self, doc):
        b = fcpxml.build_titles(doc)
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "out.fcpxml"
            b.write(p)
            problems = val.validate(p)
            text = p.read_text()
        return problems, text

    def test_valid_and_styled(self):
        problems, text = self.build(demo_doc())
        self.assertEqual(problems, [])
        self.assertIn("<!DOCTYPE fcpxml>", text)
        self.assertIn("text-style-def", text)
        self.assertIn('rotation="-3"', text)  # sticker preset on cue 3
        root = ET.fromstring(text.split("\n", 3)[3])
        titles = list(root.iter("title"))
        self.assertEqual(len(titles), 3)
        for t in titles:
            self.assertEqual(t.get("lane"), "1")

    def test_karaoke_explodes_words(self):
        doc = demo_doc(default_style="hormozi")
        problems, text = self.build(doc)
        self.assertEqual(problems, [])
        root = ET.fromstring(text.split("\n", 3)[3])
        titles = list(root.iter("title"))
        # hormozi cues explode per word: 4 + 5 words; sticker cue stays 1 title.
        self.assertEqual(len(titles), 4 + 5 + 1)

    def test_emphasis_creates_highlight_run(self):
        doc = demo_doc()
        for w in doc.cues[1].ensure_words():
            if w.text == "cornfield":
                w.emphasize = True
        problems, text = self.build(doc)
        self.assertEqual(problems, [])
        self.assertIn(fcpxml._rgba(get_style("tiktok").highlight_color), text)

    def test_translation_export(self):
        doc = demo_doc()
        doc.translations["es"] = ["golpeé a un voluntario", "noventa metros", "y la multitud enloqueció"]
        b = fcpxml.build_titles(doc, lang="es")
        s = b.tostring()
        self.assertIn("GOLPEÉ", s)  # uppercase preset applied to translation


class TestFcpxmlCaptions(unittest.TestCase):
    def test_multilang_lanes(self):
        doc = demo_doc()
        doc.translations["es"] = ["uno", "dos", "tres"]
        b = fcpxml.build_captions(doc, langs=["en", "es"])
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "caps.fcpxml"
            b.write(p)
            self.assertEqual(val.validate(p), [])
            root = ET.parse(p).getroot()
        caps = list(root.iter("caption"))
        self.assertEqual(len(caps), 6)
        roles = {c.get("role") for c in caps}
        self.assertEqual(roles, {"iTT?captionFormat=ITT.en", "iTT?captionFormat=ITT.es"})
        # Same timings across languages.
        en = [c.get("offset") for c in caps if c.get("role").endswith(".en")]
        es = [c.get("offset") for c in caps if c.get("role").endswith(".es")]
        self.assertEqual(en, es)


class TestPip(unittest.TestCase):
    def test_pip_structure(self):
        b = fcpxml.build_pip(corner="bottom-left", scale=0.3, roundness=0.7)
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "pip.fcpxml"
            b.write(p)
            self.assertEqual(val.validate(p), [])
            root = ET.parse(p).getroot()
        pip = [v for v in root.iter("video") if v.get("lane") == "1"]
        self.assertEqual(len(pip), 1)
        xf = pip[0].find("adjust-transform")
        self.assertEqual(xf.get("scale"), "0.3 0.3")
        filters = [f.get("name") for f in pip[0].findall("filter-video")]
        self.assertEqual(filters, ["Shape Mask", "Drop Shadow"])

    def test_pip_with_media(self):
        b = fcpxml.build_pip(media="/Users/victor/clips/face.mov")
        s = b.tostring()
        self.assertIn("media-rep", s)
        self.assertIn("file:///Users/victor/clips/face.mov", s)


class TestCapcut(unittest.TestCase):
    def test_draft_parse(self):
        cues, warnings = capcut.parse_capcut_draft(FIX / "capcut_draft.json")
        self.assertEqual(len(cues), 3)
        self.assertEqual(cues[0].text, "hello from capcut")
        self.assertAlmostEqual(cues[0].start, 0.5)
        self.assertAlmostEqual(cues[0].end, 2.0)
        self.assertEqual(cues[1].text, "nested content blob")  # JSON-encoded content field
        self.assertEqual(len(warnings), 1)  # the empty segment

    def test_not_a_draft(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "x.json"
            p.write_text("[1,2,3]")
            with self.assertRaises(ValueError):
                capcut.parse_capcut_draft(p)


class TestTranslateOffline(unittest.TestCase):
    def test_worksheet_roundtrip(self):
        doc = demo_doc()
        ws = tr.make_worksheet(doc, "es")
        self.assertIn("I slapped a volunteer", ws)
        filled = "\n".join(
            line + ("" if i == 0 else f"linea {i}")
            for i, line in enumerate(ws.rstrip("\n").split("\n"))
        )
        n = tr.apply_worksheet(doc, "es", filled)
        self.assertEqual(n, 3)
        self.assertEqual(doc.translations["es"][0], "linea 1")

    def test_incomplete_worksheet_rejected(self):
        doc = demo_doc()
        ws = tr.make_worksheet(doc, "es")
        with self.assertRaises(ValueError):
            tr.apply_worksheet(doc, "es", ws)  # nothing filled in


class TestYoutube(unittest.TestCase):
    def test_analyze_fixture(self):
        cues = yt.load_transcript(FIX / "talky.vtt")
        report = yt.analyze(cues, {"title": "Test video", "id": "x", "view_count": 5})
        self.assertIn("Pace", report.markdown)
        self.assertIn("Dead air", report.markdown)  # fixture has a 3s gap
        self.assertTrue(report.chapter_candidates)


class TestValidatorCatchesBadXml(unittest.TestCase):
    def test_misaligned_time_flagged(self):
        bad = """<?xml version="1.0"?>
<fcpxml version="1.10"><resources>
<format id="r1" frameDuration="1001/30000s" width="1080" height="1920"/>
<effect id="r2" name="Text" uid="x"/></resources>
<library><event><project><sequence format="r1" duration="10s" tcStart="0s" tcFormat="NDF"><spine>
<gap offset="0s" start="0s" duration="10s">
<title ref="r2" lane="1" offset="1/3s" duration="1s" name="bad"><text/></title>
<title ref="r9" lane="1" offset="0s" duration="1001/30000s" name="dangling"><text/></title>
</gap></spine></sequence></project></event></library></fcpxml>"""
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "bad.fcpxml"
            p.write_text(bad)
            problems = val.validate(p)
        self.assertTrue(any("not frame-aligned" in x for x in problems))
        self.assertTrue(any("missing resource 'r9'" in x for x in problems))


class TestLearnEffects(unittest.TestCase):
    def test_harvest(self):
        export = """<?xml version="1.0"?>
<fcpxml version="1.11"><resources>
<effect id="r2" name="Basic Title" uid="/real/path/Basic Title.moti"/>
<effect id="r3" name="Shape Mask" uid="RealMaskUID"/>
</resources><library/></fcpxml>"""
        with tempfile.TemporaryDirectory() as d:
            src = Path(d) / "export.fcpxml"
            src.write_text(export)
            save = Path(d) / "effects.local.json"
            got = fcpxml.learn_effects(src, save_to=save)
            self.assertEqual(got["basic_title"]["uid"], "/real/path/Basic Title.moti")
            merged = fcpxml.load_effects(str(save))
            self.assertEqual(merged["shape_mask"]["uid"], "RealMaskUID")
            self.assertIn("drop_shadow", merged)  # defaults still present


if __name__ == "__main__":
    unittest.main()
