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
for part in data['parts']:files.append(('browser/'+part['file'],part['file'],part['sha256']))
for name in sorted({p['photo'] for p in data['keys']+data['patches']}):files.append(('reference/photos/'+name,'photos/'+name,photos[name]['sha256']))
records=[]
for src,dest,expected in files:
    blob=(source/src).read_bytes();digest=hashlib.sha256(blob).hexdigest()
    if expected and digest!=expected:raise ValueError('Hash mismatch: '+src)
    out=target/dest;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(blob)
    records.append(dict(file=dest,sha256=digest))
revision=subprocess.check_output(['git','-C',str(repo),'rev-parse','HEAD'],text=True).strip()
dirty=bool(subprocess.check_output(['git','-C',str(repo),'status','--porcelain','--','models/robotron-1715m'],text=True).strip())
(target/'source.json').write_text(json.dumps(dict(repository='https://github.com/ddanila/3d-models',revision=revision,dirty=dirty,files=records),indent=2)+'\n')
print(f'Synced {len(files)} verified files from {revision}'+(' (uncommitted changes)' if dirty else ''))
