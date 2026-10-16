// A bounded plain-text paper view, not an emulation of a particular printer.
export function printerPages(bytes) {
  const pages = []; let lines = [[]], row = 0, column = 0;
  const finish = () => pages.push(lines.map(line => line.join('')).join('\n'));
  const put = character => {
    const line = lines[row] ||= [];
    while (line.length < column) line.push(' ');
    line[column++] = character;
    if (column >= 256) {column=0; row++;}
  };
  for (const byte of bytes.subarray(0, 65536)) {
    if (byte === 13) column = 0;
    else if (byte === 10) {row++;lines[row] ||= [];}
    else if (byte === 12) {finish();lines=[[]];row=column=0;}
    else if (byte === 8) column = Math.max(0,column-1);
    else if (byte === 9) {const n=8-column%8;for(let i=0;i<n;i++)put(' ');}
    else if (byte >= 32 && byte < 127) put(String.fromCharCode(byte));
    else for (const character of `⟦${byte.toString(16).padStart(2,'0')}⟧`) put(character);
  }
  finish(); return pages;
}
export const activities = Object.freeze({
  wordstar: {title:'Practice: WordStar', steps:'1. Power on and wait for A>.\n2. Type WS DAC.TXT and press Enter.\n3. Write HELLO FROM DAC and press Enter.\n4. Press Ctrl+K, then D to save and return to the WordStar menu.\n5. Press D, wait for NAME OF FILE, enter DAC.TXT and press Enter to reopen your saved document.\n6. Export the practice disk if you want to keep it.'},
  pascal: {title:'Practice: Turbo Pascal', steps:"1. Power on and wait for A>.\n2. Type PIP and press Enter. Wait for *, then type DAC.PAS=CON: and press Enter.\n3. Type these lines, pressing Enter after each:\nprogram DAC;\nbegin writeln('HELLO FROM DAC') end.\n4. Press Ctrl+Z, wait for *, then press Enter to return to A>.\n5. Type TP and press Enter.\n6. Answer N to messages; W selects the work file.\n7. Enter DAC.PAS, then R to compile and run."},
  printer: {title:'Practice: printer', steps:'1. Power on and wait for A>.\n2. Type PIP LST:=AUTOEXC.SUB and press Enter.\n3. Open Printer output and refresh the paper preview.\n4. Export printer output for the original bytes.'},
});
