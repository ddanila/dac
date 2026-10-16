// Optional lossless transport packs: canonical meshes and per-mesh checksums stay intact.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../public/models/robotron-1715m/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('geometry-cache.json',root)));
await mkdir(new URL('geometry-packs/',root),{recursive:true});
let group=[],size=0;
async function flush(){if(!group.length)return;const bytes=Buffer.concat(group.map(x=>x.bytes)),sha256=createHash('sha256').update(bytes).digest('hex'),file='geometry-packs/'+sha256+'.dacpack';await writeFile(new URL(file,root),bytes);let offset=0;for(const {entry,bytes} of group){entry.pack={file,sha256,offset,length:bytes.length};offset+=bytes.length;}group=[];size=0;}
for(const entry of Object.values(manifest.entries)){const bytes=await readFile(new URL(entry.file,root));if(size+bytes.length>1024*1024)await flush();group.push({entry,bytes});size+=bytes.length;}
await flush();await writeFile(new URL('geometry-cache.json',root),JSON.stringify(manifest,null,2)+'\n');
console.log(new Set(Object.values(manifest.entries).map(e=>e.pack.file)).size+' transport packs');
