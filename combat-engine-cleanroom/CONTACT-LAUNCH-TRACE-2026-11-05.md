# Launch-frame support contact trace - 2026-11-05

Basis: 2909585b7411b6792c335a88cf4d18948a22d4ae. Clean-room source only.

Blue forward tick 0: both operational stance feet are planted; COM is approximately 3.5mm from the support segment. Tick 1 schedules left-foot swing, but its world location is unchanged and height is 0.035m, the floor ankle height. The old audit immediately removed that foot from support and measured 396.7mm to the other ankle. Tick 2: the same foot has risen to 0.105m and is moving; one contact remains and support offset is 379.8mm. Torso sway begins at tick 1, not before step scheduling. This supports a launch-frame contact-label error and shows that support transfer after actual liftoff still needs work.

Red reverse tick 102: the swinging foot is at 0.0957m, a genuine single-contact sample; the estimated support offset remains 409.7mm. It reaches the floor at tick 103. This is not explained by the launch-frame label.

## Increment

Preserve `planted` as the tracker's existing operational stance/swing flag so step scheduling, in-flight target retention, gameplay and foot planning remain unchanged. Add `groundedContact` to report the still-grounded, stationary swing takeoff frame. The static audit, dynamic capture diagnostic and review overlay consume ground contact consistently. Front-kick foot remains airborne. The static 0.14m threshold is unchanged. New tests validate both fighters at launch and after lift, including dynamic support contact count. This diagnostic correction does not establish actual contact forces or improve the gait animation.

## Executed verification

- Native `npm test`: 167 passed, 0 failed. Not GitHub CI.
- 24-scenario matrix: geometry 24/24, provisional continuity 24/24, static support 6/24. All 18 moving cases remain flagged.
- Blue forward worst now tick 2 at 379.8mm, not tick 1 at 396.7mm; Red reverse worst remains tick 102 at 409.7mm.
- No body poses, rules-engine movement, stride durations, collision or Fuji assets changed. Creator visual acceptance and full movement qualification remain open.
- A process-list diagnostic in this environment returned `fatal library error, lookup self`; the actual test process subsequently completed successfully. The exact output is retained in the review PDF.
