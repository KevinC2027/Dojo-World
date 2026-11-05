# Xiao Xiao frame measurements — 2026-11-05

**Scope:** reference documentation only, no gameplay code or release branch modifications. Measurements come from two user-uploaded MP4 clips. This file is not a claim that all nine Xiao Xiao episodes were analyzed.

## Video and metrics

- **Clip 1 / Xiao Xiao #3 battle:** 512x910; 121.115 seconds; 3,632 displayed frames (~29.988 fps). Portrait TikTok repost. Measured combat region x=5..507, y=315..594. Median frame-to-frame changed grayscale area 1.133%; 95th percentile 6.085%. Crowd 0–70s average 1.249%, boss 71–110s average 2.793%; 31.3% of boss frames exceeded a descriptive >=3% motion-change threshold.
- **Clip 2 / arena gameplay:** 910x512; 79.9 seconds; 2,397 displayed frames (30fps). Exact Xiao Xiao episode unverified. Fight region x=37..866, y=120..501. Median change 0.176%; 95th percentile 6.190%. Purple-fighter boss window 55–79s average 1.881%; 30.1% of frames exceeded the >=3% screen. A visible YOU LOSE/reset screen occurs near 67.2s, so the footage is not a single uninterrupted exchange.
- **All 6,029 displayed frames:** per-frame crop/downsampled grayscale difference screened. Change means the percent of fight-region cells whose difference from the preceding frame exceeds 18/255. It is not actor speed, contact, impact force or original Flash keyframe cadence.
- **Purple silhouette candidate in boss windows:** Clip 1 detected in 1,193/1,200 analyzed frames, median bounding height 92.5 video pixels, median centroid step 0.93 pixels/frame and 90th percentile 12.84. Clip 2 detected in 725/747 frames, median height 146 px, median step 0.25 px/frame and 90th percentile 22.89. This is color-component tracking only: occlusion, segmentation swaps, cuts and edited playback can create false jumps.

## Directly inspected pose anchors

| Clip | Time | Frame~ | Visual observation |
| --- | ---: | ---: | --- |
| 1 | 72.0s | 2159 | Black airborne next to crouched purple |
| 1 | 74.4s | 2231 | Black extends kick at close range |
| 1 | 76.8s | 2303 | Purple high kick, black low evasion |
| 1 | 78.0s | 2339 | Purple horizontally supported above black in throw-shaped pose |
| 1 | 81.4s | 2441 | Purple extended high kick |
| 1 | 87.8s | 2633 | Black prone, purple upright |
| 1 | 103.4s | 3101 | Black lifting horizontal purple |
| 1 | 105.0s | 3149 | Aerial counterattack |
| 1 | 107.4s | 3221 | Purple prone, black recovering |
| 2 | 62.4s | 1872 | Purple leg extension against black |
| 2 | 65.6s | 1968 | Both bodies airborne/interacting |
| 2 | 67.2s | 2016 | YOU LOSE/reset — break time continuity |
| 2 | 73.2s | 2196 | Black inverted over purple |
| 2 | 74.8s | 2244 | Black prone, purple upright |
| 2 | 76.0s | 2280 | Purple carrying horizontal black |
| 2 | 77.2s | 2316 | Black standing, purple down |

Those are timestamped pose **observations**, not frame-accurate onset, hit, or throw-release labels. The complete PDF, source MP4-independent CSVs and storyboards were supplied in the conversation analysis package.

## Dojo World implementation guidance

1. Adapt whole-body action readability: preparation, attack, defense/counter, contact consequence, recovery. Do not copy exact copyrighted sequences, music, sprites or unrealistic animation physics.
2. Preserve world-space planted feet, support transfer, extension of support leg, pelvis/spine/head coordination and fixed limb lengths. Blue and Red must be reviewed from side and three-quarter perspectives.
3. Couple strike and opponent response to actual contact normal, body position, velocity and support. Keep posture, root velocity and constraint/contact history across guard/attack, carry/release, airborne/landing and throw/impact boundaries; no hard pose resets or opponent teleporting.
4. For throws, keep grip attached through meaningful contact and release conditions. Preserve gravity, head clearance and natural upper-back-first contact when that technique calls for it; do not allow upward rebounds without physics.
5. Preserve Blue Kung Fu, Red boxing-inspired identity, HIT Fuji visuals, deterministic 60 Hz authoritative rules and the clean-room architecture.
6. Per `MOVEMENT-QUALIFICATION.md` and `ANATOMICAL-MOVEMENT-STANDARD.md`: **do not expand movesets** before both fighters pass independent gait/support and visual acceptance. Existing diagnostics are provisional, not proof of biomechanical naturalness.

**Status:** analysis-only documentation; no executable change, new gameplay test, deploy, or visual acceptance was performed by this commit.
