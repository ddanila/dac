// Browser-local copies only. Firmware/disk identities separate specimens and
// custom media; emulator build identity additionally isolates save states.
export async function digest(bytes) {
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}
export async function sessionIdentity(kind, firmware, disk) {
  const parts = await Promise.all(
    firmware.map(async ([slot, bytes]) => `${slot}:${await digest(bytes)}`),
  );
  return `${kind}:${parts.sort().join(":")}:${disk ? await digest(disk) : "empty"}`;
}
function checkpointMeta(key,r){return {key,name:typeof r?.name==='string'?r.name.slice(0,80):'Damaged checkpoint',date:Number.isFinite(r?.date)?r.date:0,kind:r?.kind,build:r?.build,checking:true};}
export async function checkpointMetadata(){const db=await database();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('checkpoint-meta'),req=tx.objectStore('checkpoint-meta').getAll();tx.oncomplete=()=>resolve(req.result.sort((a,b)=>b.date-a.date));tx.onabort=tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("dac-sessions", 2);
    request.onupgradeneeded = () => {
      const db=request.result;if(!db.objectStoreNames.contains('copies'))db.createObjectStore('copies');
      const meta=db.createObjectStore('checkpoint-meta'),cursor=request.transaction.objectStore('copies').openCursor();
      cursor.onsuccess=()=>{const c=cursor.result;if(!c)return;if(String(c.key).startsWith('checkpoint:'))meta.put(checkpointMeta(c.key,c.value),c.key);c.continue();};
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function stored(key, value) {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(
        value === undefined ? "copies" : ["copies","checkpoint-meta"],
        value === undefined ? "readonly" : "readwrite",
      );
      const store = tx.objectStore("copies");
      const req =
        value === undefined
          ? store.get(key)
          : value === null
            ? store.delete(key)
            : store.put(value, key);
      if(value!==undefined&&key.startsWith('checkpoint:')){const meta=tx.objectStore('checkpoint-meta');if(value===null)meta.delete(key);else meta.put(checkpointMeta(key,value),key);}
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () =>
        reject(tx.error || Error("Local storage transaction aborted"));
    });
  } finally {
    db.close();
  }
}
export async function checkedRecord(key) {
  const record = await stored(key);
  if (
    record &&
    (!(record.bytes instanceof ArrayBuffer) ||
      (await digest(record.bytes)) !== record.sha256)
  )
    throw Error(
      "The saved copy failed its integrity check. Export your current disk or discard the saved copy.",
    );
  return record;
}
export async function saveRecord(key, bytes) {
  await stored(key, { bytes, sha256: await digest(bytes), date: Date.now() });
}

export async function storedKeys() {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const req = db.transaction("copies").objectStore("copies").getAllKeys();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}
// Length-prefixed JSON identity and SHA-256 followed by the same-build core state.
export async function encodeSnapshot(key, bytes) {
  const header = new TextEncoder().encode(
    JSON.stringify({
      format: "DAC-state-2",
      key,
      compatibility: "pinned-runtime",
      sha256: await digest(bytes),
    }),
  );
  const out = new Uint8Array(4 + header.length + bytes.byteLength);
  new DataView(out.buffer).setUint32(0, header.length, true);
  out.set(header, 4);
  out.set(new Uint8Array(bytes), 4 + header.length);
  return out.buffer;
}
export function snapshotHeader(file) {
  if (
    !(file instanceof ArrayBuffer) ||
    file.byteLength < 8 ||
    file.byteLength > 4 * 1024 * 1024
  )
    throw Error("Invalid snapshot size.");
  const n = new DataView(file).getUint32(0, true);
  if (n > 8192 || n > file.byteLength - 4)
    throw Error("Invalid snapshot header.");
  const header = JSON.parse(
    new TextDecoder().decode(new Uint8Array(file, 4, n)),
  );
  if (
    !["DAC-state-1", "DAC-state-2"].includes(header.format) ||
    typeof header.key !== "string" ||
    !/^state:[a-f0-9]{64}:/.test(header.key)
  )
    throw Error("Unsupported snapshot format.");
  return { header, offset: 4 + n };
}
export async function decodeSnapshot(file, key) {
  const { header, offset } = snapshotHeader(file);
  // Library UUIDs isolate browser-local saves, not portable media compatibility.
  const portableKey = (value) => value.replace(/:library:[a-f0-9-]{36}/g, "");
  if (portableKey(header.key) !== portableKey(key))
    throw Error(
      "Snapshot needs the same machine, original media and write settings.",
    );
  const bytes = file.slice(offset);
  if (header.sha256 !== (await digest(bytes)))
    throw Error("Snapshot failed its integrity check.");
  return bytes;
}

// One transaction keeps a collection snapshot coherent across tabs.
export async function collectionRecords() {
  const db=await database();
  try {return await new Promise((resolve,reject)=>{
    const tx=db.transaction('copies'),store=tx.objectStore('copies');
    const keys=store.getAllKeys(),values=store.getAll();
    tx.oncomplete=()=>resolve(keys.result.map((key,i)=>[key,values.result[i]]));
    tx.onabort=tx.onerror=()=>reject(tx.error);
  });}finally{db.close();}
}
export async function mergeCollection(rows,equal,replace=new Map()) {
  const db=await database();
  try{return await new Promise((resolve,reject)=>{
    const tx=db.transaction(['copies','checkpoint-meta'],'readwrite'),store=tx.objectStore('copies');
    const put=(value,key)=>{store.put(value,key);if(key.startsWith('checkpoint:'))tx.objectStore('checkpoint-meta').put(checkpointMeta(key,value),key);};
    let failure,added=0,duplicates=0;
    for(const [key,value] of rows){const req=store.get(key);req.onsuccess=()=>{
      if(failure)return;
      if(req.result===undefined){put(value,key);added++;}
      else if(equal(req.result,value))duplicates++;
      else if(replace.has(key)&&equal(req.result,replace.get(key))){put(value,key);added++;}
      else{failure=Error(`A different saved record already exists (${key.slice(0,90)}). Nothing imported. Restore into a separate browser profile to keep both collections.`);tx.abort();}
    };}
    tx.oncomplete=()=>resolve({added,duplicates});
    tx.onabort=tx.onerror=()=>reject(failure||tx.error||Error('Collection import aborted.'));
  });}finally{db.close();}
}
