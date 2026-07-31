"""Tests for the sellable layers: brand kits, pack builder, motionizer."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fcpkit import pack as pk
from fcpkit.brand import branded_presets, branded_style, load_brand
from fcpkit.motionize import motionize, recolor_ozml
from fcpkit.styles import PRESETS, get_style, hex_rgba

FIX = Path(__file__).parent / "fixtures"

KIT = {
    "name": "VictorTan",
    "primary": "#FF2D55",
    "secondary": "#5856D6",
    "font": "Montserrat",
    "font_face": "ExtraBold",
}


class TestBrand(unittest.TestCase):
    def test_branding_applies(self):
        s = branded_style(get_style("hormozi"), KIT)
        self.assertEqual(s.highlight_color, hex_rgba("#FF2D55"))
        self.assertEqual(s.font, "Montserrat")
        st = branded_style(get_style("sticker"), KIT)
        self.assertEqual(st.highlight_color, hex_rgba("#5856D6"))  # secondary

    def test_no_kit_is_identity(self):
        self.assertEqual(branded_presets(None), dict(PRESETS))

    def test_load_rejects_nameless(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "b.json"
            p.write_text('{"primary": "#fff000"}')
            with self.assertRaises(ValueError):
                load_brand(p)


class TestPack(unittest.TestCase):
    def test_build_pack_complete_and_valid(self):
        with tempfile.TemporaryDirectory() as d:
            root = pk.build_pack(d, name="TestPack", version="9.9.9",
                                 brand=KIT, make_zip=True)
            names = {p.name for p in root.rglob("*") if p.is_file()}
            for expected in ("README.md", "LICENSE.txt", "manifest.json",
                             "preview.html", "tiktok.fcpxml", "hormozi.fcpxml",
                             "pip-top-right.fcpxml", "pip-bottom-left.fcpxml"):
                self.assertIn(expected, names)
            manifest = json.loads((root / "manifest.json").read_text())
            self.assertEqual(manifest["brand"], "VictorTan")
            self.assertTrue(Path(str(root) + ".zip").exists())
            # Branded color reached the emitted XML.
            xml = (root / "presets" / "hormozi.fcpxml").read_text()
            self.assertIn("Montserrat", xml)
            # Preview shows every preset.
            page = (root / "preview.html").read_text()
            for pname in PRESETS:
                self.assertIn(f"<b>{pname}</b>", page)

    def test_registry_restored_after_pack(self):
        before = dict(PRESETS)
        with tempfile.TemporaryDirectory() as d:
            pk.build_pack(d, brand=KIT, make_zip=False)
        self.assertEqual(dict(PRESETS), before)


class TestMotionize(unittest.TestCase):
    def test_recolor_targets_only_named_blocks(self):
        src = (FIX / "master_moti" / "Master.moti").read_text()
        out, hits = recolor_ozml(src, {"Face Color": (0.1, 0.2, 0.3, 0.9),
                                       "Outline Color": (1.0, 0.5, 0.0, 1.0)})
        self.assertEqual(sorted(hits), ["Face Color", "Outline Color"])
        self.assertIn('name="Red" id="1" flags="16" default="1" value="0.1"', out)
        self.assertIn('name="Opacity" id="4" flags="16" default="1" value="0.9"', out)
        self.assertIn('name="Green" id="2" flags="16" default="0" value="0.5"', out)
        # Untouched lines are byte-identical: size param, red herring, doctype.
        self.assertIn('name="Unrelated Size" id="302" flags="16" default="96" value="96"', out)
        self.assertIn('name="Red Herring" id="1" flags="16" value="0.5"', out)
        self.assertIn("<!DOCTYPE ozxmlscene>", out)
        # Same line count — nothing structural moved.
        self.assertEqual(len(out.split("\n")), len(src.split("\n")))

    def test_motionize_clones_per_preset(self):
        with tempfile.TemporaryDirectory() as d:
            master = Path(d) / "SlapCaps Master"
            master.mkdir()
            (master / "SlapCaps Master.moti").write_text(
                (FIX / "master_moti" / "Master.moti").read_text())
            (master / "thumbnail.png").write_bytes(b"png")
            made = motionize(master, brand=KIT)
            names = sorted(p.name for p in made)
            self.assertEqual(len(made), len(PRESETS))
            self.assertIn("SlapCaps tiktok", names)
            tik = next(p for p in made if p.name.endswith("tiktok"))
            self.assertTrue((tik / "SlapCaps tiktok.moti").exists())
            self.assertTrue((tik / "thumbnail.png").exists())  # support files copied
            # tiktok face is white; hormozi highlight is brand primary in Glow —
            # our fixture has no Glow, but Face Color must reflect font_color.
            moti = (tik / "SlapCaps tiktok.moti").read_text()
            self.assertIn('name="Red" id="1" flags="16" default="1" value="1"', moti)

    def test_motionize_fails_loudly_without_known_params(self):
        with tempfile.TemporaryDirectory() as d:
            master = Path(d) / "Weird Master"
            master.mkdir()
            (master / "Weird Master.moti").write_text(
                '<?xml version="1.0"?>\n<ozml><parameter name="Mystery" value="1"/></ozml>\n')
            with self.assertRaises(ValueError):
                motionize(master)
            self.assertEqual([p for p in Path(d).iterdir() if p.name != "Weird Master"], [])


if __name__ == "__main__":
    unittest.main()
