import { stored, storedKeys, checkedRecord, digest } from "./session-store.js";
export async function diskLibrary() {
  const keys = (await storedKeys()).filter((k) => k.startsWith("library:"));
  const entries = await Promise.all(
    keys.map(async (id) => {
      const r = await stored(id);
      return {
        id,
        name: r.name,
        kind: r.kind,
        size: r.bytes.byteLength,
        date: r.date,
      };
    }),
  );
  return entries.sort((a, b) => a.name.localeCompare(b.name));
}
export async function libraryDisk(id) {
  if (typeof id !== "string" || !id.startsWith("library:"))
    throw Error("Choose a library disk.");
  const r = await checkedRecord(id);
  if (
    !r ||
    !(r.original instanceof ArrayBuffer) ||
    (await digest(r.original)) !== r.originalHash
  )
    throw Error("Library disk failed its original-image integrity check.");
  return r;
}
export async function saveLibraryDisk(name, kind, bytes) {
  name = String(name).trim();
  if (!name || name.length > 80)
    throw Error("Use a disk name of 1–80 characters.");
  const id = "library:" + crypto.randomUUID(),
    sha256 = await digest(bytes);
  await stored(id, {
    name,
    kind,
    bytes,
    original: bytes,
    sha256,
    originalHash: sha256,
    date: Date.now(),
  });
  return id;
}
export async function updateLibraryDisk(id, bytes) {
  const r = await libraryDisk(id);
  await stored(id, {
    ...r,
    bytes,
    sha256: await digest(bytes),
    date: Date.now(),
  });
}
