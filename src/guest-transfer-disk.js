// Add our original receiver to a COPY of the bundled reference disk.
export function transferDisk(input,program,name="DACRX   COM"){
 if(!/^[A-Z0-9 ]{11}$/.test(name))throw Error('Invalid guest program name.');
 const disk=new Uint8Array(input).slice(),used=new Set([0,1]);let free=-1;
 if(disk.length!==819200 || program.length>2048)throw Error('Unexpected guest example geometry.');
 for(let i=0;i<128;i++){const e=disk.subarray(20480+i*32,20480+(i+1)*32);if(e[0]===229){if(free<0)free=i;continue;}for(let j=16;j<32;j+=2)used.add(e[j]+256*e[j+1]);}
 let block=2;while(used.has(block))block++;
 if(block>389||free<0)throw Error('No space for guest example.');
 const e=disk.subarray(20480+free*32,20480+(free+1)*32);e.fill(0);e.set(new TextEncoder().encode(name),1);e[15]=Math.ceil(program.length/128);e[16]=block&255;e[17]=block>>8;
 disk.set(program,20480+block*2048);return disk;
}
