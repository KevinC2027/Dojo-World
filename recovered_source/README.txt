Dojo World - Combat Project (snapshot 31 October 2026)
=====================================================
Live build: prototype/index.html, sha256 786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b
(promoted 31 Oct ~16:45 CT: no-163 merge of cycles 159, 160, 161, 162, 165, 166; cycle 163 HELD).
Full context: the ChatGPT handoff PDF (Dojo_World_Handoff_to_ChatGPT_2026-10-31.pdf)
and the Google Doc "Dojo World Progress". Kev remains authorizer for every
promotion, binding, and gate change. Hourly Muse cycles are PAUSED.

Layout
------
index.html                  Live build (open in a browser to play; G+P = throw)
harness/                    Node probes and capture scripts (run from this folder)
candidates/                 Isolated builds, NOT live: cycle 163 (HELD),
                            buffer-150 press liveness (presented-only, NOT
                            authorized), full 159-166 merge (rejected: it
                            contains 163's knee regressions)
specs/                      Governing specs (ippon contact constraints v1.1,
                            movement authority, replay, contact diagnostics,
                            legs anatomy, combat-motion checks)
evidence/                   Probe baselines and cycle 165-169 evidence
dojo-world-state.md         State document (also mirrored in the Drive relay)
run-log.md                  Full cycle run log

Running the probes (plain node, no dependencies)
------------------------------------------------
node harness/probe_all_defects.cjs <build.html>        Full defect dump.
  This is the RELIABLE gate comparison. The older diff_contact_consistency.cjs
  compares single maxima only: it mislabels pre-existing defects as NEW and
  hides regressions smaller than the current max. Always compare full dumps.
node harness/probe_contact_consistency.cjs <build.html>
node harness/probe_movement_authority.cjs <build.html>  Expect 15/15 clean.
node harness/probe_replay.cjs <build.html>              Expect 0 divergences.
node harness/probe_rapid_sequence.cjs <build.html>      Expect 4/4 timed,
  mash 53 -> 7 fires, ends idle.
node harness/probe_ippon_constraints.cjs <build.html>   Forced-ippon spec gates.
Most probes take the build path as an argument; a few default to a relative
live path - read the header of each script before running it.

Video capture (needs more)
---------------------------
Capture scripts need node-canvas (@napi-rs/canvas) and ffmpeg. The JS wrapper
is included under harness/node_modules/@napi-rs/canvas, but the 34MB native
binary is NOT in this archive: install it with `npm install @napi-rs/canvas`
(or copy the binary from the original workspace). Capture scripts also carry
an absolute require() path to the original workspace - repoint that path to
your checkout before running them.

Known-open items (see the handoff PDF for numbers)
--------------------------------------------------
1. Shipped-throw knee/foot snap chain: cycles 167 and 169 both blocked.
   Open trilemma: joint carry+flight re-author, rescope the 0.20 m gate, or
   accept the live defects. Do NOT re-attempt per-tick knee clamps (proven to
   relocate, not remove, the snap) and do NOT present v8 as a knee fix.
2. Ippon is UNBOUND from G+P gameplay. Do not bind it without Kev's word.
3. Buffer-150 candidate is presented-only, NOT authorized.
4. Environment work is PAUSED (branch tip 27b8ef1); do not resume it here.
