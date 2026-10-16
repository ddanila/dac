import {test,expect} from "@playwright/test";
import {PerspectiveCamera,Vector3,Euler} from "three";
import {observeKeys} from "./keyboard-fixture.js";
for (const gesture of ["click", "drag", "cancel"]) {
  test(`3D key ${gesture} sends input only for a completed click`, async ({
    page,
  }) => {
    // Includes model load, camera movement and a complete pointer gesture.
    test.setTimeout(process.env.CI ? 90000 : 60000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await observeKeys(page);
    await page.getByRole("button", { name: "Keyboard", exact: true }).click();
    const manifest = await (
      await page.request.get("/models/robotron-1715m/model.json")
    ).json();
    const key = manifest.keys.find((k) => k.label === "A");
    const box = await page.locator("#viewport").boundingBox();
    const camera = new PerspectiveCamera(36, box.width / box.height, 0.01, 40);
    camera.position.set(0, 1.55, 1.45);
    camera.lookAt(0, 0.07, 0.88);
    camera.updateMatrixWorld();
    const vector = new Vector3(key.x, key.y, 8.1).applyEuler(
      new Euler((manifest.keyboard.slope * Math.PI) / 180, 0, 0),
    );
    vector
      .add(new Vector3(0, manifest.keyboard.y, manifest.keyboard.z))
      .applyEuler(new Euler(-Math.PI / 2, 0, 0))
      .multiplyScalar(manifest.scale)
      .project(camera);
    const x = box.x + ((vector.x + 1) * box.width) / 2,
      y = box.y + ((1 - vector.y) * box.height) / 2;
    if (gesture === "click") {
      await page.mouse.click(x, y);
      await expect(page.locator("#key-feedback")).toHaveText("Sent A");
      await page.locator("#viewport").focus();
      await page.keyboard.press("Escape");
      await expect(page.locator("#viewport")).not.toBeFocused();
    } else {
      await page.mouse.move(x, y);
      await page.mouse.down();
      if (gesture === "drag")
        await page.mouse.move(x + 60, y + 30, { steps: 5 });
      else
        await page
          .locator("#viewport canvas")
          .dispatchEvent("pointercancel", { pointerId: 1 });
      await page.mouse.up();
    }
    expect(await page.evaluate(() => window.sentKeys)).toEqual(
      gesture === "click" ? [97] : [],
    );
  });
}
