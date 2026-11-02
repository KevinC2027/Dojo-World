# Dojo World - Codex source handoff (2 November 2026)

1. The project is PAUSED. Do not perform game development, repair combat, switch engines, or merge candidates until the owner explicitly authorizes resumption. Source recovery, documentation, and read-only validation are permitted.
2. The ROOT `index.html` is an October 31 playable **combat** snapshot recovered verbatim from `Dojo_World_Combat_Takeover_Candidate_v1.zip`, not independently verified as the final live production build. Do not silently promote later candidate files.
3. `reference/world-v0.1.17/` is an independent playable world branch, not part of the root combat runtime. `reference/rapier-c0836/` is a separate 3D Rapier physics lab. `reference/v3.9/` is an older archive. Do not combine codebases without a mapped integration plan and approval.
4. Preserve the owner's selected button-based controls. Dual-stick controls were abandoned. Maintain grounded combat, credible 3D anatomy and contact, and user visual sign-off requirements.
5. Approved plan, once resumed: ordinary move sets for both fighters -> realistic exchanges -> special moves. Do not conflate laboratory throw results with approved in-game animation.
6. Treat `README.txt`, `dojo-world-state.md`, `run-log.md`, specs, and evidence as historical source documents; use verification before asserting a claim about the current code.
7. Keep all modifications on a feature branch, never overwrite originals. Run tests, retain full diff and results, and require owner's review before merges.
8. No credentials, tokens, personal info, or experimental binaries should be added. Native Node dependencies omitted from `harness/node_modules` by design.
9. First task: verify all file structures, distinguish working/playable/experimental/held snapshots, build a read-only source map, and identify any missing original `prototype/index.html` before claiming recovery is complete.
