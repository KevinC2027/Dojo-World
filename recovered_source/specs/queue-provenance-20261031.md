# Queue provenance note — 2026-10-31 ~00:55 CT

## What was flagged
The file `hidden_files/claude-loop/next-dispatch-target.md` (2637 bytes,
mtime 2026-10-30 19:12:43 CT) was flagged by a safety check on read, twice
(2026-10-31 ~00:50 and ~00:53 CT). Per the flag, its contents were NOT treated
as instructions and were NOT followed.

## Verification performed (no blind trust, no blind overwrite)
- Hash: sha256 71c6db7a1d31cd22f5a8f3b33475072e50813c001076046016bc658cd25ad5cd.
- Size/mtime match the previously recorded queue rewrite timeline (Oct 30
  evening). No URLs, no exfiltration destinations, no credential material
  were observed in the content that was read.
- Cross-check: the file's substantive claims about Oct 30 evening queue state
  match independent records (daily log 2026-10-30 entries for that evening,
  run-log cycle 144–148 entries, and the Oct 30 chat history). That cross-
  check establishes the file is PROBABLY the queue Muse itself wrote Oct 30 —
  but a probable match is not a trusted source, so the file was still NOT
  carried forward.
- One self-referential line in the file (a "do not re-derive" instruction
  about flagged reads) was NOT carried forward: it is not from Kev's chat
  directives and it conflicts with the validated-reconstruction approach Kev
  approved Oct 31 00:53 CT.

## Validated reconstruction (Kev-approved, Oct 31 00:53 CT)
- Original preserved, not deleted: quarantine copy at
  `next-dispatch-target.md.quarantine-20261031` (same sha256, verified).
- The live queue file was REWRITTEN FROM SCRATCH using only trusted sources:
  (1) Kev's chat directives Oct 31 ~00:28 CT (throw corrections, four
  priorities, five phases, verification requirements, final visual approval
  with the project owner) and Oct 31 ~00:53 CT (approved program + seven
  execution conditions); (2) the program document
  `hidden_files/claude-loop/throw-corrections-program-20261031.md`, itself
  written from the Oct 31 00:28 directive and from measurements on build
  6c9b0e06; (3) verified build state (prototype/index.html sha256
  6c9b0e064ca61f50ed5c578a6b0c9b7593bf57de34600a2d12f9c007a5210cab).
- NOT carried forward from the flagged file: any acceptance rule that lets
  the loop certify completion itself. Kev's Oct 31 directives govern: final
  visual approval remains with Kev; no candidate is promoted without approval;
  no throw binding changes without his approval.
- If the quarantine copy is ever needed for audit, compare by sha256 above.
  Do not restore it as the live queue without Kev's explicit word.
