#!/usr/bin/env python3
"""Read-only inventory validation for partially recovered Dojo World sources.

No project dependencies, untrusted JS execution, network access, or mutation.
This is NOT a game simulation, browser smoke test, or animation acceptance test.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

REQUIRED = (
    "README.md",
    "AGENTS.md",
    "docs/AUTONOMOUS_WORKFLOW.md",
    "docs/SOURCE_RECOVERY_STATUS.md",
    "docs/COMBAT_SYSTEMS_PLAYBOOK.md",
    "docs/COMBAT_LOGIC_REGISTRY.json",
    "docs/COMBAT_DEVELOPMENT_LOG.md",
    "recovered/combat-mobile-prototype/index.html",
    "reference/rapier-c0829/index.html",
    "reference/neighborhood-v0.1.15/world-visual-overhaul.js",
)

def main():
    missing = [path for path in REQUIRED if not (ROOT / path).is_file()]
    for path in REQUIRED:
        p = ROOT / path
        print(f"{'MISSING' if path in missing else 'PRESENT'} {path}")

    registry = ROOT / "docs/COMBAT_LOGIC_REGISTRY.json"
    if registry.is_file():
        try:
            obj = json.loads(registry.read_text(encoding="utf-8"))
            if not isinstance(obj, dict):
                raise ValueError("Registry root should be a JSON object")
            print(f"REGISTRY JSON VALID: {len(obj)} top-level fields")
        except (OSError, ValueError) as exc:
            print(f"REGISTRY JSON INVALID: {exc}")
            return 1

    for path in ("recovered/combat-mobile-prototype/index.html", "reference/rapier-c0829/index.html"):
        p = ROOT / path
        if p.is_file():
            txt = p.read_text(encoding="utf-8")
            if "<html" not in txt.lower() or "<script" not in txt.lower():
                print(f"HTML BASIC STRUCTURE UNRECOGNIZED: {path}")
                return 1
            print(f"HTML FILE STRUCTURE PRESENT: {path}")

    print("NOTE: No execution/build, runtime collision, gameplay, or visual validation performed.")
    if missing:
        print(f"INCOMPLETE: {len(missing)} files missing")
        return 1
    print("PASS: Expected partial recovery inventory is structurally present.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
