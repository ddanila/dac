// Worker/DOM integration tests retain the real emulator and 2D raster.
// Full CAD interaction and rendering remain covered by the visual suites.
export async function withoutCAD(page) {
  await page.route(/\/models\/robotron-1715m\/model\.json(?:\?.*)?$/, route => route.fulfill({status:503,body:'CAD omitted in nonvisual integration fixture'}));
}
