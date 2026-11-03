"""Verify preservation of the original report, definitions and artifacts."""
from pathlib import Path
from hashlib import sha256
import json

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT/'docs/testing/evidence/2026-11-02-protected-baseline'


def main():
    manifest=json.loads((EVIDENCE/'ARTIFACTS.json').read_text())
    paths={x['path'] for x in manifest['files']}
    actual={p.name for p in EVIDENCE.iterdir() if p.is_file()}-{'ARTIFACTS.json'}
    if len(paths)!=9 or paths!=actual:
        raise SystemExit('Original evidence inventory mismatch')
    for item in manifest['files']:
        raw=(EVIDENCE/item['path']).read_bytes()
        if len(raw)!=item['bytes'] or sha256(raw).hexdigest()!=item['sha256']:
            raise SystemExit('Original artifact changed: '+item['path'])
    result=json.loads((EVIDENCE/'results.json').read_text())
    if result['commit']!=manifest['source_commit'] or result['source_sha256']!=manifest['source_sha256']:
        raise SystemExit('Original run provenance mismatch')
    print('PASS: all 9 original evidence artifacts and exact tested source provenance preserved')


if __name__=='__main__':
    main()
