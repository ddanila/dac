#!/usr/bin/env python3
"""Copy the canonical photo-based Robotron export from a local 3d-models checkout."""
import argparse, hashlib, json, subprocess
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument('repository',type=Path)
args=parser.parse_args()
repo=args.repository.resolve()
source=repo/'models/robotron-1715m'
target=Path(__file__).resolve().parents[1]/'public/models/robotron-1715m'
data=json.loads((source/'browser/model.json').read_text())
photos={p['file']:p for p in json.loads((source/'reference/photos.json').read_text())['photos']}
files=[('browser/model.json','model.json',None),('LICENSE','LICENSE',None)]
for patch in data['patches']:
    if patch.get('texture'):files.append(('browser/'+patch['texture'],patch['texture'],patch['textureSha256']))
for part in data['parts']+data.get('keyMeshes',[]):files.append(('browser/'+part['file'],part['file'],part['sha256']))
for name in sorted({p['photo'] for p in data['patches']} | set(data.get('references', []))):files.append(('reference/photos/'+name,'photos/'+name,photos[name]['sha256']))
for board in data.get('pcbReferences',[]):files.append((board['file'],board['file'],board['sha256']))
for component in data.get('pcbComponents',{}).get('models',[]):
    for mesh in component['meshes'].values():files.append((mesh['file'],mesh['file'],mesh['sha256']))
# Ship upstream sources and licences with the reusable derived component library.
for path in sorted((source/'components/kicad').glob('source/*')):
    name=str(path.relative_to(source));files.append((name,name,None))
for name in ['NOTICE.txt','sources.json','models.json']:
    name='components/kicad/'+name;files.append((name,name,None))

for directory in sorted({str(Path(b['file']).parent) for b in data.get('pcbReferences',[])}):files.append((directory+'/NOTICE.txt',directory+'/NOTICE.txt',None))
files.append(('browser/downloads.json','downloads.json',None))
for record in json.loads((source/'browser/downloads.json').read_text()):files.append(('browser/'+record['file'],record['file'],record['sha256']))
previous=json.loads((target/'source.json').read_text()).get('files',[]) if (target/'source.json').exists() else []
records=[]
for src,dest,expected in files:
    blob=(source/src).read_bytes();digest=hashlib.sha256(blob).hexdigest()
    if expected and digest!=expected:raise ValueError('Hash mismatch: '+src)
    out=target/dest;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(blob)
    records.append(dict(file=dest,sha256=digest))
wanted={f[1] for f in files}
for old in previous:
    name=old['file']
    if name not in wanted and '..' not in Path(name).parts and not Path(name).is_absolute():
        (target/name).unlink(missing_ok=True)
revision=subprocess.check_output(['git','-C',str(repo),'rev-parse','HEAD'],text=True).strip()
dirty=bool(subprocess.check_output(['git','-C',str(repo),'status','--porcelain','--','models/robotron-1715m'],text=True).strip())
(target/'source.json').write_text(json.dumps(dict(repository='https://github.com/ddanila/3d-models',revision=revision,dirty=dirty,files=records),indent=2)+'\n')
print(f'Synced {len(files)} verified files from {revision}'+(' (uncommitted changes)' if dirty else ''))
