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
