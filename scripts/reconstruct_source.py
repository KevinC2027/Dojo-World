#!/usr/bin/env python3
"""Safely reconstruct the recovered Dojo World source ZIP; does not run game code."""
from pathlib import Path
from hashlib import sha256
from zipfile import ZipFile
import io
root = Path(__file__).resolve().parent.parent
parts = sorted((root / "recovery/chunks").glob("part-*.bin"))
assert len(parts) == 14, f"expected 14 parts, found {len(parts)}"
data = b"".join(p.read_bytes() for p in parts)
expected = "f19bbd15d963a93f62d4ce44914cf13f4c78e06bd4a481d5a976fc4850038dc6"
assert len(data) == 8047609 and sha256(data).hexdigest() == expected, "ZIP SHA-256 or length mismatch"
destination = root / "recovered_source"
assert not destination.exists() or not any(destination.iterdir()), "destination is not empty"
destination.mkdir(exist_ok=True)
with ZipFile(io.BytesIO(data)) as archive:
    infos = archive.infolist()
    assert len(infos) == 179 and archive.testzip() is None, "ZIP integrity failure"
    for member in infos:
        name = Path(member.filename)
        if name.is_absolute() or ".." in name.parts or "\\" in member.filename:
            raise ValueError(f"unsafe path: {member.filename}")
        target = destination / name
        if member.is_dir(): target.mkdir(parents=True, exist_ok=True)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(member))
print(f"Recovered {len(infos)} source files into {destination}. Gameplay remains paused.")
