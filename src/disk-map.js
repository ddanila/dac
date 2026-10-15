// Robotron reference geometry; raw CHS order matches the emulator disk adapter.
// CP/M profile: OFF=4 side-tracks, BLS=2048, DSM=389, DRM=127, EXM=0.
export function inspectDisk(input, filesystem = 'tosm') {
  const bytes = new Uint8Array(input), text = (a,b) => String.fromCharCode(...bytes.subarray(a,b));
  const extended=text(0,34)==='EXTENDED CPC DSK File\r\nDisk-Info\r\n';
  const standard=text(0,34)==='MV - CPCEMU Disk-File\r\nDisk-Info\r\n';
  const sectors=[];
  const add=(c,h,r,n,offset,slot,count,idC=c,idH=h,flags=0)=>{
    const size=128*2**n;
    if(n>5 || offset+size>bytes.length)throw Error('Truncated or unsupported sector');
    sectors.push({c,h,r,n,offset,size,slot,count,idC,idH,flags,kind:'unknown'});
  };
  let cylinders=80,sides=2;
  if(!extended&&!standard){
    if(bytes.length!==819200)throw Error('Supported images: Robotron 800 KiB raw, standard DSK and extended DSK.');
    for(let c=0;c<80;c++)for(let h=0;h<2;h++)for(let r=1;r<=5;r++)add(c,h,r,3,((c*2+h)*5+r-1)*1024,r-1,5);
  }else{
    cylinders=bytes[48];sides=bytes[49];
    if(!cylinders||cylinders>80||!sides||sides>2)throw Error('Unsupported disk geometry');
    let offset=256;
    for(let t=0;t<cylinders*sides;t++){
      const length=extended?bytes[52+t]*256:bytes[50]+256*bytes[51];
      if(!length&&extended)continue;
      const c=Math.floor(t/sides),h=t%sides;
      if(length<256||offset+length>bytes.length||text(offset,offset+12)!=='Track-Info\r\n'||bytes[offset+16]!==c||bytes[offset+17]!==h)throw Error('Invalid DSK track');
      const count=bytes[offset+21];if(count>29)throw Error('Unsupported sector count');
      let data=offset+256;
      for(let slot=0;slot<count;slot++){
        const p=offset+24+slot*8,n=bytes[p+3],size=128*2**n;
        if(n>5||(extended&&bytes[p+6]+256*bytes[p+7]!==size)||(!extended&&n!==bytes[offset+20])||data+size>offset+length)throw Error('Unsupported DSK sector length');
        add(c,h,bytes[p+2],n,data,slot,count,bytes[p],bytes[p+1],bytes[p+4]|bytes[p+5]);data+=size;
      }
      offset+=length;
    }
    if(offset!==bytes.length)throw Error('Unexpected trailing DSK data');
  }
  const result={bytes,sectors,cylinders,sides,files:[],filesystem:false,note:'Raw sectors; no filesystem interpretation.'};
  if(filesystem!=='tosm')return result;
  const ordered=[];
  for(let c=0;c<80;c++)for(let h=0;h<2;h++)for(let r=1;r<=5;r++){
    const found=sectors.filter(s=>s.c===c&&s.h===h&&s.r===r&&s.idC===c&&s.idH===h&&s.size===1024);
    if(found.length!==1||found[0].flags){result.note='TOS/M allocation unavailable: geometry or sector status differs from the reference format.';return result;}
    ordered.push(found[0]);
  }
  if(sectors.length!==800)return result;
  const logical=new Uint8Array(819200);
  ordered.forEach((s,i)=>logical.set(bytes.subarray(s.offset,s.offset+s.size),i*1024));
  const files=new Map(),owners=new Map(),extents=new Set();
  try{
    for(let i=0;i<128;i++){
      const e=logical.subarray(20480+i*32,20480+(i+1)*32);
      if(e[0]===0xe5)continue;
      if(e[0]>15||e[15]>128)throw Error('Invalid directory entry');
      const name=String.fromCharCode(...e.subarray(1,9).map(v=>v&127)).trimEnd();
      const ext=String.fromCharCode(...e.subarray(9,12).map(v=>v&127)).trimEnd();
      if(!name||!/^[\x21-\x7e]+$/.test(name)||!/^[\x21-\x7e]*$/.test(ext))throw Error('Invalid filename');
      const key=`${e[0]}:${name}${ext?'.'+ext:''}`,extent=(e[14]&63)*32+(e[12]&31);
      if(extents.has(key+':'+extent))throw Error('Duplicate extent');extents.add(key+':'+extent);
      if(!files.has(key))files.set(key,{key,name:key,size:0,sectors:[]});
      const file=files.get(key);file.size=Math.max(file.size,extent*16384+e[15]*128);
      for(let j=0;j<8;j++){
        const block=e[16+j*2]+256*e[17+j*2];
        if(!block){if(j*2048<e[15]*128)throw Error('Missing allocation block');continue;}
        if(block<2||block>389||owners.has(block))throw Error('Invalid or shared allocation block');
        owners.set(block,{file,fileOffset:extent*16384+j*2048,valid:Math.max(0,Math.min(2048,e[15]*128-j*2048))});
      }
    }
  }catch(error){result.note=`TOS/M allocation unavailable: ${error.message}. Raw sectors remain readable.`;return result;}
  ordered.forEach((s,i)=>{
    s.logicalOffset=i*1024;
    if(i<20)s.kind='system';
    else if(i<24)s.kind='directory';
    else{
      const owner=owners.get(Math.floor((i*1024-20480)/2048));
      s.kind=owner?'file':'free';
      if(owner){s.file=owner.file.key;s.fileOffset=owner.fileOffset+((i-20)%2)*1024;s.valid=Math.max(0,Math.min(1024,owner.valid-((i-20)%2)*1024));owner.file.sectors.push(s);}
    }
  });
  return {...result,filesystem:true,files:[...files.values()].sort((a,b)=>a.name.localeCompare(b.name)),note:'TOS/M reference layout · free space is displayed blank · file lengths have 128-byte record precision.'};
}
export function sectorText(map,sector){
  if(sector.kind==='free')return 'Blank — unallocated space. Stored bytes are unchanged.';
  const bytes=map.bytes.subarray(sector.offset,sector.offset+sector.size),lines=[];
  for(let i=0;i<bytes.length;i+=16){
    const row=bytes.subarray(i,i+16);
    lines.push(i.toString(16).padStart(4,'0')+'  '+[...row].map(b=>b.toString(16).padStart(2,'0')).join(' ').padEnd(47)+'  '+[...row].map(b=>b>=32&&b<127?String.fromCharCode(b):'.').join(''));
  }
  return lines.join('\n');
}
