import { readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

async function filesUnder(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  }));
  return files.flat();
}

await rm('./dist', { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: ['./index.html', './catalog.html', './scale.html', './semantic-zoom.html'],
  outdir: './dist',
  target: 'browser',
  minify: true,
  sourcemap: 'linked',
  naming: {
    entry: '[dir]/[name]-[hash].[ext]',
    chunk: 'chunks/[name]-[hash].[ext]',
    asset: 'assets/[name]-[hash].[ext]',
  },
});

if (!result.success) {
  for (const message of result.logs) console.error(message);
  process.exit(1);
}

const javascriptFiles = (await filesUnder('./dist')).filter((path) => path.endsWith('.js'));
const javascript = (await Promise.all(javascriptFiles.map((path) => readFile(path, 'utf8')))).join('\n');

for (const requiredToken of [
  'elements-studio-shell',
  'pe-pump',
  'pe-tank',
  'pe-control-valve',
  'pe-controller',
  'pe-pid-pump',
  'pe-pid-valve',
  'pe-pid-vessel',
  'semantic-zoom',
  'elements-scene',
  'el-connection',
  'el-pipe',
  'el-junction',
  'customElements',
]) {
  if (!javascript.includes(requiredToken)) {
    throw new Error(`Production bundle is missing required runtime token: ${requiredToken}`);
  }
}
