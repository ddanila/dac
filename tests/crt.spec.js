import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { crtGeometry, crtDepth } from "../src/robotron-crt.js";

const profile = JSON.parse(
  readFileSync(
    new URL("../public/models/robotron-1715m/model.json", import.meta.url),
  ),
).screen;
test("CRT is convex and every raster corner fits inside the glass", () => {
  expect(
    crtDepth(profile, 0, 0) - crtDepth(profile, profile.size[0] / 2, 0),
  ).toBeGreaterThan(8);
  const [w, h] = profile.rasterSize;
  for (const x of [-w / 2, w / 2])
    for (const y of [-h / 2, h / 2]) {
      const inside =
        Math.abs((2 * x) / profile.size[0]) ** profile.outlinePower +
        Math.abs((2 * y) / profile.size[1]) ** profile.outlinePower;
      expect(inside).toBeLessThan(0.85);
      expect(crtDepth(profile, x, y)).toBeGreaterThan(0);
    }
  const geometry = crtGeometry(profile);
  const uv = geometry.attributes.uv;
  expect(
    Math.min(...Array.from({ length: uv.count }, (_, i) => uv.getX(i))),
  ).toBeLessThan(0);
  expect(
    Math.max(...Array.from({ length: uv.count }, (_, i) => uv.getY(i))),
  ).toBeGreaterThan(1);
  geometry.dispose();
});
test("interior photos are opt-in and visibly identify the other specimen", async ({
  page,
}) => {
  const photos = [];
  await page.route("https://oldcrap.org/wp-content/**", (route) => {
    photos.push(route.request().url());
    return route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"><rect width="40" height="30" fill="gray"/></svg>',
    });
  });
  await page.goto("/");
  expect(photos).toHaveLength(0);
  const references = page.locator("#interior-references");
  await references.locator("summary").click();
  await expect(references).toContainText(
    "Another specimen, not Danila’s 1715M",
  );
  await expect.poll(() => photos.length).toBe(2);
  await expect(
    references.getByRole("link", {
      name: "Oldcrap’s Robotron 1715 restoration ↗",
      exact: true,
    }),
  ).toHaveAttribute("href", "https://oldcrap.org/2017/12/26/robotron-1715/");
});
