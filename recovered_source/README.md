# Dojo World - RECOVERED SOURCE CODE (Codex handoff)

**Created:** November 2, 2026
**Status:** preserved source handoff; game development paused.

This is REAL SOURCE, copied from previously saved Dojo World project archives, not an AI recreation. Several independent code branches are included and must NOT be merged automatically. Some files are historical or experimental; do not assert that this package is a single final integrated game.

## Start here
- `index.html` - primary playable combat snapshot, taken byte-for-byte from archived `Dojo_World_Combat_Takeover_Candidate_v1.zip` (snapshot dated October 31, 2026). This is the recovered live snapshot in that archive, **not proven identical to the final current live build**. Open this file in a browser to examine the captured combat prototype.
- `harness/` - diagnostic Node tools and capture scripts corresponding to combat snapshots. Most probes are dependency-free; video captures may need `@napi-rs/canvas` and ffmpeg; some scripts reference original absolute paths.
- `specs/`, `evidence/`, `dojo-world-state.md`, `run-log.md` - preserved original logic, history, test evidence and warnings.
- `candidates/` - experimental/held versions; NOT owner-approved live merges.
- `reference/world-v0.1.17/` - independent world/neighborhood branch (HTML/CSS/JS and tests), NOT imported into combat game.
- `reference/rapier-c0836/` - independent physics-lab source + offline runnable HTML, tests and Rapier dependency (not an integrated combat patch).
- `reference/v3.9/` - historical preserved figure/combat version.
- `AGENTS.md` - read-first Codex instructions.
- `SOURCE_MANIFEST.json` - provenance and SHA-256 hashes for exact recovered files.

## Chromebook → GitHub → Codex (minimal steps)
1. Download this ZIP from your email. On Chromebook, open the Files app and use the built-in ZIP viewer to inspect its contents.
2. If your GitHub repository is empty, you may upload THIS ZIP as a file to `KevinC2027/Dojo-World` and commit it to create `main`. Codex can then extract the ZIP into the repository in a follow-up branch. Alternatively, copy/extract the contents locally and upload the extracted source directly to GitHub.
3. Once GitHub has an initial commit, open https://chatgpt.com/codex, select this repository, and paste the prompt below.

### First Codex task (safe source recovery only)

> Inspect my repository. If it contains only `Dojo_World_Source_Code_Codex_2026-11-02.zip`, extract it safely into the repository root on a new branch and keep the original archive as a recovery artifact. Then inspect AGENTS.md, README.md, SOURCE_MANIFEST.json, and the actual recovered code. Do not write replacement game code, do not merge separate branches (`reference/world-v0.1.17`, `reference/rapier-c0836`, `reference/v3.9`), and do not resume gameplay development. Verify file hashes, identify the runnable combat root, inventory all modules/tests, run only non-destructive checks supported by the repository, and produce a source map plus a pull request for review. Flag missing canonical source or incompatible histories rather than guessing. Never merge without my approval.

## Technical notes
- Root combat source is browser HTML with embedded JavaScript. No guarantee that all original game assets or latest Muse-managed `prototype/index.html` were preserved.
- Some source archives contain a more recent physics lab, which is separate from the playable combat build.
- The original combat archive included a partial `harness/node_modules` directory. This handoff omits it to avoid vendored dependency clutter and installation mismatch. Install dependencies as needed after inspection, not automatically in recovery stage.
- The Rapier lab's supplied compressed dependency is preserved under `reference/rapier-c0836/dependency-offline/` for provenance, not automatic execution.
