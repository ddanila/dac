// Explicitly import a built release; never fetch a moving branch at runtime.
import { readFile, cp, mkdir, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
const from = resolve(process.argv[2] || "../dac-emulation/dist");
const manifest = JSON.parse(await readFile(from + "/manifest.json", "utf8"));
for (const [name, expected] of Object.entries(manifest.sha256)) {
  if (name.includes("..") || name.startsWith("/"))
    throw Error("Invalid manifest path");
  const actual = createHash("sha256")
    .update(await readFile(from + "/" + name))
    .digest("hex");
  if (actual !== expected) throw Error("Checksum mismatch: " + name);
}
const to = resolve("public/emulator");
await mkdir(to, { recursive: true });
for (const name of [
  ...Object.keys(manifest.sha256),
  "manifest.json",
  "SHA256SUMS",
])
  await cp(from + "/" + name, to + "/" + name, { recursive: true });
console.log(`Pinned DAC Emulation ${manifest.version} (${manifest.commit})`);
