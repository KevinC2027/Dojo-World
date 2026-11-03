# Dojo World browser smoke regression

Checked-out commit: `fe22c1267f236d35b69cbf6efcace77599c68003`
Source last-modified commit: `unavailable`
Source: `workbench/throw-carry-ik-v1/index.html`
Actual source SHA-256 before: `39e425f2318debf00743700cfb283a89d875901c02e5e9ba75fdcd1b1e96b930`
Actual source SHA-256 after: `39e425f2318debf00743700cfb283a89d875901c02e5e9ba75fdcd1b1e96b930`
Protected October 31 reference SHA-256: `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b`
Runner SHA-256: `d746a8824819cd9e913c52a44e87c6ceffbcbcd966246d35aa09de5484d763dc`

**Gate: PASS. PASS 25; FAIL 0; SKIP 0; UNRUN 0. Expected browser checks: 25.**

Browser: 154.0.8037.57. Python: 3.12.14. Playwright: 1.62.0. Test-side RNG seed: 20261102.

| Profile | Check | Result |
| --- | --- | --- |
| desktop | startup-and-render | PASS |
| desktop | movement-and-sidestep | PASS |
| desktop | guard-hold-release | PASS |
| desktop | attack-P | PASS |
| desktop | attack-K | PASS |
| desktop | attack-L | PASS |
| desktop | attack-T | PASS |
| desktop | ko-next-round-match-rematch | PASS |
| desktop | browser-errors | PASS |
| desktop | natural-opponent-ai | PASS |
| desktop | out-of-range-whiff | PASS |
| desktop | guard-chip-and-blockstun | PASS |
| desktop | buffered-punch-kick-chain | PASS |
| desktop | timeout-win | PASS |
| desktop | timeout-draw | PASS |
| desktop | ring-out | PASS |
| mobile-chromium-emulation | startup-and-render | PASS |
| mobile-chromium-emulation | movement-and-sidestep | PASS |
| mobile-chromium-emulation | guard-hold-release | PASS |
| mobile-chromium-emulation | attack-P | PASS |
| mobile-chromium-emulation | attack-K | PASS |
| mobile-chromium-emulation | attack-L | PASS |
| mobile-chromium-emulation | attack-T | PASS |
| mobile-chromium-emulation | ko-next-round-match-rematch | PASS |
| mobile-chromium-emulation | browser-errors | PASS |

Source preservation verified: True. Initial worktree clean: False. Final worktree clean: False.

A dirty infrastructure development worktree is recorded, not rejected. The source byte-preservation gate applies independently.

## Scope and limitations

- Chromium desktop and mobile touch emulation only; no physical-device or Safari/WebKit validation.
- Runtime fixtures disclose neutral range, health, timer and AI-freeze preparation. Tests use real browser input and the original animation loop, with a fixed test-side RNG seed.
- Clock-stepped checks do not measure real-time frame rate or latency.
- Most controlled attack checks use default human Red; this is not a complete two-fighter move-variant regression.
- No full natural match, biomechanics/animation acceptance, or world/Rapier integration claim.
- The protected baseline hash is a reference; actual candidate source hashes are recorded independently. An optional --require-source-sha256 adds an explicit source identity gate.
- The runner edits no game source, installs no dependencies, and performs no Git commits, pushes or merges. The temporary loopback server and browser are closed after the run.

## Artifacts

- `results.json`: full check results, exact source/runner metadata and infrastructure failures.
- `junit.xml`: 25 browser checks plus one infrastructure/completeness gate; SKIP and UNRUN are labeled distinctly.
- Per-profile trace JSON and available screenshots, including failure captures.
- This output directory was required to be empty before the run; images are never reused from an older run.
