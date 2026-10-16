import * as T from 'three';
import {partId,findPart} from './model-part-id.js';
const signatures=new WeakMap();
export function geometrySignature(geometry){if(signatures.has(geometry))return signatures.get(geometry);let hash=2166136261;for(const array of [geometry.attributes.position.array,geometry.index?.array]){if(!array)continue;const bytes=new Uint8Array(array.buffer,array.byteOffset,array.byteLength);for(const b of bytes)hash=Math.imul(hash^b,16777619)>>>0;}const value=`${geometry.attributes.position.count}:${geometry.index?.count||0}:${hash.toString(16)}`;signatures.set(geometry,value);return value;}
export function remapCandidates(root,record){
 if(record?.format!=='DAC-model-measurement-2'||!Array.isArray(record.points)||record.points.length!==2)throw Error('Not a two-point measurement.');
 return record.points.map(p=>{let exact;try{exact=findPart(root,p.locator);}catch{}const matches=[];root.traverse(o=>{if(o.isMesh&&o.name===p.part)matches.push(o);});const target=exact?.name===p.part?exact:matches.length===1?matches[0]:null;return {part:p.part,suggestion:target?partId(root,target):'',status:target?(p.geometrySignature?(p.geometrySignature===geometrySignature(target.geometry)?'Named part and geometry fingerprint match; placement may differ':'Named part survives but its geometry changed'):'Named part survives; older record has no geometry fingerprint'):matches.length?'Name is ambiguous; choose a replacement':'Part missing or renamed; choose a replacement'};});
}
export function remapMeasurement(root,identity,record,ids){
 const candidates=remapCandidates(root,record);if(!Array.isArray(ids)||ids.length!==2)throw Error('Choose both replacement parts.');
 const changes=[];const points=record.points.map((p,n)=>{const object=findPart(root,ids[n]);if(!Array.isArray(p.local)||p.local.length!==3||!p.local.every(v=>Number.isFinite(v)&&Math.abs(v)<100000))throw Error('Invalid original point.');
 if(object.isInstancedMesh&&(!Number.isInteger(p.instance)||p.instance<0||p.instance>=object.count))throw Error('The original instance is unavailable. Choose an individual part or measure it again.');
 const original=new T.Vector3(...p.local),near=new T.Vector3(),triangle=new T.Triangle(),position=object.geometry.attributes.position,index=object.geometry.index,count=index?index.count:position.count;let distance=Infinity,best;
 for(let i=0;i<count;i+=3){triangle.a.fromBufferAttribute(position,index?index.getX(i):i);triangle.b.fromBufferAttribute(position,index?index.getX(i+1):i+1);triangle.c.fromBufferAttribute(position,index?index.getX(i+2):i+2);triangle.closestPointToPoint(original,near);const d=near.distanceToSquared(original);if(d<distance){distance=d;best=near.clone();}}
 if(!best)throw Error('Replacement has no surface.');const path=[];for(let o=object;o!==root;o=o.parent)path.unshift(o.parent.children.indexOf(o));changes.push({from:p.part,to:object.name,localShift:Math.sqrt(distance)});
 return {...p,geometrySignature:geometrySignature(object.geometry),part:object.name,locator:partId(root,object),path,instance:object.isInstancedMesh?p.instance:undefined,local:best.toArray(),snapped:true};});
 const warnings=[];changes.forEach((c,i)=>{if(c.localShift>2)warnings.push(`${i?"B":"A"}: projection moves more than 2 local model units.`);if(!candidates[i].suggestion)warnings.push(`${i?"B":"A"}: original part is missing or ambiguous.`);});
 return {warnings,record:{...record,identity,points,remappedFrom:{identity:record.identity,points:record.points,millimetres:record.millimetres},millimetres:undefined,axes:undefined},changes};
}
