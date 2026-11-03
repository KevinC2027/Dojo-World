# Browser smoke regression suite

Gameplay development remains paused. This change adds testing infrastructure and preserves evidence; it does not promote a candidate, merge PR #1, or authorize autonomous coding.

## Source and evidence

The provisional combat baseline is `recovered_source/index.html`, recovered in commit `0b84692b5f3bf24bcdf10837935f7877a9e16a94`, SHA-256 `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b`. World, Rapier, historical v3.9 and held candidates remain separate projects and are outside this suite.

[Original evidence](evidence/2026-11-02-protected-baseline/) preserves the original nine artifacts byte-for-byte: report, exact original Python test definitions, result JSON, both profile traces, and four screenshots. `ARTIFACTS.json` records every artifact's size and SHA-256 plus the exact tested source commit/hash. These are original Codex-reported results, not an independent reproduction. Historical absolute paths and unseeded AI observation in those files have intentionally been retained. The original report's statements about no new commits describe that earlier run, not this infrastructure PR.

The portable definitions are [run.py](../../tests/browser_smoke/run.py). They retain the original 25 checks, improve ordered victim-recovery assertions, expose observer errors, and add an exact test-set gate. Unlike the original run, CI sets a disclosed fixed browser-side RNG seed (`20261102`) before the game captures `Math.random`; gameplay source bytes and AI logic are unchanged. Fixtures operate only in browser memory, and real keyboard/touch/canvas events trigger the behavior under test. Playwright's clock advances the original animation loop.

## Run locally

Use Python **3.12.14**. Test-tool dependencies are pinned, separately from the preserved game's dependencies:

```sh
python3 -m venv .venv-browser-smoke
.venv-browser-smoke/bin/python -m pip install -r tests/browser_smoke/requirements.txt
.venv-browser-smoke/bin/python -m playwright install --with-deps chromium
.venv-browser-smoke/bin/python tests/browser_smoke/verify_evidence.py
.venv-browser-smoke/bin/python -m unittest discover -s tests/browser_smoke -p 'test_*.py'
.venv-browser-smoke/bin/python tests/browser_smoke/run.py --output-dir artifacts/browser-smoke
```

Use a fresh/empty output directory for each run. CI uses Playwright's bundled Chromium, pinned by Playwright `1.62.0`. An existing system browser can be selected explicitly, without installing anything:

```sh
python3 tests/browser_smoke/run.py \
  --browser-executable /usr/bin/chromium \
  --require-source-sha256 786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b \
  --output-dir artifacts/browser-smoke-local
```

The optional hash requirement reproduces the protected baseline. The default CI command records the actual proposed source hash rather than hardcoding it as a pass criterion, so a later explicitly authorized candidate can be tested. `--source` can select a reviewed candidate file; it defaults to the recovered combat entry point. Neither option constitutes approval to edit protected sources or activate development.

Each run serves the unchanged source through a temporary loopback HTTP server and closes the server/browser afterward. No external application service, game package installation, API key, hosted preview, or gameplay-file modification is required. Browser dependencies are installed by CI, not by the test runner.

## Checks and pass criteria

Desktop Chromium runs 16 checks; touch-emulated mobile Chromium runs nine. A profile/check pair is unique. The failure gate requires every one of these exact 25 pairs to report `PASS`.

| Check | Profiles | Assertion / fixture scope |
| --- | --- | --- |
| `startup-and-render` | Both | Original intro enters fight; timer progresses; canvas has nonblank opaque pixels; eight controls and finite state are present. |
| `natural-opponent-ai` | Desktop | AI reaches an attack through its ordinary startup loop, with fixed test-side RNG and no state fixture/player attack. |
| `movement-and-sidestep` | Both | Real held forward/back/lateral inputs produce measured position changes; distant, inactive-opponent fixture. |
| `guard-hold-release` | Both | Real held guard enters guard and release returns to idle. |
| `attack-P` | Both | Real punch input, attack state, 8 HP first-hit damage and recovery. |
| `attack-K` | Both | Real kick input, attack state, 14 HP first-hit damage and recovery. |
| `attack-L` | Both | Real launcher input, 16 HP damage, airborne victim, ordered air → down → getup → idle and final idle. |
| `attack-T` | Both | Real guard+punch input (multi-touch on mobile), 22 HP damage, ordered carry → air → down → getup → idle and final idle. |
| `out-of-range-whiff` | Desktop | Real punch starts, but distant target retains full HP and no hit is recorded. |
| `guard-chip-and-blockstun` | Desktop | Grounded/facing guard fixture receives 0.8 HP chip and blockstun, not full punch damage. |
| `buffered-punch-kick-chain` | Desktop | Real timed punch/kick inputs enter a buffered kick chain. |
| `timeout-win` | Desktop | Timer=1 and unequal-HP fixture resolves through normal tick to correct winner. |
| `timeout-draw` | Desktop | Timer=1/equal-HP fixture ends in draw with no awarded win. |
| `ring-out` | Desktop | Opponent placed beyond ring falls under normal gravity and awards correct round. |
| `ko-next-round-match-rematch` | Both | HP=1/range fixtures plus real attack inputs cause KO, next-round reset, two-win match-over and real canvas-input rematch. |
| `browser-errors` | Both | No page errors, console errors or observer errors across the profile. |

Near-range attack/round fixtures recreate neutral fighters and freeze opponent decisions; they are controlled functional checks, not natural full-match footage. State observation reads plain fields and does not call the mutating `pose()` function. Observer/trace failure and nonfinite state fail checks.

## Failure reporting and artifacts

`results.json` distinguishes `PASS`, `FAIL`, `SKIP`, and `UNRUN`, includes infrastructure errors, and records the checked-out commit, actual source hash, source's last-modified commit, test-runner hash, Python/Playwright/Chromium versions, viewport/device settings and RNG seed. On PRs, the checked-out commit can be GitHub's synthetic merge commit; it is the exact tree tested.

`report.md`, `junit.xml`, per-profile traces and available screenshots accompany the JSON. Import, launch and navigation failures still produce a report with declared checks marked unrun. A setup failure cannot become a passing zero-test run. The runner returns nonzero for failed, skipped, unrun, duplicate, missing or unexpected checks, infrastructure errors or source mutation. The dependency-free gate tests exercise these false-green paths.

The `Browser smoke regression` Actions job runs on every pull request without a path filter, on pushes to `main` or `source/recovered-2026-11-02`, and on manual dispatch. It installs pinned test tools and the corresponding Playwright Chromium, runs evidence/gate/browser checks, and uploads artifacts even on failure with 30-day retention. Prior installer/check failures remain job failures. Original committed evidence remains durable after Actions artifacts expire; preserve any future approved milestone evidence in a separate reviewed evidence change.

## Approval and automation limits

A failing Actions job is a regression signal. **GitHub branch protection/rulesets must separately require `Browser smoke regression` before it becomes an enforced merge gate.** This integration could not inspect the branch-protection endpoint (HTTP 403), so enforcement is unconfirmed and no repository protection settings were changed. After reviewing this stacked infrastructure PR and the source-recovery PR, a maintainer should configure that required status check for the applicable protected branch. Never auto-merge.

These checks do not cover physical devices, Safari/WebKit, frame-rate/latency performance, all variants for both fighters, full natural combat exchanges, animation/biomechanical realism, or world/Rapier integration. Those remain separate acceptance gates. This suite does not activate autonomous issue execution or gameplay development.
