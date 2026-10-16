#!/usr/bin/env python3
"""Pin the reviewed keyboard reconstruction and co-simulation summary for DAC."""
import argparse,hashlib,json,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('cad',type=Path);p.add_argument('emulation',type=Path);a=p.parse_args();root=Path(__file__).resolve().parents[1]
def revision(repo):
 if subprocess.check_output(['git','-C',str(repo),'status','--porcelain'],text=True).strip():raise SystemExit('Commit source changes before pinning '+str(repo))
 return subprocess.check_output(['git','-C',str(repo),'rev-parse','HEAD'],text=True).strip()
cadrev=revision(a.cad);emurev=revision(a.emulation);board=a.cad/'models/robotron-1715m/keyboard-controller';core=a.emulation/'verification/robotron-keyboard'
subprocess.run(['python3',board/'tools/export.py','--check'],check=True)
subprocess.run(['python3',core/'generate.py','--check'],check=True)
paths={k:board/'generated'/v for k,v in [('layout','layout.json'),('connectivity','connectivity.json'),('qualification','qualification.json')]};paths['evidence']=board/'evidence.json'
blob={k:json.loads(v.read_text()) for k,v in paths.items()};digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
if digest(paths['connectivity'])!=digest(core/'reference/connectivity.json'):raise SystemExit('CAD and HDL are pinned to different connectivity')
report=json.loads((core/'reports/full-audit.json').read_text())
if report['connectivitySha256']!=digest(paths['connectivity']):raise SystemExit('Co-simulation report uses different connectivity')
blob['source']={'cad':{'repository':'https://github.com/ddanila/3d-models','revision':cadrev},'emulation':{'repository':'https://github.com/ddanila/dac-emulation','revision':emurev},'files':{k:digest(v) for k,v in paths.items()},'reportSha256':digest(core/'reports/full-audit.json')}
blob['cosimulation']={k:report[k] for k in ['bus','firmware','equivalent']}
target=root/'public/models/robotron-1715m/keyboard-controller.json';target.write_text(json.dumps(blob,indent=2)+'\n');print('Pinned keyboard controller:',cadrev,emurev)
