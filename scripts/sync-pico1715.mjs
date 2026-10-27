// SPDX-License-Identifier: MIT
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const [source='../Pico1715/build/browser',cpm='../cpm-plus-1715']=process.argv.slice(2),from=resolve(source),repo=resolve(cpm),to=resolve('public/pico1715');
const manifest=JSON.parse(await readFile(from+'/manifest.json','utf8'));
if(manifest.dirty&&!process.argv.includes('--allow-dirty'))throw Error('Commit Pico1715 before publishing its browser artifacts.');
const hash=b=>createHash('sha256').update(b).digest('hex');
await mkdir(to,{recursive:true});
for(const [name,sha] of Object.entries(manifest.sha256)){
 if(!/^[\w.-]+$/.test(name))throw Error('Invalid artifact name');
 const bytes=await readFile(from+'/'+name);if(hash(bytes)!==sha)throw Error('Checksum mismatch '+name);await writeFile(to+'/'+name,bytes);
}
for(const [name,path] of Object.entries({'test.rom':'build/test.rom','cpm-plus-1715.img':'out/cpm-plus-1715.img','keyboard-map.json':'build/keyboard-map.json','platform.bin':'build/platform.cim','CPM-NOTICE.md':'NOTICE.md','CPM-LICENSE.md':'third_party/cpm3/LICENSE.md','JUKU-LICENSE':'third_party/JUKU-LICENSE'})){
 const bytes=await readFile(repo+'/'+path);manifest.sha256[name]=hash(bytes);await writeFile(to+'/'+name,bytes);
}
manifest.cpm=execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
await writeFile(to+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Pinned classic workstation assets',manifest.pico,manifest.cpm);
