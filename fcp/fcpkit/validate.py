"""Pre-flight validation for generated FCPXML.

FCP's importer fails with vague errors, so we catch the common killers first:
malformed XML, dangling refs, times that aren't frame-aligned, and negative
or zero durations. Optionally runs xmllint against Apple's DTD if you have it
(FCP ships one inside the app bundle).
"""
from __future__ import annotations

import shutil
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

from .timing import Timebase, parse_time

TIME_ATTRS = ("offset", "duration", "start", "tcStart")


def validate(path: str | Path) -> list[str]:
    """Returns a list of problems; empty list = ready for FCP."""
    problems: list[str] = []
    try:
        tree = ET.parse(path)
    except ET.ParseError as e:
        return [f"XML parse error: {e}"]
    root = tree.getroot()
    if root.tag != "fcpxml":
        return [f"root element is <{root.tag}>, expected <fcpxml>"]

    resources = root.find("resources")
    ids = {el.get("id") for el in resources.iter() if el.get("id")} if resources is not None else set()

    fmt = resources.find("format") if resources is not None else None
    tb = None
    if fmt is not None and fmt.get("frameDuration"):
        fd = parse_time(fmt.get("frameDuration"))
        tb = Timebase(1 / fd)
    else:
        problems.append("no <format> with frameDuration in resources")

    for el in root.iter():
        ref = el.get("ref")
        # text-style-ref points at a text-style-def, not a resource.
        if ref and el.tag != "text-style-ref" and ref not in ids:
            problems.append(f"<{el.tag}> references missing resource {ref!r}")
        for attr in TIME_ATTRS:
            val = el.get(attr)
            if not val:
                continue
            try:
                t = parse_time(val)
            except ValueError:
                problems.append(f"<{el.tag}> {attr}={val!r} is not a valid time")
                continue
            if attr == "duration" and t <= 0:
                problems.append(f"<{el.tag}> has non-positive duration {val}")
            if tb and not tb.is_aligned(t):
                problems.append(f"<{el.tag}> {attr}={val} is not frame-aligned "
                                f"(frameDuration {tb.frame_duration_str()})")

    # text-style-ref integrity (defs are scoped to the document).
    def_ids = {d.get("id") for d in root.iter("text-style-def")}
    for r in root.iter("text-style-ref"):
        if r.get("ref") not in def_ids:
            problems.append(f"text-style-ref {r.get('ref')!r} has no text-style-def")
    dup = [i for i in def_ids if i and sum(1 for d in root.iter("text-style-def") if d.get("id") == i) > 1]
    for i in dup:
        problems.append(f"duplicate text-style-def id {i!r}")
    return problems


def dtd_validate(path: str | Path, dtd: str | Path) -> tuple[bool, str]:
    """Validate against Apple's DTD with xmllint, if both are available.

    The DTD ships inside Final Cut:
    /Applications/Final Cut Pro.app/Contents/Resources/FCPXMLv1_10.dtd
    """
    if shutil.which("xmllint") is None:
        return False, "xmllint not installed (macOS has it by default)"
    proc = subprocess.run(["xmllint", "--noout", "--dtdvalid", str(dtd), str(path)],
                          capture_output=True, text=True)
    return proc.returncode == 0, proc.stderr.strip() or "valid"
