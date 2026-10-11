/* Measure the reference S600 ASCII matrix by running its ROM, not copying its
 * bytes. Build against the sibling dac-emulation core; see README. */
#include "../../dac-emulation/machines/robotron1715m/robotron.h"
#include <assert.h>
#include <stdio.h>
static robotron m;
static unsigned count;
static uint8_t received[256];
static void run(unsigned ticks) {
  while (ticks) {
    unsigned n = ticks > 1000 ? 1000 : ticks;
    robotron_run(&m, n);
    ticks -= n;
    while (m.rx.count) {
      assert(count < 256);
      received[count++] = robotron_sio_read(&m, 0);
    }
  }
}
static void press(unsigned col, unsigned bit) {
  robotron_keyboard_key(&m.keyboard, col, bit, 1);
  run(400000);
  robotron_keyboard_key(&m.keyboard, col, bit, 0);
  run(400000);
}
int main(int argc, char **argv) {
  if (argc != 2) {
    fprintf(stderr, "usage: keyboard-rom-test S600.bin\n");
    return 2;
  }
  uint8_t rom[2048];
  FILE *f = fopen(argv[1], "rb");
  assert(f && fread(rom, 1, sizeof(rom), f) == sizeof(rom) && fgetc(f) == EOF);
  fclose(f);
  int keys[128], modifiers[128];
  for (unsigned i = 0; i < 128; i++)
    keys[i] = -1;
  for (unsigned mods = 0; mods < 2; mods++)
    for (unsigned key = 0; key < 104; key++) {
      robotron_init(&m);
      m.rom[0] = 0x76;
      robotron_keyboard_load(&m, rom, sizeof(rom));
      m.sio_regs[0][3] = 0xc1;
      m.sio_regs[0][4] = 4;
      count = 0;
      run(1000000);
      count = 0;
      if (mods) {
        robotron_keyboard_key(&m.keyboard, 8, 1, 1);
        run(400000);
        count = 0;
      }
      press(key / 8, key % 8);
      if (count == 2 &&
          (received[1] >= 32 && received[1] < 127 || received[1] == 0x9e)) {
        unsigned code = received[1] == 0x9e ? 13 : received[1];
        keys[code] = key;
        modifiers[code] = mods;
      }
    }
  puts("{");
  int first = 1;
  for (unsigned code = 0; code < 128; code++)
    if (keys[code] >= 0) {
      printf("%s\"%u\":[%d,%d]", first ? "" : ",\n", code, keys[code],
             modifiers[code]);
      first = 0;
    }
  puts("\n}");
}
