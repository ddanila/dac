// Feed a downloaded `gh run view RUN --log` file; no CI job or extra run needed.
import {readFile,writeFile} from 'node:fs/promises';
const path=process.argv[2];if(!path)throw Error('Pass a successful workflow log file.');
const text=await readFile(path,'utf8'),last=new Map(),seconds={};
for(const line of text.split('\n')){
 const match=line.match(/^(chromium-[12])\t[^\t]*\t(\S+) (.*)$/);if(!match)continue;
 const [,job,date,message]=match,time=Date.parse(date),file=message.match(/\[\d+\/\d+\] (tests\/[^:]+\.spec\.js):/);
 if(!file&&!/\d+ passed \(/.test(message))continue;
 const previous=last.get(job);if(previous&&time>=previous.time){seconds[previous.file]=(seconds[previous.file]||0)+(time-previous.time)/1000;}
 if(file)last.set(job,{file:file[1],time});else last.delete(job);
}
if(Object.keys(seconds).length<10)throw Error('No complete Chromium timing log found.');
const target=new URL('../tests/ci-durations.json',import.meta.url),old=JSON.parse(await readFile(target));
for(const [file,value] of Object.entries(seconds))old.seconds[file]=Math.max(.1,Math.round(value*10)/10);
old.source=`Successful workflow ${process.argv[3]||'log'}: Chromium single-worker start-to-next-start elapsed times including fixture overhead. Unknown files retain conservative estimates. Coverage unchanged.`;
await writeFile(target,JSON.stringify(old,null,2)+'\n');console.log('Updated '+Object.keys(seconds).length+' file estimates.');
