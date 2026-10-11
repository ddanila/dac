import archived from "./archived-cores.json";
import { digest } from "./session-store.js";
// Only museum-pinned code can run. Snapshot files cannot supply executable code/URLs.
export async function archivedCore(build, base) {
  const entry = archived[build];
  if (!entry)
    throw Error("This emulator version is not preserved by this museum build.");
  const root = new URL(`archive/${build}/`, base);
  const buffers = await Promise.all(
    ["dac.js", "dac.wasm"].map(async (name) => {
      const response = await fetch(new URL(name, root));
      if (!response.ok) throw Error("Preserved emulator could not be loaded.");
      return response.arrayBuffer();
    }),
  );
  if (
    (await digest(buffers[0])) !== entry.javascript ||
    (await digest(buffers[1])) !== build
  )
    throw Error("Preserved emulator failed its integrity check.");
  const url = URL.createObjectURL(
    new Blob([buffers[0]], { type: "text/javascript" }),
  );
  try {
    const { default: create } = await import(/* @vite-ignore */ url);
    return await create({
      wasmBinary: new Uint8Array(buffers[1]),
      locateFile: (n) => new URL(n, root).href,
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const hasArchivedCore = (build) => Object.hasOwn(archived, build);
