#!/usr/bin/env node
// Local visual review only. Start Vite first; no emulator, CI or screenshots of a remote site.
import {chromium} from '@playwright/test';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const url=process.argv[2] || 'http://127.0.0.1:4173';
const output=resolve(process.argv[3] || '/tmp/dac-robotron-review');
const canonical=resolve(process.argv[4] || '../3d-models/models/robotron-1715m');
const manifest=JSON.parse(await readFile(resolve(root,'public/models/robotron-1715m/model.json')));
const source=JSON.parse(await readFile(resolve(root,'public/models/robotron-1715m/source.json')));
await mkdir(output,{recursive:true});
const browser=await chromium.launch();const errors=[];
try {
 const page=await browser.newPage({viewport:{width:1200,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(e.message));
 // Avoid loading a second full exhibit: the harness uses the real model loader.
 await page.route(url+'/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><body style="margin:0">'}));
 await page.goto(url+'/');
 await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js');
  const {loadRobotron}=await import('/src/robotron-model.js');
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;
  const model=await loadRobotron(new T.CanvasTexture(canvas));model.drives([8,8]);model.tick();
  const scene=new T.Scene();scene.background=new T.Color('#414844');scene.add(model.group);
  scene.add(new T.HemisphereLight(0xffffff,0x80796b,2));
  const key=new T.DirectionalLight(0xffffff,3);key.position.set(-2,3,4);scene.add(key);
  const fill=new T.DirectionalLight(0xdce8ff,1);fill.position.set(3,1,-2);scene.add(fill);
  const underside=new T.DirectionalLight(0xffffff,2);underside.position.set(0,-3,1);scene.add(underside);
  const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(1200,900);
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  document.body.replaceChildren(renderer.domElement);
  window.review={T,model,scene,renderer};
 });
 const sections=[];
 const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 for(const view of manifest.reviewViews.views){
  await page.evaluate(view=>{
   const {T,model,scene,renderer}=window.review;
   model.tick();const include=new RegExp(view.include);
   for(const obj of model.group.children)obj.visible=include.test(obj.name);
   model.group.updateMatrixWorld(true);
   const convert=p=>new T.Vector3(p[0],p[2],-p[1]).multiplyScalar(.0025);
   const camera=new T.PerspectiveCamera(view.fov,4/3,.01,40);
   camera.position.copy(convert(view.position));
   if(view.up)camera.up.copy(convert(view.up).normalize());
   camera.lookAt(convert(view.target));renderer.render(scene,camera);
  },view);
  await page.screenshot({path:resolve(output,view.name+'.png')});
  await copyFile(resolve(canonical,'reference/photos',view.photo),resolve(output,view.photo));
  sections.push(`<section><h2>${escape(view.name)}</h2><p>${escape(view.note)}</p><div><figure><img src="${view.photo}"><figcaption>Your specimen · ${view.photo}</figcaption></figure><figure><img src="${view.name}.png"><figcaption>Clean reconstruction</figcaption></figure></div></section>`);
  console.log('Reviewed '+view.name);
 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile(resolve(output,'index.html'),`<!doctype html><meta charset="utf-8"><title>Robotron owner-photo review</title><style>body{font:16px system-ui;background:#202622;color:#eee;margin:24px}div{display:flex;gap:12px}figure{margin:0;width:50%}img{width:100%;height:480px;object-fit:contain;background:#414844}section{margin-bottom:36px}figcaption{font-size:13px}</style><h1>Owner photos and canonical model</h1><p>${escape(manifest.reviewViews.status)}</p><p>Model v${manifest.version}; source ${source.revision}${source.dirty?' (local edits)':''}. Generated ${new Date().toISOString()}.</p>${sections.join('')}`);
 await writeFile(resolve(output,'review.json'),JSON.stringify({modelVersion:manifest.version,source,views:manifest.reviewViews},null,2)+'\n');
 console.log('Open '+resolve(output,'index.html'));
} finally {await browser.close();}
