import {readFileSync} from 'node:fs';
const root=new URL('../public/models/robotron-1715m/',import.meta.url);
const model=JSON.parse(readFileSync(new URL('model.json',root))),cache=JSON.parse(readFileSync(new URL('geometry-cache.json',root)));
const records=[...model.parts,...model.keyMeshes,...model.pcbComponents.models.flatMap(m=>Object.values(m.meshes))];
export function cachedMesh(file,angle=Math.PI/4){const p=records.find(p=>p.file===file);if(!p)throw Error('Unknown canonical mesh: '+file);const entry=cache.entries[p.sha256+':'+angle];if(!entry)throw Error('Missing derived mesh: '+file);return entry;}
export function requestedMesh(requests,file,angle=Math.PI/4){const p=records.find(p=>p.file===file),entry=cachedMesh(file,angle);return requests.some(value=>{const u=new URL(value);return [[p.file,p.sha256],[entry.file,entry.sha256]].some(([path,hash])=>u.pathname.endsWith('/'+path)&&u.searchParams.get('v')===hash);});}
export function requestedPackage(requests){return model.pcbComponents.models.filter(m=>model.pcbComponents.instances.some(p=>p.model===m.id)).some(m=>requestedMesh(requests,m.meshes.body.file));}
