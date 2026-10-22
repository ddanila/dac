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
subprocess.run(['python3',board/'tools/reference_board.py','--check'],check=True)
subprocess.run(['python3',board/'tools/connection_review.py','--check'],check=True)
subprocess.run(['python3',board/'tools/cable_copper.py','--check'],check=True)
subprocess.run(['python3',core/'generate.py','--check'],check=True)
paths={k:board/'generated'/v for k,v in [('layout','layout.json'),('connectivity','connectivity.json'),('qualification','qualification.json'),('photoRegistration','photo-registration.json'),('bottomRegistration','bottom-registration.json'),('topRegistration','top-registration.json'),('connectorReview','connector-review.json'),('connectorTerminals','connector-terminals.json')]};paths['evidence']=board/'evidence.json';paths['componentEvidence']=board/'component-evidence.json'
paths['routingAudit']=board/'generated/routing-audit.json'
paths['busReview']=board/'generated/bus-review.json'
paths['cableCopper']=board/'generated/cable-copper.json'
paths['connectionReview']=board/'review/connection-review.json';paths['outputAssembly']=board/'output-assembly.json'
blob={k:json.loads(v.read_text()) for k,v in paths.items()};digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
if digest(paths['connectivity'])!=digest(core/'reference/connectivity.json'):raise SystemExit('CAD and HDL are pinned to different connectivity')
report=json.loads((core/'reports/full-audit.json').read_text())
if report['connectivitySha256']!=digest(paths['connectivity']):raise SystemExit('Co-simulation report uses different connectivity')
for name,expected in {**report['sources'],**report['cpuSources']}.items():
 if digest(a.emulation/name)!=expected:raise SystemExit('Stale co-simulation report source: '+name)
if digest(a.emulation/'machines/robotron1715m/keyboard.c')!=report['productionKeyboardSha256']:raise SystemExit('Stale production keyboard comparison')
if digest(a.emulation/'machines/robotron1715m/keyboard.h')!=report['productionKeyboardHeaderSha256']:raise SystemExit('Stale keyboard layout comparison')
for name,expected in report['firmware']['cpu']['files'].items():
 if digest(a.emulation/'third_party/cpu/tv80'/name)!=expected:raise SystemExit('Stale TV80 comparison: '+name)
for bridge in blob['evidence'].get('serviceInterfaces',{}).get('bridges',[]):
 pins=blob['connectivity']['components'][bridge['ref']]['pins']
 for terminal,key in [('1','source'),('2','cpu')]:
  endpoint=bridge[key]
  if pins[terminal]!=endpoint['net'] or blob['connectivity']['components'][endpoint['ref']]['pins'][endpoint['pin']]!=endpoint['net']:
   raise SystemExit('Stale bridge evidence endpoint: '+bridge['ref'])
blob['source']={'cad':{'repository':'https://github.com/ddanila/3d-models','revision':cadrev},'emulation':{'repository':'https://github.com/ddanila/dac-emulation','revision':emurev},'files':{k:digest(v) for k,v in paths.items()},'reportSha256':digest(core/'reports/full-audit.json'),'geometryScadSha256':digest(board/'generated/controller.scad')}
blob['cosimulation']={k:report[k] for k in ['bus','firmware','service','equivalent']}
target=root/'public/models/robotron-1715m/keyboard-controller.json';target.write_text(json.dumps(blob,indent=2)+'\n');print('Pinned keyboard controller:',cadrev,emurev)

reference=board/'reference'
variant={key:json.loads((reference/'generated'/name).read_text()) for key,name in [('layout','layout.json'),('qualification','qualification.json'),('routingAudit','routing-audit.json')]}
manifest=json.loads((reference/'generated/manifest.json').read_text())
if manifest['sources']['generated/connectivity.json']!=digest(paths['connectivity']):raise SystemExit('Reference variant uses different connectivity')
variant['source']={'repository':'https://github.com/ddanila/3d-models','revision':cadrev,'manifestSha256':digest(reference/'generated/manifest.json'),'connectivitySha256':digest(paths['connectivity']),'files':manifest['outputs']}
(root/'public/models/robotron-1715m/keyboard-controller-reference.json').write_text(json.dumps(variant,indent=2)+'\n')
