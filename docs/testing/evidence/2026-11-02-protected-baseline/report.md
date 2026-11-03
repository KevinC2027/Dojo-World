# Protected combat browser smoke results

Commit: `0b84692b5f3bf24bcdf10837935f7877a9e16a94`
Source SHA-256: `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b`

**25/25 passed; 0 failed.**

Browser: Chromium 154.0.8037.57. No dependency installation.

| Profile | Check | Result |
| --- | --- | --- |
| desktop | startup-and-render | PASS |
| desktop | natural-opponent-ai | PASS |
| desktop | movement-and-sidestep | PASS |
| desktop | guard-hold-release | PASS |
| desktop | attack-P | PASS |
| desktop | attack-K | PASS |
| desktop | attack-L | PASS |
| desktop | attack-T | PASS |
| desktop | out-of-range-whiff | PASS |
| desktop | guard-chip-and-blockstun | PASS |
| desktop | buffered-punch-kick-chain | PASS |
| desktop | timeout-win | PASS |
| desktop | timeout-draw | PASS |
| desktop | ring-out | PASS |
| desktop | ko-next-round-match-rematch | PASS |
| desktop | browser-errors | PASS |
| mobile-chromium-emulation | startup-and-render | PASS |
| mobile-chromium-emulation | movement-and-sidestep | PASS |
| mobile-chromium-emulation | guard-hold-release | PASS |
| mobile-chromium-emulation | attack-P | PASS |
| mobile-chromium-emulation | attack-K | PASS |
| mobile-chromium-emulation | attack-L | PASS |
| mobile-chromium-emulation | attack-T | PASS |
| mobile-chromium-emulation | ko-next-round-match-rematch | PASS |
| mobile-chromium-emulation | browser-errors | PASS |

Source bytes and Git worktree remained unchanged.

The protected October 31 combat snapshot is smoke-verified as the provisional playable baseline for the tested Chromium profiles. It is not confirmed as the latest approved production version. Browser page-error and console-error collections were empty in both profiles. Screenshots were also inspected for visible arena, fighters, HUD and controls.

Desktop covers 16 checks; touch-emulated mobile Chromium covers nine. Near-range first-hit damage was observed through real inputs: P 8 HP, K 14 HP, launcher 16 HP and throw 22 HP in each profile. Throw/launcher victims were observed through landing, down, getup and idle. Controlled KO cases reached the next round, two-win match-over and real canvas-input rematch. Opponent AI was separately observed under normal startup without state fixtures.

The root protected snapshot has swept P/K contact enabled (`XIAO_SWEEP=1`); the earlier partial prototype differs.

Scope and limitations:

- Chromium desktop and mobile emulation only; no physical device or WebKit/Safari test.
- Controlled scenarios use disclosed runtime state fixtures and Playwright clock control.
- Clock-stepped functional tests do not measure real-time frame rate or latency. Most controlled attack cases use the default human Red fighter; this is not a complete two-fighter move-variant regression.
- No full natural match, complete move-variant regression, biomechanics/visual acceptance or Rapier/world integration claim.
- Direct file navigation is blocked by browser policy; unchanged source served by temporary loopback HTTP server.
- No source edits, dependency installs, commits, pushes or merges. Temporary server and browser stopped.

Reproduce with the existing Python Playwright and Chromium installations:

```sh
python3 /workspace/source-recovery-audit/runtime-baseline/browser_smoke.py
```

Detailed evidence: results.json and per-profile trace JSON in this directory.
Screenshots: desktop-startup.png and mobile-chromium-emulation-startup.png; match-over captures where successful.
