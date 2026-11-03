# Dojo World — Codex limited-usage autonomous operating procedure

**Effective:** November 3, 2026. **Purpose:** maximize verified combat-physics improvements per included Codex allowance, without extra paid credits. Gameplay physics development is authorized on **isolated candidate branches**, but auto-merging, deployment, purchases, world/MMO integration, and changing archived originals are not.

## Operating model: one bounded experiment per Codex task

**Cheap autonomous machines do measurements; Codex makes engineering decisions.**

- GitHub Actions / local scripts: run existing deterministic traces, 25 Chromium smoke checks, the standalone physics comparator, and evidence hashing. These are **not model calls**, but GitHub Actions minutes and dependency costs still have their own quotas. Prefer on-PR and manual runs, **not hourly scheduled cloud runs**.
- Codex: read one focused issue, form a hypothesis, edit one minimal candidate, inspect failures, and summarize findings. Avoid starting parallel cloud agents and avoid delegated research/reviews that burn the same allowance.
- GitHub: preserve source, defects, reproducible commands, numerical comparisons, video/frame evidence, and the exact next task. A new Codex session should not have to rediscover the history.
- Human review: maintain draft PRs; rejected physics candidates must stay rejected even if browser smoke passes. Only the owner authorizes promotion/merge or expansion into MMO architecture.

## Usage budget policy (soft allocation, not guaranteed metering)

Before each Codex task, read **Settings → Usage** and the actual current allowance/reset. Limits depend on plan, model, complexity, and cloud vs local execution. If no allowance is available, stop rather than adding credits.

For **one available coding window**, aim to allocate approximately:
1. **20% diagnosis:** read root `AGENTS.md`, the active GitHub issue, latest `docs/physics/LEDGER.md`, and only the relevant files. Reuse existing eight-case traces; no full-repo reread or repetitive video generation.
2. **60% one isolated correction:** implement one hypothesis and run scripts/CI; at most **two focused repair revisions** in that task, even if the broader task allows three. Avoid parallel agents and repeatedly open-ended reviews.
3. **20% mandatory checkpoint:** preserve work, structured results and commit SHA in Git; draft PR if meaningful; if failed, mark BLOCKED and record the smallest reproducible next action. Do not expend this reserve trying to make a red gate green.

The percentages are planning targets, not a feature that reads tokens or automatically stops at a quota. **Never promise to finish a cycle or resume automatically on reset.** Stop at the platform cap, report it, and continue on a later explicitly launched task if necessary.

**Model policy:** where offered, prefer a lower-usage model such as GPT-6 Luna for inventory, summarization, triage and writing a checkpoint; GPT-6 Sol/Sol 6.1 for focused math/code improvements; reserve Astra for exceptional unsolved numerical geometry or architecture after other methods have failed. Model availability, consumption, and reasoning controls vary. Choose based on actual Usage dashboard, not assumed fixed message counts.

## Cycle sequence (fully autonomous inside one active task, not unattended forever)

1. **Load tiny context:** active issue #7, root `AGENTS.md`, the `LEDGER` continuation queue, blocked PR #6 comparator results, and only the exact solver/input paths needed. The protected source baseline is `recovered_source/index.html` SHA-256 `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b`.
2. **Measure:** start from protected source for behavior; reuse `tests/physics/` from PR #6 for data. Check eight actual-input throw conditions with observer neutrality and both fighter slots/facings. Do not claim 3D rigid-body realism from kinematic stick-figure proxies.
3. **Pick one hypothesis:** in Cycle 2, investigate why fixed-length carry IK changes velocity/continuity at carry→air and air→recovery. Diagnose transported-pole interpolation, limb fully-extended cases, cache state, and solver handoff **before** code edits. Preserve original move damage, reach, timing, inputs, and endpoints.
4. **Build isolated candidate:** create a new `workbench/` candidate on a fresh feature branch; **do not** use rejected Cycle 1 candidate as approved source, mutate `recovered_source/`, or modify Cycle 1 evidence to hide failures.
5. **Run automated evaluations, no extra model prompts:** exact-source hashes; 8/8 deterministic real-input cases; full kinematic distributions; 25/25 browser smoke checks; optionally one comparison clip for a material, measured change. Inspect FAIL/SKIP/UNRUN and exit codes, never only summary green.
6. **Decide:** physics gate PASS with real improvement and no hard regression → draft PR for review; FAIL → at most two focused corrections, then BLOCKED evidence, no promotion. Passing smoke tests alone is insufficient.
7. **Checkpoint, even at failure:** a compact `docs/physics/LEDGER.md` record containing (i) exact input and source SHA, (ii) defect/hypothesis, (iii) before/after p50/p95/p99/max and error distributions, (iv) checks and skips, (v) current branch/PR SHA, (vi) next **single** action. Put bulk traces in files, not a new large Codex prompt.

## Resume protocol after a limit reset

- Do not automatically start sessions just because time has passed. Check Settings → Usage for the reset.
- In a fresh Codex task, select the branch with the latest **preserved measurement harness and ledger**. Starting from PR #6 history is acceptable for diagnostics, but the *gameplay baseline* is always the protected source, **not** the rejected workbench.
- Paste: `Read AGENTS.md, issue #7, and docs/physics/CODEX_LIMITED_AUTONOMY.md. Resume ONLY the next open physics hypothesis. One candidate, two revisions maximum, preserve 20% for checkpoint, no delegated reviewers, no extra credits, no auto-merge. Use CI and existing traces for validation. Stop at quota or failed gate with a reproducible ledger entry.`
- Each completed task should leave exactly one next-action issue/checkpoint so the following window starts quickly.

## Physical realism and eventual MMO reuse

Treat joint continuity, grip-before-lift, planted-foot slip, contact order, motion impulse/landing and responsiveness as separate measured axes; do not conceal regressions by combining them into one weighted score. True forces, mass-weighted COM and anatomical contact require a later reviewed physics representation. Future server-authoritative MMO needs simulation/presentation decoupling and deterministic replay, but **no network stack or Unreal port is authorized by this procedure**.

## Status of scheduling
No background Codex hourly coding or hourly capture has been configured. A recurring GitHub Actions test is not a Codex coding agent, and a ChatGPT reminder is not a Codex session. Prefer event-driven CI after changes; enable an unattended coding schedule only after its availability, quotas and explicit owner permission are confirmed.
