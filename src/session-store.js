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
function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("dac-sessions", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("copies");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function stored(key, value) {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(
        "copies",
        value === undefined ? "readonly" : "readwrite",
      );
      const store = tx.objectStore("copies");
      const req =
        value === undefined
          ? store.get(key)
          : value === null
            ? store.delete(key)
            : store.put(value, key);
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
