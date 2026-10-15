// Build ../dac-emulation/build/dac-replay with `make build/dac-replay` first.
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { decodeRecording, unbase64 } from "../src/recording.js";
import { digest } from "../src/session-store.js";
const file = process.argv[2];
if (!file)
  throw Error(
    "Usage: node scripts/replay-native.mjs session.dacrecord [native-runner]",
  );
const input = await readFile(file);
const record = await decodeRecording(
  input.buffer.slice(input.byteOffset, input.byteOffset + input.length),
);
const chunks = [Buffer.from(record.result.length===5?"DACR2":"DACR1")];
const number = (n) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  chunks.push(b);
};
const bytes = (data) => {
  const b = data ? Buffer.from(unbase64(data)) : Buffer.alloc(0);
  number(b.length);
  chunks.push(b);
};
number(record.kind);
number(record.firmware.length);
for (const [slot, data] of record.firmware) {
  number(slot);
  bytes(data);
}
for (let u = 0; u < 2; u++) {
  number(Number(record.writable[u]));
  bytes(record.disks[u]);
}
number(record.media.length);
for (const media of record.media) {
  number(Number(media.writable));
  bytes(media.bytes);
}
number(record.events.length);
for (const [op, a = 0, b = 0] of record.events) {
  number(op);
  number(a);
  number(b);
}
const result = spawnSync(
  resolve(process.argv[3] || "../dac-emulation/build/dac-replay"),
  [],
  { input: Buffer.concat(chunks), maxBuffer: 8 * 1024 * 1024, timeout: 240000 },
);
if (result.status !== 0)
  throw Error(
    result.error?.message ||
      result.stderr?.toString() ||
      "Native replay failed",
  );
let offset = 0;
const hashes = [];
for (let i = 0; i < record.result.length; i++) {
  const n = result.stdout.readUInt32LE(offset);
  offset += 4;
  if (offset + n > result.stdout.length) throw Error("Truncated native output");
  hashes.push(await digest(result.stdout.subarray(offset, offset + n)));
  offset += n;
}
if (
  offset !== result.stdout.length ||
  hashes.some((h, i) => h !== record.result[i])
)
  throw Error(
    "Native replay differs from recorded output: " + JSON.stringify(hashes),
  );
console.log(
  "PASS native replay: display, both disks and printer match",
  hashes,
);
