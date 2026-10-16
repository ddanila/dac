#!/usr/bin/env python3
"""Record supplied specimen evidence without confusing reference ROMs with dumps."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SLOTS = [('boot_rom', 's550.bin', 2048), ('cas_prom', 'cas.bin', 256),
         ('keyboard_rom', 's600.bin', 2048)]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name, _, _ in SLOTS:
        parser.add_argument('--' + name.replace('_', '-'), type=Path)
    parser.add_argument('--evidence', type=Path, help='JSON specimen identity and measurement records')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    evidence = json.loads(args.evidence.read_text()) if args.evidence else {}
    if not isinstance(evidence, dict):
        parser.error('Evidence must be a JSON object')
    records = evidence.get('measurements', [])
    if not isinstance(records, list):
        parser.error('measurements must be a list')
    for entry in records:
        if not isinstance(entry, dict) or (entry.get('value') is None or any(not entry.get(k) for k in ['property', 'unit', 'method', 'source'])):
            parser.error('Each measurement needs property, value, unit, method and source')
    report = {'schema': 1, 'specimen': evidence.get('specimen', 'Owner Robotron 1715M; identities unresolved'),
              'firmware': {}, 'measurements': records,
              'identification': evidence.get('identification', {}),
              'remainingEvidence': ['Board revision and straps', 'Drive model suffixes and jumpers',
                  'Main and keyboard clock frequencies', 'Disk index/startup/seek timing',
                  'Display DACK/CPU bus and IRQ routing', 'SIO clock routing and duty cycle']}
    inputs = []
    for name, reference, size in SLOTS:
        path = getattr(args, name)
        record = {'expectedBytes': size, 'referenceSha256': digest(ROOT / 'public/media/robotron' / reference),
                  'status': 'not supplied'}
        if path:
            if path.stat().st_size != size:
                parser.error(f'{name}: expected {size} bytes; preserve the original and investigate chip size/mirroring before conversion')
            inputs.append(path.resolve())
            record.update(status='supplied, provenance requires review', filename=path.name,
                          sha256=digest(path), matchesReference=digest(path) == record['referenceSha256'])
        report['firmware'][name] = record
    if args.evidence:
        inputs.append(args.evidence.resolve())
    if args.output.resolve() in inputs:
        parser.error('Output must not overwrite an evidence input')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(args.output)


if __name__ == '__main__':
    main()
