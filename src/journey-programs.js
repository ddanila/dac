// Original DAC diagnostic programs. The source builder and symbols travel with
// the reference identity; these programs are never described as historical ROMs.
function assembler(size=2048,origin=0){
 const bytes=new Uint8Array(size),labels={},fix=[];let pc=0;
 return {bytes,labels,emit(...v){bytes.set(v,pc);pc+=v.length;},label(n){labels[n]=pc+origin;},at(n){pc=n-origin;},address(op,n){this.emit(op,0,0);fix.push([pc-2,n]);},out(port,value){this.emit(0x3e,value,0xd3,port);},finish(){for(const [p,n]of fix){if(labels[n]===undefined)throw Error(n);bytes[p]=labels[n]&255;bytes[p+1]=labels[n]>>8;}return {bytes,labels};}};
}
export function interruptProgram(mode='single'){
 const a=assembler();a.label('Reset: mask interrupts and establish RAM stack');a.emit(0xf3,0x31,0,0xf0);
 // IM2 vector table in RAM. CTC2 occupies ports 04..07.
 a.emit(0x21,0,1,0x22,0x80,0x40,0x21,0x40,1,0x22,0x82,0x40,0x3e,0x40,0xed,0x47,0xed,0x5e);
 a.out(4,0x80);a.out(4,0x87);a.out(4,mode==='nested'?240:80);
 if(mode==='priority'||mode==='nested'){a.out(5,0x87);a.out(5,64);}
 a.label('Pending requests while DI masks CPU acceptance');a.emit(0x01,0,8);a.label('Masked delay');a.emit(0x0b,0x78,0xb1);a.address(0xc2,'Masked delay');
 a.label('EI: accept pending source after the following instruction');a.emit(0xfb,0);
 a.label('HALT waiting for interrupt');a.emit(0x76);a.address(0xc3,'HALT waiting for interrupt');
 a.at(0x100);a.label('CTC channel 0 handler: preserve AF and increment counter');a.emit(0xf5,0x3a,0,0x70,0x3c,0x32,0,0x70,0xf1,0xfb,0xed,0x4d);
 a.at(0x140);a.label('CTC channel 1 handler: preserve AF and increment counter');a.emit(0xf5,0x3a,1,0x70,0x3c,0x32,1,0x70);
 if(mode==='nested'){a.emit(0xfb,0,0xc5,0x01,0,1);a.label('Lower-priority handler permits higher-priority nesting');a.emit(0x0b,0x78,0xb1);a.address(0xc2,'Lower-priority handler permits higher-priority nesting');a.emit(0xc1);}
 a.emit(0xf1,0xfb,0xed,0x4d);return {...a.finish(),description:`Original DAC IM2 ${mode} diagnostic; CTC2 interrupts, RAM stack and counters.`};
}
export function videoProgram(mode='attributes'){
 const a=assembler();a.label('Reset: stop display, configure 80 columns / 24 rows / 16 lines');a.emit(0xf3,0x31,0,0xf0);a.out(0x19,0);
 for(const v of [79,23,0x6f,0x60])a.out(0x18,v);
 a.label('Fill video memory with spaces');a.emit(0x21,0,0x30,0x36,32,0x11,1,0x30,0x01,0x7f,7,0xed,0xb0);
 a.label('Write a character and field attributes');a.emit(0x21,0,0x30,0x36,0x61,0x23,0x36,0x90,0x23,0x36,0x61,0x23,0x36,0x80,0x23,0x36,0x61);
 a.out(0x19,0x80);a.out(0x18,4);a.out(0x18,0);a.out(0x19,0x20);
 a.label('Display runs independently of CPU');
 if(mode==='scanout'){a.emit(0x3e,0x61);a.label('Alternate glyph codes while scanout continues');a.emit(0x32,0,0x30,0xee,3);a.address(0xc3,'Alternate glyph codes while scanout continues');}
 else {a.emit(0x76);a.address(0xc3,'Display runs independently of CPU');}
 const glyphs=new Uint8Array(4096);for(let y=0;y<16;y++){glyphs[y*128+0x61]=[0,0,0x3c,0x42,2,0x3e,0x42,0x42,0x3e,0,0,0,0,0,0,0][y];glyphs[y*128+0x62]=0x7e;}
 return {...a.finish(),glyphs,description:`Original DAC ${mode} display diagnostic; functional scanlines, not analog beam simulation.`};
}
export function verifierProgram(expected){
 const a=assembler(1024,0x100);a.label('Open default FCB from command tail');a.emit(0x21,0,0,0x22,0,0x70,0x11,0x5c,0,0x0e,15,0xcd,5,0,0xfe,255);a.address(0xca,'Readback failed');
 a.label('Read next 128-byte file record through BDOS');a.emit(0x11,0x5c,0,0x0e,20,0xcd,5,0,0xb7);a.address(0xc2,'Compare readback checksum');
 a.emit(0x2a,0,0x70,0x11,0x80,0,0x06,128);a.label('Accumulate bytes actually read by OS');a.emit(0x1a,0x85,0x6f);a.address(0xd2,'No carry');a.emit(0x24);a.label('No carry');a.emit(0x13,0x05);a.address(0xc2,'Accumulate bytes actually read by OS');a.emit(0x22,0,0x70);a.address(0xc3,'Read next 128-byte file record through BDOS');
 a.label('Compare readback checksum');a.emit(0x2a,0,0x70,0x7c,0xfe,expected>>8);a.address(0xc2,'Readback failed');a.emit(0x7d,0xfe,expected&255);a.address(0xc2,'Readback failed');a.address(0x11,'Success message');a.address(0xc3,'Print result');
 a.label('Readback failed');a.address(0x11,'Failure message');a.label('Print result');a.emit(0x0e,9,0xcd,5,0,0xc3,0,0);
 a.label('Success message');a.emit(...new TextEncoder().encode('READBACK OK\r\n$'));a.label('Failure message');a.emit(...new TextEncoder().encode('READBACK FAILED\r\n$'));
 return {...a.finish(),description:'Original DAC verifier; BDOS open/read, 16-bit byte sum, plus independent host byte comparison.'};
}
export const resetDirectoryProgram=Uint8Array.from([0x0e,13,0xcd,5,0,0xc9]);
// Only used for private, explicitly modified guided fixtures; original disk is never changed.
export function installFile(disk,name,bytes){
 if(disk.length!==819200||bytes.length>16384)throw Error('Unsupported diagnostic fixture');
 const base=20480,used=new Set([0,1]);let entry=-1;
 for(let i=0;i<128;i++){const p=base+i*32;if(disk[p]===0xe5){if(entry<0)entry=p;continue;}for(let j=16;j<32;j+=2)used.add(disk[p+j]|disk[p+j+1]<<8);}
 if(entry<0)throw Error('No directory slot for diagnostic');
 const blocks=[];for(let b=2;b<390&&blocks.length<Math.ceil(bytes.length/2048);b++)if(!used.has(b))blocks.push(b);
 if(blocks.length<Math.ceil(bytes.length/2048))throw Error('No diagnostic space');
 disk.fill(0,entry,entry+32);const [stem,ext='']=name.split('.');disk.set(new TextEncoder().encode(stem.padEnd(8)+ext.padEnd(3)),entry+1);disk[entry+15]=Math.ceil(bytes.length/128);
 blocks.forEach((b,i)=>{disk[entry+16+i*2]=b&255;disk[entry+17+i*2]=b>>8;disk.fill(0x1a,base+b*2048,base+(b+1)*2048);disk.set(bytes.subarray(i*2048,(i+1)*2048),base+b*2048);});
}
