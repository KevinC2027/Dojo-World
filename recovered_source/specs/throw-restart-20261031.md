# Throw Development Restart — 2026-10-31 ~07:29 CT

Kev directive (verbatim substance): "We're going to restart from the beginning of the throwing animation development, and I'm going to provide new info. That way you don't get confused with old instructions."

## What this means

- **Frozen checkpoint:** build e9112cf7 (cycle 155) is preserved as the fallback. Nothing is deleted; prior builds, videos, probes, and baselines remain on disk.
- **Parked, not deleted:** the Oct 31 throw-corrections program and its Phase B–H plan, the Oct 30 facing-flip-during-positioning directive, the translational-flight rule, and the accumulated Oct 30–31 throw constraints do NOT govern new work. They return only if Kev restates them.
- **Held until new info arrives:** throw changes are on hold; cycles run validation-only so no old-direction work continues in the meantime.
- **Clean start:** the new throw program is built ONLY from info Kev provides from here forward — his words, references, and footage.
- **Tools, not targets:** the measurement probes (contact-consistency, movement-authority, replay) remain available to measure new work; they do not carry old targets into the restart.

## Awaiting

Kev's new info. Open scope question for him: does the restart cover the shipped G+P throws as well, or just the ippon line that was being reworked?

## REVERT — Cycle 158 rolled back (2026-10-31 ~08:07 CT, Muse)

- Cause: the 08:00 cycle merged cycle 158 (f055ce27, old-direction Phase C shipped grip work) AFTER Kev's 2026-10-31 ~07:29 throw restart directive, which parked old throw instructions and held throw changes until his new info arrives. The cycle's written job text still pointed at the old program; the restart note had not reached it.
- Action: prototype/index.html restored from hidden_files/baseline-backup-20261019/vf-default-pre-cycle158-20261031.html; sha256 verified back to e9112cf7 (cycle 155). State doc re-embedded from the restored build, header corrected (cycle 158 labeled rolled-back, not live), Drive relay updated + md5-verified, staging commit 3e95388 (not pushed).
- Cycle 158's videos and measurements remain on disk as a set-aside record, NOT live behavior, and were NOT delivered to Kev as progress.
- Standing: throw changes stay HELD until Kev's new info arrives. The hourly loop's written job text still contains the old program — it needs a rewrite to the restart (proposed to Kev, awaiting his yes) so the next cycle does not repeat this.

## NEW INFO ARRIVED + JOB REWRITTEN (2026-10-31 ~08:28–08:35 CT)

- Kev uploaded Dojo_World_Throw_Motion_Reference_Package_2026-10-31.zip (7,434,220 bytes, 21 files). Extracted to hidden_files/claude-loop/throw-reference-20261031/; manifest sha256 spot-checked and matching (README, brief, timing CSV).
- Package scope: build ONE mechanically coherent standing ippon-seoi-nage variant from the ordered event chain (control → kuzushi → tsukuri → kake → release/flight → impact/settle → recovery), compared by named events. Answers the open scope question as ippon-first; shipped G+P throws are NOT the rebuild target (later generalization only).
- Honesty limits written into the job: Kodokan = visit-link-only; IJF = view-only, animation is not footage/mocap; CC-BY morote demo is comparative only, never copy morote grip into ippon; no mocap exists, never invent joint tracks; Kim et al. 2022 timing is drill data (kuzushi ~0.27–0.28 s, tsukuri-kake ~0.50–0.53 s), NOT flight time or mandatory game times; Cycle 150 clip times are presentation times only.
- Cron street-dojo-claude-dev-cycle REWRITTEN per Kev's yes (verified by re-read; next run Sat 2026-10-31 09:00 CDT, interval 1h preserved; title now "Dojo World — dev cycle (throw restart)"). DEVIATION DISCLOSED TO KEV: because the package arrived before the rewrite, the job text points at building from the package, NOT the interim validation-only text he approved. If he prefers validation-only until he reviews the package, flip it on his word.
- BINDING STAYS DEFERRED in the job text: the variant is validated as a variant (harness-forced, labeled as such); it does not replace shipped G+P throws and does not become the gameplay throw without Kev's explicit direction.

