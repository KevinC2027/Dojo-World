# Dojo World recovered source import (November 2, 2026)

**Status: source archive uploaded in 14 verified parts on a recovery branch. Not yet extracted. Do not resume development or merge automatically.**

This branch preserves a user-owned ZIP containing 179 Dojo World source files: `index.html`, testing harness, specs, logs, and separate references (`reference/world-v0.1.17/`, `reference/rapier-c0836/`, `reference/v3.9/`). The ZIP was too large for a single connector upload, so it was transferred as binary chunks.

SHA-256 of reconstructed ZIP: `f19bbd15d963a93f62d4ce44914cf13f4c78e06bd4a481d5a976fc4850038dc6`.
ZIP byte size: 8047609. File count: 179.

## Codex's next task

In a checkout of `source/recovered-2026-11-02`, run `python3 scripts/reconstruct_source.py` to verify and extract the archive into `recovered_source/`. Review `recovered_source/AGENTS.md` and `recovered_source/SOURCE_MANIFEST.json`. Inspect the source for secrets or unsafe scripts before executing anything. Verify provenance, dependencies, runtime, actual entry points, and tests. Do **not** merge separate engine branches or modify gameplay. Commit the extracted files as a **separate** recovery-only commit to the branch, and propose a pull request for user review. Do not merge before approval.

Do not disable Gmail or Chrome safety checks. This process copies a user-owned archive already recovered from prior artifacts; it does not require the email attachment to be downloaded.
