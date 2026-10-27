#!/usr/bin/env node
// SPDX-License-Identifier: MIT
import {readFile,writeFile} from 'node:fs/promises';
import {Capture,json} from '../../src/analyzer/capture.js';
import {evaluate,defaultSuite} from '../../src/analyzer/assertions.js';
const [capturePath,suitePath,outputPath,startArg,endArg]=process.argv.slice(2);
try{
 if(!capturePath)throw Error('Usage: node tools/analyzer/check.mjs CAPTURE [SUITE.json|-] [REPORT.json|-] [START END]');
 const capture=await Capture.open(new Blob([await readFile(capturePath)]));
 const suite=suitePath&&suitePath!=='-'?JSON.parse(await readFile(suitePath,'utf8')):defaultSuite;
 const report=await evaluate(capture,suite,{start:startArg===undefined?0:Number(startArg),end:endArg===undefined?capture.header.count:Number(endArg)});
 const text=json(report)+'\n';if(outputPath&&outputPath!=='-')await writeFile(outputPath,text,{flag:'wx'});else process.stdout.write(text);
 process.exitCode=report.results.every(r=>r.outcome==='pass')?0:1;
}catch(e){console.error(e.message);process.exitCode=2;}
