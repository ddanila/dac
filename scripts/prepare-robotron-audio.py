#!/usr/bin/env python3
"""Rebuild owner-recorded Robotron samples with ffmpeg (no synthesis)."""
from pathlib import Path
import subprocess, json, hashlib
root=Path(__file__).resolve().parents[1]
source=root/'reference/robotron-audio'
out=root/'public/audio/robotron'
out.mkdir(parents=True,exist_ok=True)
cuts={'power-on':('boot',.36,22), 'fan':('boot',22,30), 'power-off':('boot',37.06,44.1)}
for group,starts in [('regular',[1.40,2.42,3.44]),('space',[5.10,6.05,7.00]),('enter',[8.50,9.44,10.40])]:
 for i,start in enumerate(starts): cuts[f'{group}-{i+1}']=('keypresses',start,start+.72)
for name,(file,start,end) in cuts.items():
 filters=['highpass=f=45' if file=='boot' else 'highpass=f=90','volume=6' if file=='boot' else 'volume=12']
 if name=='fan':
  # Overlap the last .15 seconds with the first .15; output starts at .15.
  filters += ['asplit[a][b];[a]atrim=start=0.15,asetpts=PTS-STARTPTS[a1];[b]atrim=end=0.15,asetpts=PTS-STARTPTS[b1];[a1][b1]acrossfade=d=0.15:c1=tri:c2=tri']
 else: filters += ['afade=t=in:d=0.004',f'afade=t=out:st={end-start-.025}:d=0.025']
 subprocess.run(['ffmpeg','-y','-v','error','-ss',str(start),'-t',str(end-start),'-i',str(source/(file+'.aiff')),'-ac','1','-ar','22050','-af',','.join(filters),'-c:a','pcm_s16le',str(out/(name+'.wav'))],check=True)
manifest={'owner':'Danila','license':'MIT','sourceFormat':'44.1 kHz stereo signed 8-bit AIFF','sources':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in source.glob('*.aiff')},'cutsSeconds':cuts,'processing':'Mono 22050 Hz PCM16; high-pass 45 Hz / gain 6 for boot, 90 Hz / gain 12 for keys; 4 ms onset and 25 ms tail fade; fan loop 150 ms wrap crossfade. No pitch shifts.'}
(out/'provenance.json').write_text(json.dumps(manifest,indent=2)+'\n')
