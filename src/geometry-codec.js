import * as THREE from 'three';
import {toCreasedNormals,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
export function detailedGeometry(source,creaseAngle=Math.PI/4){
 const geometry=mergeVertices(toCreasedNormals(source,creaseAngle),Number.EPSILON);geometry.computeBoundingBox();return geometry;
}
// Versioned derived geometry, little-endian typed arrays; no quantization.
export function encodeGeometry(g){
 const p=g.attributes.position.array,n=g.attributes.normal.array,ix=g.index.array;
 if(Object.keys(g.attributes).sort().join(',')!=='normal,position')throw Error('Unexpected STL attributes');
 const bytes=new Uint8Array(16+p.byteLength+n.byteLength+ix.byteLength),h=new DataView(bytes.buffer);
 h.setUint32(0,0x31474344,true);h.setUint32(4,p.length/3,true);h.setUint32(8,ix.length,true);h.setUint32(12,ix.BYTES_PER_ELEMENT,true);
 let off=16;for(const a of [p,n,ix]){bytes.set(new Uint8Array(a.buffer,a.byteOffset,a.byteLength),off);off+=a.byteLength;}return bytes;
}
export function decodeGeometry(buffer){
 const h=new DataView(buffer);if(h.byteLength<16||h.getUint32(0,true)!==0x31474344)throw Error('Invalid geometry cache');
 const n=h.getUint32(4,true),count=h.getUint32(8,true),width=h.getUint32(12,true);
 if(![2,4].includes(width)||16+n*24+count*width!==buffer.byteLength)throw Error('Invalid geometry cache length');
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(buffer,16,n*3),3));g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(buffer,16+n*12,n*3),3));g.setIndex(new THREE.BufferAttribute(new (width===2?Uint16Array:Uint32Array)(buffer,16+n*24,count),1));g.computeBoundingBox();return g;
}
