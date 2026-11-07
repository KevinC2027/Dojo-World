# Shipped throw comparison

**Physics gate: FAIL; candidate: BLOCKED.**

| Case | Baseline carry length error max (m) | Candidate max (m) |
| --- | --- | --- |
| back-slot0-face+1-gap0.85 | 0.415782451 | 2.77555756e-16 |
| back-slot0-face-1-gap0.85 | 0.415782451 | 2.77555756e-16 |
| back-slot1-face+1-gap0.85 | 0.415657560 | 3.33066907e-16 |
| back-slot1-face-1-gap0.85 | 0.415657560 | 3.33066907e-16 |
| lunge-slot0-face+1-gap0.85 | 0.262078467 | 2.77555756e-16 |
| lunge-slot0-face-1-gap0.85 | 0.262078467 | 2.77555756e-16 |
| lunge-slot1-face+1-gap0.85 | 0.260878736 | 4.4408921e-16 |
| lunge-slot1-face-1-gap0.85 | 0.260878736 | 4.4408921e-16 |

## Regressions / blockers

- back-slot0-face+1-gap0.85: distribution regression (1, 'air', 'step', 'el')
- back-slot0-face+1-gap0.85: distribution regression (1, 'air', 'step', 'er')
- back-slot0-face+1-gap0.85: distribution regression (1, 'air', 'step', 'kl')
- back-slot0-face+1-gap0.85: distribution regression (1, 'carry', 'step', 'el')
- back-slot0-face+1-gap0.85: distribution regression (1, 'carry', 'step', 'er')
- back-slot0-face+1-gap0.85: distribution regression (1, 'carry', 'step', 'kl')
- back-slot0-face+1-gap0.85: distribution regression (1, 'carry', 'step', 'kr')
- back-slot0-face-1-gap0.85: distribution regression (1, 'air', 'step', 'el')
- back-slot0-face-1-gap0.85: distribution regression (1, 'air', 'step', 'er')
- back-slot0-face-1-gap0.85: distribution regression (1, 'air', 'step', 'kl')
- back-slot0-face-1-gap0.85: distribution regression (1, 'carry', 'step', 'el')
- back-slot0-face-1-gap0.85: distribution regression (1, 'carry', 'step', 'er')
- back-slot0-face-1-gap0.85: distribution regression (1, 'carry', 'step', 'kl')
- back-slot0-face-1-gap0.85: distribution regression (1, 'carry', 'step', 'kr')
- back-slot1-face+1-gap0.85: distribution regression (0, 'air', 'step', 'el')
- back-slot1-face+1-gap0.85: distribution regression (0, 'air', 'step', 'er')
- back-slot1-face+1-gap0.85: distribution regression (0, 'air', 'step', 'kl')
- back-slot1-face+1-gap0.85: distribution regression (0, 'carry', 'step', 'el')
- back-slot1-face+1-gap0.85: distribution regression (0, 'carry', 'step', 'er')
- back-slot1-face+1-gap0.85: distribution regression (0, 'carry', 'step', 'kl')
- back-slot1-face+1-gap0.85: distribution regression (0, 'carry', 'step', 'kr')
- back-slot1-face-1-gap0.85: distribution regression (0, 'air', 'step', 'el')
- back-slot1-face-1-gap0.85: distribution regression (0, 'air', 'step', 'er')
- back-slot1-face-1-gap0.85: distribution regression (0, 'air', 'step', 'kl')
- back-slot1-face-1-gap0.85: distribution regression (0, 'carry', 'step', 'el')
- back-slot1-face-1-gap0.85: distribution regression (0, 'carry', 'step', 'er')
- back-slot1-face-1-gap0.85: distribution regression (0, 'carry', 'step', 'kl')
- back-slot1-face-1-gap0.85: distribution regression (0, 'carry', 'step', 'kr')
- lunge-slot0-face+1-gap0.85: distribution regression (1, 'air', 'step', 'el')
- lunge-slot0-face+1-gap0.85: distribution regression (1, 'air', 'step', 'er')
- lunge-slot0-face+1-gap0.85: distribution regression (1, 'air', 'step', 'kl')
- lunge-slot0-face+1-gap0.85: distribution regression (1, 'carry', 'step', 'el')
- lunge-slot0-face+1-gap0.85: distribution regression (1, 'carry', 'step', 'er')
- lunge-slot0-face+1-gap0.85: distribution regression (1, 'carry', 'step', 'kl')
- lunge-slot0-face+1-gap0.85: distribution regression (1, 'carry', 'step', 'kr')
- lunge-slot0-face-1-gap0.85: distribution regression (1, 'air', 'step', 'el')
- lunge-slot0-face-1-gap0.85: distribution regression (1, 'air', 'step', 'er')
- lunge-slot0-face-1-gap0.85: distribution regression (1, 'air', 'step', 'kl')
- lunge-slot0-face-1-gap0.85: distribution regression (1, 'carry', 'step', 'el')
- lunge-slot0-face-1-gap0.85: distribution regression (1, 'carry', 'step', 'er')
- lunge-slot0-face-1-gap0.85: distribution regression (1, 'carry', 'step', 'kl')
- lunge-slot0-face-1-gap0.85: distribution regression (1, 'carry', 'step', 'kr')
- lunge-slot1-face+1-gap0.85: distribution regression (0, 'air', 'step', 'el')
- lunge-slot1-face+1-gap0.85: distribution regression (0, 'air', 'step', 'er')
- lunge-slot1-face+1-gap0.85: distribution regression (0, 'air', 'step', 'kl')
- lunge-slot1-face+1-gap0.85: distribution regression (0, 'carry', 'step', 'el')
- lunge-slot1-face+1-gap0.85: distribution regression (0, 'carry', 'step', 'er')
- lunge-slot1-face+1-gap0.85: distribution regression (0, 'carry', 'step', 'kl')
- lunge-slot1-face+1-gap0.85: distribution regression (0, 'carry', 'step', 'kr')
- lunge-slot1-face-1-gap0.85: distribution regression (0, 'air', 'step', 'el')
- lunge-slot1-face-1-gap0.85: distribution regression (0, 'air', 'step', 'er')
- lunge-slot1-face-1-gap0.85: distribution regression (0, 'air', 'step', 'kl')
- lunge-slot1-face-1-gap0.85: distribution regression (0, 'carry', 'step', 'el')
- lunge-slot1-face-1-gap0.85: distribution regression (0, 'carry', 'step', 'er')
- lunge-slot1-face-1-gap0.85: distribution regression (0, 'carry', 'step', 'kl')
- lunge-slot1-face-1-gap0.85: distribution regression (0, 'carry', 'step', 'kr')

Full unrounded distributions and invariants: comparison.json. Original source remains immutable.
