#!/usr/bin/env python3
"""Re-embed the full current prototype source as the final section of dojo-world-state.md.

Usage: refresh_state_source.py [state_md] [prototype_html]
Defaults resolve inside the street-dojo goal workspace. Idempotent: everything from the
source-section header onward is replaced on each run.
"""
import hashlib
import pathlib
import sys

BASE = pathlib.Path.home() / "workspace/goals/street-dojo-ps5-fighting-game-concept"
MARKER = "## 7. Full current source"

state_path = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else BASE / "files/dojo-world-state.md"
proto_path = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else BASE / "prototype/index.html"

source = proto_path.read_text(encoding="utf-8")
digest = hashlib.sha256(proto_path.read_bytes()).hexdigest()

state = state_path.read_text(encoding="utf-8")
head = state.split(MARKER)[0].rstrip() + "\n"

section = (
    f"\n{MARKER} — prototype/index.html\n\n"
    f"Build sha256: `{digest}`\n\n"
    "```html\n"
    f"{source}"
    "```\n"
)

state_path.write_text(head + section, encoding="utf-8")
print(f"state={state_path} build={digest[:8]} state_bytes={state_path.stat().st_size}")
