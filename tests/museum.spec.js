import { test, expect } from "@playwright/test";
test("power, live pixels, keyboard, reset, inspection and three profiles", async ({
  page,
}) => {
  const errors = [];
  const enclosurePhotos = [];
  page.on("request", (request) => {
    const url = request.url();
    // These reference photos contain complete panels, physical feet or cables.
    // Loading them as skins would reintroduce the duplicated-feature regression.
    if (
      /photos\/PXL_20261009_(133001660|133005363|133028313|132916421|132919894)/.test(
        url,
      )
    )
      enclosurePhotos.push(url);
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "error") errors.push(e.text());
  });
  await page.goto("/");
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#media-controls summary").click();
  await page.locator("#demo").click();
  await expect(page.locator("#media-label")).toHaveText("DAC diagnostic ROM");

  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-model",
    "robotron-photo",
  );
  const power = page.getByRole("button", { name: "Power on", exact: false });
  await expect(power).toBeEnabled();
  await power.click();
  await expect(page.getByRole("status")).toHaveText("Running");
  await page.getByRole("button", { name: "Screen", exact: true }).click();
  const canvas = page.locator("#screen");
  await expect(canvas).toBeVisible();
  const hash = () =>
    canvas.evaluate((c) => {
      const p = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < p.length; i += 4) n += p[i];
      return n;
    });
  await expect.poll(hash).toBeGreaterThan(640 * 384 * 18);
  const before = await hash();
  await canvas.focus();
  await page.keyboard.type("HELLO");
  await expect.poll(hash).not.toBe(before);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect.poll(hash).toBe(before);
  await page.getByRole("button", { name: "Underneath" }).click();
  await expect(canvas).toBeHidden();
  expect(enclosurePhotos).toEqual([]);
  await page.getByRole("button", { name: "Power off", exact: false }).click();
  await expect(page.getByRole("status")).toHaveText("Powered off");
  for (const value of ["0", "1"]) {
    await page.locator("#machine").selectOption(value);
    await expect(page.locator("#viewport")).toHaveAttribute(
      "data-model",
      "provisional",
    );
    await expect(power).toBeEnabled();
    await power.click();
    await expect(page.getByRole("status")).toHaveText("Running");
    await page.getByRole("button", { name: "Power off", exact: false }).click();
  }
  expect(errors).toEqual([]);
  await expect(page.locator("#error")).toBeEmpty();
});
test("bad media is rejected clearly and diagnostic can recover", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#media-controls summary").click();
  await page.locator("#rom").setInputFiles({
    name: "wrong.bin",
    mimeType: "application/octet-stream",
    buffer: Buffer.alloc(12),
  });
  await page.locator("#prom").setInputFiles({
    name: "cas.bin",
    mimeType: "application/octet-stream",
    buffer: Buffer.alloc(256),
  });
  await page.getByRole("button", { name: "Use selected files" }).click();
  await expect(page.getByRole("alert")).toContainText("rejected");
  await page.getByRole("button", { name: "Restore DAC diagnostic" }).click();
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#power").click();
  await expect(page.getByRole("status")).toHaveText("Running");
});

test("physical Robotron switches power and reset the live core", async ({
  page,
}) => {
  const { PerspectiveCamera, Vector3 } = await import("three");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#media-controls summary").click();
  await page.locator("#demo").click();
  await expect(page.locator("#media-label")).toHaveText("DAC diagnostic ROM");

  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-model",
    "robotron-photo",
  );
  await expect(page.locator("#power")).toBeEnabled();
  let viewport = await page.locator("#viewport").boundingBox();
  const camera = new PerspectiveCamera(
    36,
    viewport.width / viewport.height,
    0.01,
    40,
  );
  camera.position.set(0, 1.9, 3.8);
  camera.lookAt(0, 0.5, 0);
  camera.updateMatrixWorld();
  async function switchAt(x) {
    await page.getByRole("button", { name: "Front", exact: true }).click();
    viewport = await page.locator("#viewport").boundingBox();
    const p = new Vector3(x * 0.0025, 17 * 0.0025, 211 * 0.0025).project(
      camera,
    );
    await page.mouse.click(
      viewport.x + ((p.x + 1) * viewport.width) / 2,
      viewport.y + ((1 - p.y) * viewport.height) / 2,
    );
  }
  await switchAt(207);
  await expect(page.getByRole("status")).toHaveText("Running");
  const hash = () =>
    page.locator("#screen").evaluate((c) =>
      c
        .getContext("2d")
        .getImageData(0, 0, c.width, c.height)
        .data.reduce((n, v) => n + v, 0),
    );
  await expect.poll(hash).toBeGreaterThan(640 * 288 * 255);
  const before = await hash();
  await page.getByRole("button", { name: "Screen", exact: true }).click();
  await page.locator("#screen").focus();
  await page.keyboard.type("OWNER MODEL");
  await expect.poll(hash).not.toBe(before);
  await switchAt(-208);
  await expect.poll(hash).toBe(before);
  await switchAt(207);
  await expect(page.getByRole("status")).toHaveText("Powered off");
});

test("a missing model preserves the accessible emulator and honest labels", async ({
  page,
}) => {
  await page.route("**/models/robotron-1715m/model.json*", (route) =>
    route.fulfill({ status: 404, body: "missing" }),
  );
  await page.goto("/");
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-model",
    "unavailable",
  );
  await expect(page.locator("#model-note")).toContainText("MODEL UNAVAILABLE");
  await expect(page.locator("#status")).toHaveText("Powered off");
  await page.locator("#viewport canvas").click({ position: { x: 5, y: 100 } });
  await page.waitForTimeout(100); // Allow a mistakenly queued power request to return.
  await expect(page.locator("#status")).toHaveText("Powered off");
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#power").click();
  await expect(page.getByRole("status")).toHaveText("Running");
  await page.locator("#power").click();
  await expect(page.getByRole("status")).toHaveText("Powered off");
  await page.locator("#machine").selectOption("0");
  await expect(page.locator("#model-note")).toContainText("PROVISIONAL");
});
