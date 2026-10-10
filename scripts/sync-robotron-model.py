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
for part in data['parts']+data.get('keyMeshes',[]):files.append(('browser/'+part['file'],part['file'],part['sha256']))
for name in sorted({p['photo'] for p in data['patches']} | set(data.get('references', []))):files.append(('reference/photos/'+name,'photos/'+name,photos[name]['sha256']))
for board in data.get('pcbReferences',[]):files.append((board['file'],board['file'],board['sha256']))
for directory in sorted({str(Path(b['file']).parent) for b in data.get('pcbReferences',[])}):files.append((directory+'/NOTICE.txt',directory+'/NOTICE.txt',None))
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
