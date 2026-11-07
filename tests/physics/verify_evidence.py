#!/usr/bin/env python3
"""Verify preserved cycle artifacts and measurement/candidate definitions."""
from pathlib import Path
from hashlib import sha256
import json

ROOT=Path(__file__).resolve().parents[2]
DIRECTORY=ROOT/'docs/physics/cycle-1'


def main():
    manifest=json.loads((DIRECTORY/'MANIFEST.json').read_text())
    expected={item['path'] for item in manifest['files']}
    actual={p.relative_to(DIRECTORY).as_posix() for p in DIRECTORY.rglob('*') if p.is_file()}-{'MANIFEST.json'}
    if expected!=actual:raise SystemExit('Physics artifact inventory mismatch')
    for item in manifest['files']:
        raw=(DIRECTORY/item['path']).read_bytes()
        if len(raw)!=item['bytes'] or sha256(raw).hexdigest()!=item['sha256']:raise SystemExit('Artifact changed: '+item['path'])
    for name,digest in manifest['code_sha256'].items():
        if sha256((ROOT/name).read_bytes()).hexdigest()!=digest:raise SystemExit('Definition changed: '+name)
    print('PASS:',len(expected),'physics artifacts and all recorded definitions match. Candidate disposition:',manifest['status'])


if __name__=='__main__':main()