## SCOPE CORRECTION APPLIED (2026-10-31 ~08:34–08:45 CT)

- Kev corrected the ippon-only reading: NOT an ippon-only rebuild as next priority. Original approval covered shared structural defects in ACTUAL gameplay throws, incl. shipped G+P variants.
- Phases restored: Phase 1 shared mechanical corrections (head-neck/pelvis-neck connectivity, grip anchoring, balance disruption before launch, single-joint displacement, controlled flight/landing postures, preserve accepted trajectories/timing/functionality) → Phase 2 shipped validation (genuine G+P inputs, both directions, full grip→recovery, normal + slow-mo with diagnostic overlays, documented numeric gates + regression tests) → Phase 3 ippon (verified package event chain, reuse corrected shared mechanics, preserve accepted ippon progress, binding deferred).
- QUEUE WARNING RESOLVED BEFORE JOB CHANGE (per his order): no flagged-read content used. Old live queue (sha 273c4814…) + quarantine (sha 71c6db7a…) + provenance preserved untouched. New governing dispatch file written from Kev's direct chat words only: hidden_files/claude-loop/next-dispatch-target-validated-20261031.md. Provenance record read clean.
- AUTONOMY REVERSAL (Kev ~08:35, "ignore the last line"): the 08:34 "No automatic promotion / I retain final visual approval" line is RETRACTED. Owner out of the routine loop completely; autonomous promotion under gates; reports are passive AUTO-VERIFIED records. (Reading stated to Kev: this retracts that line; correct if misread.)
- Job street-dojo-claude-dev-cycle rewritten + verified (markers confirmed in saved file; next run 09:00 CDT, hourly preserved). Next cycle begins with Phase 1 shipped-throw diagnostics, not an ippon-only rebuild.
- NOT bundled here (still pending Kev's word): movement-authority gate wiring into queue/run-log/MEMORY.md; replay baseline recording in MEMORY.md.

## AUTONOMOUS COMBAT DEVELOPMENT DIRECTIVE APPLIED (2026-10-31 ~08:38–08:50 CT)

- Kev sent the directive in main chat (adopted directly). Verbatim saved: files/dojo-world-autonomous-combat-development-directive-20261031.md. Operating model appended to next-dispatch-target-validated-20261031.md. Metrics log created: hidden_files/claude-loop/pipeline-metrics-20261031.md (tracking begins now; no historical backfill/estimates).
- Pipeline now in job: autonomous problem selection (§1) within Phase 1→2→3; reason-first (§2, five determinations before any diff); isolated build (§3); ten checks + regression + §4 evaluation (reasoning-consistency never certifies authenticity); correction loop max 3 rounds/cycle then genuine-blocker log; §5 record + metrics; §6 escalation triggers; §7 first demo = throw defects, G+P first.
- ADAPTATION 1 (disclosed): directive names Sonnet as developer, but Sonnet API is OFF (credits exhausted); Muse builds + orchestrates under takeover; no credits purchased; Sonnet role resumes only if Kev reloads.
- ADAPTATION 2 / TENSION FLAGGED: directive §6 ("No automatic promotion... isolated until authorized") reintroduces a promotion gate the 08:35 message removed. Implemented as latest word: candidates PRESENTED-ONLY until Kev authorizes promotion; he is out of the intermediate loop. One line from him flips it back to full auto-promotion.
- Unchanged: Phase 1→2→3, package retained, binding deferred, env paused, queue preservation, flagged-read rule.
- Job street-dojo-claude-dev-cycle rewritten + markers verified; next run 09:00 CDT. The 09:00 cycle will select a Phase 1 problem, reason first, build/test/correct in isolation, and PRESENT (not promote).
