// SPDX-License-Identifier: MIT
// Incremental SHA-256: capture hashing must not copy a whole boot file.
const K=new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
const R=(x,n)=>(x>>>n)|(x<<(32-n));
export class SHA256{
 constructor(){this.h=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);this.b=new Uint8Array(64);this.n=0;this.length=0;this.w=new Uint32Array(64);}
 block(b){const w=this.w,v=new DataView(b.buffer,b.byteOffset,64);for(let i=0;i<16;i++)w[i]=v.getUint32(i*4);for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2];w[i]=(R(x,7)^R(x,18)^(x>>>3))+w[i-16]+(R(y,17)^R(y,19)^(y>>>10))+w[i-7];}let [a,c,d,e,f,g,h,j]=this.h;
 for(let i=0;i<64;i++){const t=(j+(R(f,6)^R(f,11)^R(f,25))+((f&g)^(~f&h))+K[i]+w[i])>>>0,u=((R(a,2)^R(a,13)^R(a,22))+((a&c)^(a&d)^(c&d)))>>>0;j=h;h=g;g=f;f=(e+t)>>>0;e=d;d=c;c=a;a=(t+u)>>>0;}[a,c,d,e,f,g,h,j].forEach((x,i)=>this.h[i]+=x);}
 update(bytes){this.length+=bytes.length;let i=0;while(i<bytes.length){if(!this.n&&i+64<=bytes.length){this.block(bytes.subarray(i,i+64));i+=64;}else{this.b[this.n++]=bytes[i++];if(this.n===64){this.block(this.b);this.n=0;}}}return this;}
 digest(){const bits=BigInt(this.length)*8n;this.update(new Uint8Array([128]));while(this.n!==56)this.update(new Uint8Array([0]));const tail=new Uint8Array(8);new DataView(tail.buffer).setBigUint64(0,bits);this.update(tail);return [...this.h].map(n=>n.toString(16).padStart(8,'0')).join('');}
}
