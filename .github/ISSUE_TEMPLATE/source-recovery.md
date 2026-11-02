---
name: Source recovery / audit task
about: Import, verify, or audit preserved Dojo World sources without changing gameplay
title: "[recovery] "
labels: []
assignees: []
---

## Objective
Describe one bounded, source-backed recovery/audit task.

## Verified source or artifact
Exact current repository path, archive name, commit SHA, or file reference.

## Missing/uncertain facts
Which facts are unverified? Never infer a complete game from an isolated demo.

## Allowed operations
Read-only inspection, metadata inventories, safe validation, or importing *unaltered* verified source on a new branch.

## Prohibited operations
No gameplay edits, cross-branch integration, production promotion, automatic merge, or API keys.

## Acceptance criteria
- [ ] Source provenance and file inventory documented
- [ ] Tests performed and their coverage/limitations recorded
- [ ] No existing game logic changed
- [ ] PR opened for human review with missing items listed
