import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = 'public/models/robotron-1715m/';
export const photoPatterns = ['public/models/robotron-1715m/photos/**', 'public/models/robotron-1715m/reference/**/*.jpg', 'public/models/robotron-1715m/reference/**/*.jpeg', 'public/docs/robotron-psu/photos/**'];

export function runtimePhotos(files, text) {
  // Inspection IDs omit PXL_/extension; older IDs also omit the 20261009 date.
  return files.filter(file => {
    if (!file.startsWith(root + 'photos/')) return true;
    const name = file.split('/').pop(), id = name.replace(/^PXL_/, '').replace(/\.jpg$/i, '');
    return text.includes(name) || text.includes(id) ||
      (id.startsWith('20261009_') && text.includes(id.slice(9)));
  });
}

export function selectedPhotos() {
  const files = execFileSync('git', ['ls-files', '-z', '--', ...photoPatterns], {encoding:'utf8'}).split('\0').filter(Boolean);
  const model = JSON.parse(readFileSync(root + 'model.json'));
  // references is the archive inventory, not a runtime image dependency.
  delete model.references;
  const sources = ['index.html', root + 'keyboard-controller.json',
    ...readdirSync('src', {recursive:true}).filter(f => /\.(js|json)$/.test(f)).map(f => 'src/' + f),
    ...readdirSync('tests', {recursive:true}).filter(f => /\.(js|html|json)$/.test(f) && !f.endsWith('ci-durations.json')).map(f => 'tests/' + f)];
  return runtimePhotos(files, JSON.stringify(model) + '\n' + sources.map(f => readFileSync(f,'utf8')).join('\n'));
}

export function verifyPhotos(files) {
  for (const file of files) {
    const bytes = readFileSync(file);
    if (bytes.subarray(0,80).toString().startsWith('version https://git-lfs.github.com/spec/v1')) {
      throw Error(`Photo is still an LFS pointer: ${file}`);
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const all = process.argv.includes('--all');
  const files = all ? execFileSync('git', ['ls-files','-z','--',...photoPatterns], {encoding:'utf8'}).split('\0').filter(Boolean) : selectedPhotos();
  if (!files.length) throw Error('Photo selection is empty');
  if (!process.argv.includes('--verify')) {
    execFileSync('git', ['lfs','pull', '--include=' + files.join(','), '--exclude='], {stdio:'inherit'});
  }
  verifyPhotos(files);
  console.log(`Verified ${files.length} hydrated ${all ? 'archive' : 'runtime'} photos`);
}
