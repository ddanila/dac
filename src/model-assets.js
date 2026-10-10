// A release cannot reuse a cached manifest or mesh from an earlier model.
export function modelAsset(path, base, hash) {
  const url = new URL(path, base);
  url.searchParams.set(
    "v",
    hash || import.meta.env?.VITE_ROBOTRON_MODEL_REVISION || "development",
  );
  return url;
}
