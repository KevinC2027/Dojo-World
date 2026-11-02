# First-Attempt Quality Log — Combat Motion Intelligence Layer POC

Directive: Kev, 2026-10-30 ~15:49 CT. Success criterion: reduce creative
correction cycles to reach an acceptable animation. Track first-attempt
quality + revisions per technique.

Baseline build for all comparisons: 2e0e80ad (cycle 141, merged 2026-10-30).
POC outputs are CANDIDATES. Approved animations are never overwritten
automatically. Comparison format per technique: normal-speed video, slow-motion
video, side view, numerical validation.

Revision counts below are derived from the run log during POC setup. Do NOT
fill them from memory. "—" means not yet derived.

| Technique | Classification | Engine move (confirm in POC setup) | Current approved state | First-attempt quality (baseline) | Revisions to acceptance (baseline) | POC candidate build | POC comparison (normal/slow-mo/side/numerical) | Status |
|---|---|---|---|---|---|---|---|---|
| Jab | authentic_core (boxing) | P family — confirm exact move | Approved, swept contact LIVE (connects ~1.21 m) | — | — | — | — | POC not started |
| Rear straight | authentic_core (boxing) | P family — confirm exact move | Approved (see run log for current state) | — | — | — | — | POC not started |
| Roundhouse kick | authentic_core — Muay Thai rear-leg, body/shin, orthodox | K family — confirm exact move | Approved (see run log for current state) | — | — | — | — | POC defined 2026-10-30 (card: technique-cards/pilot-c-muay-thai-rear-leg-roundhouse.md); candidate not built |

## How first-attempt quality is scored (POC setup defines the scale)

- A first attempt is Sonnet's first candidate in a cycle that passes the
  automatic checks (combat-motion-checks.md) and the cycle gates.
- A first attempt counts ONLY if the five pre-generation determinations were
  stated before the diff (spec §0). A diff without them is not a first
  attempt; it is an incomplete submission.
- Quality is recorded as: checks passed on first attempt (n/9), gates passed,
  and Kev's verdict (accepted / correction / rejected) — not a subjective grade.
- Revisions = number of correction cycles before acceptance. The baseline for
  each technique is counted from the historical run log; the POC target is
  fewer revisions for the same technique rebuilt through the layer.

## Notes

- Reference footage: none on file as of 2026-10-30. POC uses approved/rejected
  animations + rig/IK until Kev supplies licensed footage.
- Environment development stays paused; this log covers combat only.
