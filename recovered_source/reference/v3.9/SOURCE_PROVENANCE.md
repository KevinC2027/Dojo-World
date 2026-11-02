# Source provenance and reconciliation

Compiled October 20, 2026 from files retrievable in the project Library. File content is copied unchanged in the `prototype/` archive paths, with SHA-256 checksums stored in `SOURCE_MANIFEST.json`.

## Retrieved source

1. `Street_Dojo_Ring_Motion_v1_1.html` (Library, Oct 20 06:03 UTC) → `prototype/library-snapshots/ring-motion-v1.1.html`.
2. `Street_Dojo_Ring_Motion_v1.html` (Library, Oct 20 05:21 UTC) → `prototype/library-snapshots/ring-motion-v1.html`.
3. `Street_Dojo_Combat_v3_9.html` (Library, Oct 20 04:06 UTC) → `prototype/archived-v3.9/index.html`.

`preview/index.html` copies v1.1, with **only the document `<title>` rebranded** to Dojo World. It is neither a newly implemented engine nor proof of parity with Muse's active file.

## Reported but NOT inspected

- `prototype/index.html`: Muse-reported active Ring Fighter VF engine, reportedly with a post-match park fix.
- `prototype/ring-fighter-vf-pristine.html`: protected clean original.
- `prototype/v3.9/`: Muse-reported archived project directory; the Library v3.9 HTML here is a separate snapshot and may or may not be byte-identical.
- Original user-supplied style reference images: not packaged. Obtain originals and verify publication rights before attaching them.

## Required before canonical GitHub import

1. Export the current Muse working tree **including Git history**, if any, and record current revision, source checksum and test evidence.
2. Confirm whether the canonical source already exists in another repository; avoid splitting the project between competing repositories.
3. Import the canonical source **without overwriting** its protected pristine and archive files.
4. Determine whether v1.1 rendering changes were already integrated; cherry-pick only reviewed differences.
5. Set repository visibility to private; validate third-party intellectual property, secrets and asset licenses before any public release.
6. Keep commit-level provenance and reproducible tests for future resume/portfolio claims.

Do not describe the Library snapshot as the latest playable build without this reconciliation.
