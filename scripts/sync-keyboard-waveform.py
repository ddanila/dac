#!/usr/bin/env python3
"""Pin a recorded reference simulation excerpt for museum inspection."""
import argparse
import hashlib
import json
import lzma
import io
import re
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('emulation', type=Path)
parser.add_argument('--check', action='store_true', help='Reject a stale excerpt without writing it')
args = parser.parse_args()
repo = args.emulation.resolve()
root = Path(__file__).resolve().parents[1]
target = root / 'public/models/robotron-1715m/keyboard-controller-waveform.json'
if args.check:
    recorded = json.loads(target.read_text())
    revision = recorded['source']['revision']
    if not re.fullmatch(r'[0-9a-f]{40}', revision):
        raise SystemExit('Expected a pinned full commit hash')
else:
    if subprocess.check_output(['git', '-C', str(repo), 'status', '--porcelain'], text=True).strip():
        raise SystemExit('Commit source changes before pinning a waveform')
    revision = subprocess.check_output(['git', '-C', str(repo), 'rev-parse', 'HEAD'], text=True).strip()

def read(path):
    # Validate the capture at its immutable revision, independent of checkout HEAD.
    relative = path.relative_to(repo).as_posix()
    return subprocess.check_output(['git', '-C', str(repo), 'show', revision + ':' + relative])

def document(path):
    return json.loads(read(path))

analog = repo / 'verification/robotron-keyboard/analog'
run = analog / 'reports/rom-read-envelope/electrical-bus/ownership-startup'
sha = lambda p: hashlib.sha256(read(p)).hexdigest()
receipt = document(run / 'retention.json')
for name, digest in receipt['retainedFiles'].items():
    if sha(run / name) != digest:
        raise SystemExit('Retained source hash differs: ' + name)
assessment = document(run / 'ownership-assessment.json')
prepared = document(run / 'report.json')
limits = document(analog / 'cpu_clock_limits.json')
if sha(analog / 'cpu_clock_limits.json') != prepared['sources']['cpu_clock_limits.json']:
    raise SystemExit('Receiver limits differ from the captured run')
controller = json.loads((root / 'public/models/robotron-1715m/keyboard-controller.json').read_text())
if prepared['connectivitySha256'] != controller['source']['files']['connectivity']:
    raise SystemExit('Waveform and museum connectivity differ')
if not assessment['completed'] or assessment['qualified']:
    raise SystemExit('Expected completed, unqualified diagnostic')
failure = assessment['busFailure']
if failure['signal'] != 'CPU_DI_UNKNOWN':
    raise SystemExit('Expected unknown bus read')
stamp = failure['readTimePs'] * 1e-12
samples, digest = [], hashlib.sha256()
with lzma.open(io.BytesIO(read(run / 'bus-trace.txt.xz')), 'rb') as stream:
    header = next(stream)
    digest.update(header)
    if header.decode().split() != ['time', *[f'v(n_D{i})' for i in range(8)], 'v(n_p5V)']:
        raise SystemExit('Unexpected waveform columns')
    for line in stream:
        digest.update(line)
        values = list(map(float, line.split()))
        if stamp - 100e-9 <= values[0] <= stamp + 100e-9:
            samples.append([values[0], values[1], values[-1]])
if digest.hexdigest() != assessment['waveform']['sha256'] or not samples:
    raise SystemExit('Waveform bytes differ or excerpt is empty')
files = [run / 'ownership-assessment.json', run / 'report.json', run / 'bus-trace.txt.xz', analog / 'cpu_clock_limits.json']
output = {'schema': 1, 'title': 'Released D0 at a CPU read', 'net': '/D0',
          'connectivitySha256': prepared['connectivitySha256'],
          'source': {'repository': 'https://github.com/ddanila/dac-emulation', 'revision': revision,
                     'reportPath': str((run / 'ownership-assessment.json').relative_to(repo)),
                     'files': {str(path.relative_to(repo)): sha(path) for path in files}},
          'scope': 'Recorded reference simulation with standard S600 ROM and external clock/reset. Not live emulation or a specimen measurement. Electrical qualification failed.',
          'readTimeSeconds': stamp, 'address': failure['address'], 'sampledHex': failure['sampledHex'],
          'driversAtRead': failure['drivers'], 'columns': ['timeSeconds', 'd0Volts', 'supplyVolts'],
          'lowMaximumVolts': limits['ordinaryInput']['lowMaximumVolts'],
          'highMinimumVolts': limits['ordinaryInput']['highMinimumVolts'], 'samples': samples}
analysis_path = analog / 'reports/floating-io/static-analysis.json'
analysis_relative = str(analysis_path.relative_to(repo))
# Older captures remain checkable at their original revision.
if not args.check or analysis_relative in recorded['source']['files']:
    analysis = document(analysis_path)
    if analysis['romSha256'] != prepared['romSha256'] or analysis['observableDependencyFound'] is not False or analysis['qualified'] is not False:
        raise SystemExit('Firmware analysis does not match the recorded reference ROM')
    for name, digest in analysis['sources'].items():
        if sha(repo / name) != digest:
            raise SystemExit('Firmware analysis source differs: ' + name)
    output['source']['files'][analysis_relative] = sha(analysis_path)
    output['firmwareAnalysis'] = {
        'reportPath': analysis_relative, 'romSha256': analysis['romSha256'],
        'observableDependencyFound': False, 'qualified': False,
        'assumptions': analysis['assumptions'], 'boundary': analysis['boundary']}
serialized = json.dumps(output, indent=2) + '\n'

if args.check:
    if not target.exists() or target.read_text() != serialized:
        raise SystemExit('Recorded waveform is stale; regenerate from the reviewed source revision')
    print('Recorded waveform matches source:', revision)
else:
    target.write_text(serialized)
    print('Pinned recorded waveform:', revision)
