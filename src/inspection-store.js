import {stored,storedKeys,digest} from './session-store.js';
export async function saveInspection(key,name,value){
 const bytes=new TextEncoder().encode(JSON.stringify(value)).buffer;
 if(bytes.byteLength>262144)throw Error('Inspection record exceeds 256 KiB.');
 await stored('inspection:'+key,{name,bytes,sha256:await digest(bytes)});
}
export async function loadInspection(key){
 const r=await stored('inspection:'+key);if(!r)return null;
 if(!(r.bytes instanceof ArrayBuffer)||r.bytes.byteLength>262144||await digest(r.bytes)!==r.sha256)throw Error('Inspection checksum failed.');
 return JSON.parse(new TextDecoder().decode(r.bytes));
}
export async function inspectionViews(){const keys=(await storedKeys()).filter(k=>k.startsWith('inspection:view:'));return Promise.all(keys.map(async k=>({key:k.slice(11),name:(await stored(k))?.name||'Removed inspection'})));}
export const removeInspection=key=>stored('inspection:'+key,null);
