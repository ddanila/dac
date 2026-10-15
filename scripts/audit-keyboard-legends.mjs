import {readFile,writeFile} from 'node:fs/promises';
import {matrixKey} from '../src/robotron-matrix.js';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root)));
const [model,audit]=await Promise.all([read('public/models/robotron-1715m/model.json'),read('docs/robotron/s600-matrix-audit.json')]);
const rows=model.keys.map(key=>{
 const address=matrixKey(key), states=[0,1].map(modifiers=>{
  const packet=audit.cases.find(c=>c.key===address && c.modifiers===modifiers)?.packet||[];
  const expected=modifiers?(key.input.shiftCode??key.input.code):key.input.code;
  const comparable=expected>=32 && expected<=126 && packet.length===2 && packet[1]>=32 && packet[1]<=126;
  return {modifiers,packet,legendCode:expected??null,result:comparable?(packet[1]===expected?'matches':'differs'):'special-or-unqualified'};
 });
 return {id:key.id,label:key.label,matrix:address,states};
});
await writeFile(new URL('docs/robotron/keyboard-legends.json',root),JSON.stringify({scope:'Specimen key mapping versus observed S600 packets; special protocol values are not ASCII mismatches. Printed legends and reference firmware are separate evidence.',rows},null,2)+'\n');
console.log(`${rows.length} keys; ${rows.flatMap(r=>r.states).filter(s=>s.result==='differs').length} printable legend differences`);
