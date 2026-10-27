// SPDX-License-Identifier: MIT
import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const [cpm='../cpm-plus-1715',pico='../Pico1715']=process.argv.slice(2);
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
const rom=await sha(cpm+'/build/test.rom'),disk=await sha(cpm+'/out/cpm-plus-1715.img');
const map=JSON.parse(await readFile(cpm+'/build/system-map.json')),stock=JSON.parse(await readFile(pico+'/tests/extended-media-inputs.json')),report=JSON.parse(await readFile(pico+'/reports/extended-media.json'));
const fetch=(id,label,address)=>({id,label,event:{kind:'opcode_fetch',address}});
const reset={id:'reset',label:'Emulator reset requested',observation:'reset-action'};
const reads={id:'disk',label:'Controller data reads',event:{kind:'io_read',address:2,addressMask:255}};
const cpmStages=[reset,fetch('loader','Source-built filesystem loader entry',0xc033),reads,fetch('system','CP/M BIOS entry',map.bios_entry),{id:'prompt',label:'Console readiness observed',observation:'screen',contains:'A>'}];
const profiles=[{id:'cpm3-public',revision:1,label:'CP/M 3 public fixture (historical bootstrap bypassed)',rom_sha256:rom,disk_sha256:[disk],source:'CP/M tools/build_test_rom.py, source platform jump table, build/system-map.json',stages:cpmStages},
{id:'cpm3-stock-rom',revision:1,label:'CP/M 3 via reference ROM',rom_sha256:stock.rom_sha256,disk_sha256:[disk],source:'CP/M tools/build_image.py bootstrap and generated system map',stages:[reset,reads,fetch('bootstrap','4000h bootstrap entry',0x4000),...cpmStages.filter(s=>!['reset','disk'].includes(s.id))]}];
for(const [name,input] of Object.entries(stock.images))if(input.prompt_observed){const r=report.cases.find(r=>r.input_sha256===input.sha256&&r.qualification==='prompt observed');if(!r)throw Error('Missing stock qualification');profiles.push({id:'scp-'+name.split('.')[0],revision:1,label:'SCP 0006 · '+name,rom_sha256:stock.rom_sha256,disk_sha256:[input.sha256],source:'Pico1715 reports/extended-media.json '+r.case,stages:[reset,reads,fetch('handoff','Observed stock loader handoff',r.stats.rom_handoff_target),{id:'banner',label:'SCP 0006 console banner observed',observation:'screen',contains:'SCP   VERS. 0006'},{id:'prompt',label:'Console prompt observed',observation:'screen',contains:'A>'}]});}
await writeFile('public/analyzer/boot-profiles.json',JSON.stringify({schema:1,inputs:{rom_sha256:rom,disk_sha256:disk,system_map_sha256:await sha(cpm+'/build/system-map.json'),stock_inputs_sha256:await sha(pico+'/tests/extended-media-inputs.json'),stock_report_sha256:await sha(pico+'/reports/extended-media.json')},profiles},null,2)+'\n');
