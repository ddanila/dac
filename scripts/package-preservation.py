#!/usr/bin/env python3
"""Package an already-built DAC for local, network-independent preservation."""
import argparse, hashlib, json, subprocess, zipfile
from pathlib import Path
root = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser()
p.add_argument('output', type=Path)
a = p.parse_args()
if not (root/'dist/index.html').is_file(): raise SystemExit('Run npm run build first (default DAC_BASE=/).')
html=(root/'dist/index.html').read_text()
if '/dac/assets/' in html: raise SystemExit('Rebuild with DAC_BASE=/ for a local-root package.')
entries={'site/'+str(f.relative_to(root/'dist')):f.read_bytes() for f in (root/'dist').rglob('*') if f.is_file()}
entries['LICENSE']= (root/'LICENSE').read_bytes()
entries['README.txt']=b'''DAC preservation package

Requires Python 3. Run: python3 serve.py
Open http://127.0.0.1:8080/ in a browser with WebAssembly and WebGL support.
No Node, build step or remote service is needed. Keep the terminal open.
Third-party comparison photos remain external, optional references; the owner
model, textures, recordings, bundled media and emulator are included.

Run python3 serve.py --verify to verify every packaged file without serving.
Keep this ZIP and your separately exported disks/portable sessions together.
Browser storage is temporary. Use Export disk / Export portable session before
moving computers. Imported sessions select their archived matching core where
available. This archive cannot contain private sessions from your browser.

Original code is MIT; historical firmware/media and imported geometry retain
separate notices under site/media, site/emulator and site/models. Packaging does
not relicense those assets. Source identities are recorded in preservation.json.
'''
entries['serve.py']=b'''#!/usr/bin/env python3
import hashlib, json, sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
root=Path(__file__).resolve().parent
manifest=json.loads((root/'preservation.json').read_text())
for name, expected in manifest['sha256'].items():
    path=root/name
    if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest()!=expected:
        raise SystemExit('Integrity check failed: '+name)
print('Integrity check passed.', flush=True)
if '--verify' not in sys.argv:
    print('Open http://127.0.0.1:8080/ ; Ctrl+C to stop.', flush=True)
    try: ThreadingHTTPServer(('127.0.0.1',8080),partial(SimpleHTTPRequestHandler,directory=str(root/'site'))).serve_forever()
    except KeyboardInterrupt: pass
'''
meta={'repository':'https://github.com/ddanila/dac','commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),
      'workingTreeDirty':bool(subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True).strip()),
      'sha256':{name:hashlib.sha256(blob).hexdigest() for name,blob in sorted(entries.items())}}
meta['emulator']=json.loads((root/'dist/emulator/manifest.json').read_text())
meta['model']=json.loads((root/'dist/models/robotron-1715m/source.json').read_text())
entries['preservation.json']=(json.dumps(meta,indent=2)+'\n').encode()
a.output.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(a.output,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
    for name,blob in sorted(entries.items()):
        info=zipfile.ZipInfo(name,date_time=(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16
        archive.writestr(info,blob)
print(a.output, a.output.stat().st_size, 'bytes')
