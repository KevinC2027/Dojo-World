# Dojo World — Codex instructions

## Operating state
Gameplay development is **paused**. Do not implement, refactor, redesign, or merge gameplay changes until the owner explicitly authorizes resumption.

## Source provenance and isolation
- The `main` branch currently contains the owner's initial README.
- The `recovery/import-source-2026-11-02` branch preserves individually recovered source files from ChatGPT's saved Dojo World project library.
- `recovered/combat-mobile-prototype/index.html` is a preserved self-contained fighting prototype, not independently validated as the latest canonical game.
- `reference/combat-experiments/C0828_Clinch_Followthrough.html` is an isolated experimental combat study, NOT approved production code.
- `reference/rapier-c0829/index.html` is a separate physics experiment.
- `reference/neighborhood-v0.1.15/world-visual-overhaul.js` is one neighborhood module, not the complete neighborhood game.
- `docs/COMBAT_SYSTEMS_PLAYBOOK.md`, `docs/COMBAT_LOGIC_REGISTRY.json`, and `docs/COMBAT_DEVELOPMENT_LOG.md` are engineering references, not proof of the state of a missing or different source branch.
- The separate 179-file ZIP exists in the owner's ChatGPT artifacts but **was not imported wholesale** here. Do not claim that all 179 files are in GitHub. Some other files are still missing.

## Initial Codex task: inventory only
1. Inspect every file actually present on the current branch.
2. Report the working entry points, prerequisites, relevant available tests, and actual gaps.
3. Record the source version and identify code-vs-documentation mismatches.
4. Do NOT synthesize or silently replace unavailable files.
5. Do NOT combine the experimental and preserved branches.
6. Propose an incremental import plan for missing original project sources.
7. Do not merge this branch automatically. Ask for human review and signoff.

## Long-term combat rules (after permission to resume)
- Maintain button-based controls, not the abandoned dual-stick system.
- Prefer grounded 3D biomechanics, realistic contact and gravity, anatomically credible joints and stance recovery.
- Basic move sets first; realistic free-form exchanges second; special moves third.
- Explain supporting foot, force path, target contact, and recovery before source edits.
- Require code verification and visual evidence before claiming an animation fix.
- Preserve decisions, log test evidence, and use isolated feature branches/PRs.
