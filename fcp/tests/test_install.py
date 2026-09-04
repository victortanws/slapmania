"""Installer + self-test coverage: bundle scanning, uid patching, pack
installation into (fake) FCP folders, .molo text-style cloning, verify."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fcpkit import installer, pack as pk
from fcpkit.brand import branded_presets
from fcpkit.selftest import run_verify

FIX = Path(__file__).parent / "fixtures"

MOLO = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ozxmlscene>
<ozml version="5.9">
    <textStyle name="Saved Style">
        <parameter name="Face Color" id="300" flags="0">
            <parameter name="Red" id="1" value="1"/>
            <parameter name="Green" id="2" value="1"/>
            <parameter name="Blue" id="3" value="1"/>
        </parameter>
        <parameter name="Outline Color" id="301" flags="0">
            <parameter name="Red" id="1" value="0"/>
            <parameter name="Green" id="2" value="0"/>
            <parameter name="Blue" id="3" value="0"/>
        </parameter>
    </textStyle>
</ozml>
"""


def fake_fcp(root: Path) -> Path:
    app = root / "Final Cut Pro.app"
    t = app / "Contents" / "Resources" / "Templates.localized"
    for rel in ("Titles.localized/Basic Text.localized/Text.localized/Text.moti",
                "Generators.localized/Elements.localized/Shapes.localized/Shapes.motn",
                "Generators.localized/Elements.localized/Placeholder.localized/Placeholder.motn",
                "Effects.localized/Basics.localized/Drop Shadow.localized/Drop Shadow.moef"):
        f = t / rel
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text("stub")
    return app


def fake_home(root: Path) -> Path:
    home = root / "home"
    (home / "Movies").mkdir(parents=True)
    return home


class TestBundleScan(unittest.TestCase):
    def test_scan_derives_relative_uids(self):
        with tempfile.TemporaryDirectory() as d:
            app = fake_fcp(Path(d))
            got = installer.scan_fcp_effects(app)
        self.assertEqual(sorted(got), ["basic_title", "drop_shadow", "placeholder", "shapes"])
        self.assertEqual(got["basic_title"]["uid"],
                         ".../Titles.localized/Basic Text.localized/Text.localized/Text.moti")
        self.assertEqual(got["shapes"]["name"], "Shapes")

    def test_scan_missing_bundle_is_empty(self):
        self.assertEqual(installer.scan_fcp_effects("/nope/FCP.app"), {})


class TestInstallPack(unittest.TestCase):
    def _pack(self, d: Path) -> Path:
        root = pk.build_pack(d / "dist", name="InstallMe", version="1.0.0", make_zip=False)
        # Add both premium tiers so install has something to place.
        (root / "motion" / "InstallMe tiktok").mkdir(parents=True)
        (root / "motion" / "InstallMe tiktok" / "InstallMe tiktok.moti").write_text("stub")
        (root / "text-styles").mkdir()
        (root / "text-styles" / "InstallMe tiktok.molo").write_text(MOLO)
        return root

    def test_full_install_report(self):
        with tempfile.TemporaryDirectory() as d:
            d = Path(d)
            pack = self._pack(d)
            home = fake_home(d)
            app = fake_fcp(d)
            report = installer.install_pack(pack, home=home, fcp_app=app, open_sample=False)
            text = "\n".join(report)
            self.assertIn("matched 4 built-in template uids", text)
            # Templates landed where FCP looks.
            tpl = (installer.motion_titles_dir(home) / "InstallMe" / "InstallMe tiktok"
                   / "InstallMe tiktok.moti")
            self.assertTrue(tpl.exists(), text)
            molo = installer.text_styles_dir(home) / "InstallMe tiktok.molo"
            self.assertTrue(molo.exists(), text)
            # The boxed presets' Shapes generator carries the scanned uid.
            xml = (pack / "presets" / "submagic.fcpxml").read_text()
            self.assertIn('uid=".../Generators.localized/Elements.localized/'
                          'Shapes.localized/Shapes.motn"', xml)
            # And the harvested registry was saved beside the pack.
            saved = json.loads((pack / "effects.local.json").read_text())
            self.assertIn("shapes", saved)

    def test_install_without_fcp_still_places_files(self):
        with tempfile.TemporaryDirectory() as d:
            d = Path(d)
            pack = self._pack(d)
            home = fake_home(d)
            report = installer.install_pack(pack, home=home, fcp_app=d / "missing.app")
            self.assertTrue(any("not found" in ln for ln in report))
            self.assertTrue((installer.text_styles_dir(home)
                             / "InstallMe tiktok.molo").exists())

    def test_installer_scripts_ship_and_verify_passes(self):
        with tempfile.TemporaryDirectory() as d:
            pack = self._pack(Path(d))
            self.assertTrue((pack / "install.command").exists())
            st = (pack / "install.command").stat().st_mode
            self.assertTrue(st & 0o111, "install.command not executable")
            # verify.command must pass on a fresh pack (linux sha256sum path).
            p = subprocess.run(["bash", str(pack / "verify.command")],
                               capture_output=True, text=True)
            self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
            self.assertIn("OK", p.stdout)


