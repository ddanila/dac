import {test,expect} from "@playwright/test";
import {observeKeys} from "./keyboard-fixture.js";
test('keyboard buttons send documented bytes and latch modifiers', async ({page}) => {
  await observeKeys(page);
  await page.locator("#key-list-toggle").click();
  const keys = page.locator("#key-list");
  const press = label => keys.getByRole("button", {name:label,exact:true}).first().dispatchEvent("click");
  await press("A");
  await press("Shift");
  await press("A");
  await press("CTRL");
  await press("C");
  await press("Caps Lock");
  await press("A");
  await press("Caps Lock");
  await press("PF1 · numeric or function keypad");
  await press("1 · numeric or function keypad");
  await press("Tab");
  expect(await page.evaluate(() => window.sentKeys)).toEqual([
    97, 65, 3, 65, 0xd1, 0xb1, 0x80,
  ]);
});

test('physical letters and special keys send their documented bytes', async ({page}) => {
  await test.step('Load model and diagnostic', () => observeKeys(page));
  await page.locator('#viewport').focus();
  await test.step('Type mixed case and special keys', async () => {
    await page.keyboard.type('Ab');
    await page.keyboard.press('F1');
    await page.keyboard.press('Delete');
  });
  expect(await page.evaluate(() => window.sentKeys)).toEqual([65,98,0xd1,0x7f]);
});

test('physical keys share Caps Lock state with keyboard buttons', async ({page}) => {
  await test.step('Load model and diagnostic', () => observeKeys(page));
  await page.locator('#key-list-toggle').click();
  const caps = page.locator('#key-list').getByRole('button',{name:'Caps Lock',exact:true});
  await test.step('Button Caps Lock affects physical typing', async () => {
    await caps.dispatchEvent('click');
    await expect(caps).toHaveAttribute('aria-pressed','true');
    await page.locator('#viewport').focus();
    await page.keyboard.type('c');
  });
  await test.step('Physical Caps Lock releases shared state', async () => {
    await page.keyboard.press('CapsLock');
    await expect(caps).toHaveAttribute('aria-pressed','false');
    await page.keyboard.type('c');
  });
  // Host Caps must not be applied again on top of the shared museum state.
  await page.evaluate(()=>{
    const target=document.querySelector('#viewport');
    target.dispatchEvent(new KeyboardEvent('keydown',{key:'C',code:'KeyC',modifierCapsLock:true,bubbles:true}));
    target.dispatchEvent(new KeyboardEvent('keyup',{key:'C',code:'KeyC',modifierCapsLock:true,bubbles:true}));
  });
  expect(await page.evaluate(() => window.sentKeys)).toEqual([67,99,99]);
});

test('keyboard control combinations and unsupported keys are explicit', async ({page}) => {
  await observeKeys(page);
  await page.locator("#key-list-toggle").click();
  const keys = page.locator("#key-list");
  const press = label => keys.getByRole("button", {name:label,exact:true}).first().dispatchEvent("click");
  await press("CTRL");
  await press("{");
  await press("CTRL");
  await press("@");
  expect(await page.evaluate(() => window.sentKeys.slice(-2))).toEqual([27, 0]);
  await press("ALT");
  await expect(page.locator("#key-feedback")).toContainText("not verified");
  expect(await page.evaluate(() => window.sentKeys.length)).toBe(2);
});

test('reset, blur and power-off clear keyboard input state', async ({page}) => {
  await observeKeys(page);
  await page.locator("#key-list-toggle").click();
  const keys = page.locator("#key-list");
  const press = label => keys.getByRole("button", {name:label,exact:true}).first().dispatchEvent("click");
  await press("CTRL");
  await page.locator("#reset").click();
  await expect(
    keys.getByRole("button", { name: "CTRL", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await press("Caps Lock");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(
    keys.getByRole("button", { name: "Caps Lock", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.locator("#power").click();
  await expect(page.locator("#status")).toHaveText("Powered off");
  await press("A");
  await expect(page.locator("#key-feedback")).toContainText("Power on");
  expect(await page.evaluate(() => window.sentKeys.length)).toBe(0);
});
