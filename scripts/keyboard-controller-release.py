#!/usr/bin/env python3
"""Create/check the functional reference release; electrical acceptance is separate."""
import argparse
import gzip
import hashlib
import json
import re
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT/'public/models/robotron-1715m/keyboard-controller-release.json'

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def read(p):
    return json.loads(p.read_text())

def git(repo, *args):
    return subprocess.check_output(['git','-C',str(repo),*args])

def check(record):
    if record['functionalReferenceReleased'] is not True:
        raise ValueError('Functional release is not accepted')
    for name, digest in record['files'].items():
        if sha(ROOT/name) != digest:
            raise ValueError('Release input changed: '+name)
    base=ROOT/'public/models/robotron-1715m'
    source=read(base/'source.json')
    for item in source['files']:
        asset=base/item['file']
        digest=sha(asset)
        # CI need not fetch unused originals merely to verify pinned LFS identity.
        if item['file'].startswith(('photos/','reference/')) and asset.stat().st_size < 1024:
            pointer=re.fullmatch(rb'version https://git-lfs.github.com/spec/v1\noid sha256:([0-9a-f]{64})\nsize [0-9]+\n',asset.read_bytes())
            if pointer:digest=pointer.group(1).decode()
        if digest != item['sha256']:
            raise ValueError('Museum asset changed: '+item['file'])
    runtime=read(ROOT/'public/emulator/manifest.json')
    for name,digest in runtime['sha256'].items():
        if sha(ROOT/'public/emulator'/name)!=digest:
            raise ValueError('Runtime asset changed: '+name)
    board=read(base/'keyboard-controller.json');reference=read(base/'keyboard-controller-reference.json')
    if source['dirty'] or source['revision']!=reference['source']['revision'] or source['revision']!=board['source']['cad']['revision']:
        raise ValueError('Inconsistent CAD revisions')
    q=reference['qualification']
    if not (q['routingComplete'] and q['drcPassed'] and not q['padNetMismatches']):
        raise ValueError('Reference routing/DRC failed')
    acceptance=board['productionDigitalQualification']
    if not (acceptance['qualified'] and acceptance['productionAdopted'] and all(v is True for v in acceptance['gates'].values())):
        raise ValueError('Production digital acceptance failed')
    if not reference['assembly']['signalPaths']['stages']:
        raise ValueError('Signal path export missing')
    if record['electricallyQualified'] or record['historicallyVerified'] or record['fabricationReady']:
        raise ValueError('Functional release must not grant other qualifications')

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--check',action='store_true')
    ap.add_argument('--cad',type=Path,default=ROOT.parent/'3d-models')
    ap.add_argument('--emulation',type=Path,default=ROOT.parent/'dac-emulation')
    ap.add_argument('--browser-report',type=Path)
    ap.add_argument('--firmware-report',type=Path)
    ap.add_argument('--drc-report',type=Path)
    a=ap.parse_args()
    if a.check:
        check(read(TARGET));print('Functional reference release inputs verified');return
    if not a.browser_report or not a.firmware_report or not a.drc_report:
        ap.error('Creation requires fresh browser, native DRC and production firmware reports')
    base=ROOT/'public/models/robotron-1715m';board=read(base/'keyboard-controller.json')
    for repo,key in [(a.cad,'cad'),(a.emulation,'emulation')]:
        if git(repo,'status','--porcelain').strip():raise ValueError('Commit source changes before release')
        if git(repo,'rev-parse','HEAD').decode().strip()!=board['source'][key]['revision']:
            raise ValueError('Synchronize museum source revisions first')
    runtime=read(ROOT/'public/emulator/manifest.json')
    backend={}
    for name in ['keyboard_board.c','keyboard_board.h','keyboard_cpu.c','keyboard_cpu.h']:
        path='machines/robotron1715m/'+name
        if git(a.emulation,'show',runtime['commit']+':'+path)!=(a.emulation/path).read_bytes():
            raise ValueError('Museum runtime uses a different keyboard backend: '+path)
        backend[path]=sha(a.emulation/path)
    browser=read(a.browser_report);stats=browser['stats']
    if browser.get('errors') or stats['unexpected'] or stats['flaky'] or stats['skipped'] or not stats['expected']:
        raise ValueError('Browser review did not pass completely')
    firmware=read(a.firmware_report)
    if not all(firmware.get(k) is True for k in ['productionBackendTested','functionalAgreement','serialCycleAgreement','realLedTransitionAgreement']):
        raise ValueError('Fresh production firmware comparison failed')
    for path,digest in firmware['sources'].items():
        if sha(a.emulation/path)!=digest:raise ValueError('Stale firmware source: '+path)
    drc=read(a.drc_report)
    if drc['violations'] or drc['unconnected_items']:
        raise ValueError('Native DRC failed')
    records=ROOT/'docs/robotron/releases';records.mkdir(exist_ok=True)
    evidence={}
    for label,path in [('browser',a.browser_report),('firmware',a.firmware_report),('drc',a.drc_report)]:
        target=records/(label+'.json.gz')
        target.write_bytes(gzip.compress(path.read_bytes(),mtime=0))
        evidence[str(target.relative_to(ROOT))]=sha(target)
    validation={'nativeDrc':{'reportSha256':sha(a.drc_report),'passed':True,'boardSha256':sha(a.cad/'models/robotron-1715m/keyboard-controller/reference/controller.kicad_pcb')},'browser':{'reportSha256':sha(a.browser_report),'stats':stats},
                'firmware':{'reportSha256':sha(a.firmware_report),'romSha256':firmware['romSha256'],
                            'functionalAgreement':True,'serialCycleAgreement':True,'realLedTransitionAgreement':True},
                'runtimeKeyboardSources':backend}
    (records/'functional-reference-validation.json').write_text(json.dumps(validation,indent=2)+'\n')
    names=['public/models/robotron-1715m/'+n for n in ['source.json','keyboard-controller.json','keyboard-controller-reference.json']]
    names+=['public/emulator/manifest.json','docs/robotron/releases/functional-reference-validation.json',
            'scripts/keyboard-controller-release.py','scripts/sync-keyboard-controller.py','tests/keyboard-controller.spec.js','tests/keyboard-release.spec.js']
    names += [str(p.relative_to(ROOT)) for p in sorted((ROOT/'src').glob('*keyboard*')) if p.is_file()]
    record={'schema':1,'functionalReferenceReleased':True,'electricallyQualified':False,
            'historicallyVerified':False,'fabricationReady':False,
            'scope':'Proposed reference PCB, standard S600 and production digital contract with externally supplied clock/reset at virtual bridges. Historical copper, winding terminals, package fit and analog device dynamics remain separate.',
            'revisions':{'cad':board['source']['cad']['revision'],'hdlAndDigitalEvidence':board['source']['emulation']['revision'],
                         'browserRuntime':runtime['commit'],'museumBase':git(ROOT,'rev-parse','HEAD').decode().strip()},
            'museumRevisionConvention':'The git commit containing this manifest identifies the released museum; museumBase is its parent work baseline. Content hashes below bind the reviewed files without a self-referential commit hash.',
            'files':{**{name:sha(ROOT/name) for name in names},**evidence}}
    check(record)
    TARGET.write_text(json.dumps(record,indent=2)+'\n');print(TARGET)

if __name__=='__main__':main()
