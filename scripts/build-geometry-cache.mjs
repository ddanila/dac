// Reproducible cache of the existing crease/index pipeline, not a new CAD source.
import {readFile,writeFile,mkdir,readdir,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {detailedGeometry,encodeGeometry,decodeGeometry} from '../src/geometry-codec.js';
const root=new URL('../public/models/robotron-1715m/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('model.json',root)));
const jobs=[...manifest.parts.map(p=>[p,Math.PI/4]),...manifest.keyMeshes.map(p=>[p,Math.PI/2.1]),...manifest.pcbComponents.models.filter(m=>manifest.pcbComponents.instances.some(p=>p.model===m.id)).flatMap(m=>Object.values(m.meshes).map(p=>[p,Math.PI/4]))];
const hash=b=>createHash('sha256').update(b).digest('hex'),entries={};let sourceBytes=0,cacheBytes=0;
await mkdir(new URL('geometry/',root),{recursive:true});
for(const [p,angle] of jobs){const key=p.sha256+':'+angle;if(entries[key])continue;const bytes=await readFile(new URL(p.file,root));if(hash(bytes)!==p.sha256)throw Error('Stale canonical hash: '+p.file);
 const g=detailedGeometry(new STLLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)),angle),encoded=encodeGeometry(g),copy=decodeGeometry(encoded.buffer);
 for(const name of ['position','normal'])if(!Buffer.from(g.attributes[name].array.buffer).equals(Buffer.from(copy.attributes[name].array.buffer,copy.attributes[name].array.byteOffset,copy.attributes[name].array.byteLength)))throw Error('Attribute changed');
 if(!Buffer.from(g.index.array.buffer).equals(Buffer.from(copy.index.array.buffer,copy.index.array.byteOffset,copy.index.array.byteLength)))throw Error('Index changed');
 const packed=gzipSync(encoded,{level:9}),digest=hash(packed),file='geometry/'+digest+'.dacgeom';await writeFile(new URL(file,root),packed);
 entries[key]={file,sha256:digest};sourceBytes+=bytes.length;cacheBytes+=packed.length;g.dispose();copy.dispose();
}
await writeFile(new URL('geometry-cache.json',root),JSON.stringify({format:1,pipeline:'three-0.186.1-creased-indexed',entries},null,2)+'\n');
const wanted=new Set(Object.values(entries).map(e=>e.file.slice('geometry/'.length)));
for(const name of await readdir(new URL('geometry/',root)))if(/^[a-f0-9]{64}\.dacgeom$/.test(name)&&!wanted.has(name))await unlink(new URL('geometry/'+name,root));
console.log({meshes:Object.keys(entries).length,sourceBytes,cacheBytes,exactAttributes:true});
