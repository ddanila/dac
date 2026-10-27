// SPDX-License-Identifier: MIT
import {readFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const source=resolve(process.argv[2]||'../Pico1715/build/analyzer-workbench'),out=resolve('public/analyzer'),m=JSON.parse(readFileSync(source+'/manifest.json'));
if(m.schema!==1||m.dirty&&!process.argv.includes('--allow-dirty'))throw Error('Require a clean, versioned analyzer artifact build (or explicit --allow-dirty for development)');
mkdirSync(out,{recursive:true});
for(const [name,hash] of Object.entries(m.sha256)){if(!/^[\w.-]+$/.test(name))throw Error('Invalid artifact name');const b=readFileSync(source+'/'+name);if(createHash('sha256').update(b).digest('hex')!==hash)throw Error('Hash mismatch: '+name);copyFileSync(source+'/'+name,out+'/'+name);}
copyFileSync(source+'/manifest.json',out+'/manifest.json');console.log('Synced verified analyzer fixtures and WASM helpers');