class TestUidPatch(unittest.TestCase):
    def test_patch_by_name_and_validity(self):
        with tempfile.TemporaryDirectory() as d:
            root = pk.build_pack(Path(d), name="P", version="0.0.0", make_zip=False)
            f = root / "presets" / "tiktok.fcpxml"
            n = installer.patch_fcpxml_uids(
                f, {"basic_title": {"name": "Text", "uid": ".../new/Text.moti"}})
            self.assertEqual(n, 1)
            self.assertIn('uid=".../new/Text.moti"', f.read_text())
            # Patching again with the same uid is a no-op.
            self.assertEqual(installer.patch_fcpxml_uids(
                f, {"basic_title": {"name": "Text", "uid": ".../new/Text.moti"}}), 0)


class TestTextStyles(unittest.TestCase):
    def test_clone_per_preset(self):
        with tempfile.TemporaryDirectory() as d:
            d = Path(d)
            tpl = d / "Saved Style.molo"
            tpl.write_text(MOLO)
            made = installer.clone_textstyles(tpl, branded_presets(None), d / "out", prefix="SC")
            names = {p.name for p in made}
            self.assertIn("SC tiktok.molo", names)
            self.assertIn("SC submagic.molo", names)
            # submagic face is gold #FFD400 -> Red 1, Green ~0.831373, Blue 0.
            sub = (d / "out" / "SC submagic.molo").read_text()
            self.assertIn('name="Green" id="2" value="0.831373"', sub)
            self.assertIn("<!DOCTYPE ozxmlscene>", sub)

    def test_useless_template_fails_loudly(self):
        with tempfile.TemporaryDirectory() as d:
            tpl = Path(d) / "weird.molo"
            tpl.write_text('<?xml version="1.0"?>\n<ozml><parameter name="Zzz" value="1"/></ozml>\n')
            with self.assertRaises(ValueError):
                installer.clone_textstyles(tpl, branded_presets(None), Path(d) / "out")
            self.assertFalse(list((Path(d) / "out").glob("*.molo")))


class TestVerify(unittest.TestCase):
    def test_verify_green_without_fcp(self):
        with tempfile.TemporaryDirectory() as d:
            home = fake_home(Path(d))
            r = run_verify(home=home, fcp_app=Path(d) / "missing.app")
        self.assertTrue(r.ok, [row for row in r.rows if not row[1]])
        labels = "\n".join(l for l, _, _ in r.rows)
        self.assertIn("machine-side checks skipped", labels)

    def test_verify_with_fake_fcp_bundle(self):
        with tempfile.TemporaryDirectory() as d:
            d = Path(d)
            r = run_verify(home=fake_home(d), fcp_app=fake_fcp(d))
        self.assertTrue(r.ok, [row for row in r.rows if not row[1]])
        labels = "\n".join(l for l, _, _ in r.rows)
        self.assertIn("harvest built-in template uids", labels)


if __name__ == "__main__":
    unittest.main()
