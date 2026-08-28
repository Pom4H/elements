import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

interface PackedFile {
  readonly path: string;
}

interface PackResult {
  readonly filename: string;
  readonly files: readonly PackedFile[];
}

const root = resolve(import.meta.dir, '..');
const skipBuild = Bun.argv.includes('--skip-build');

async function run(command: string[], cwd: string): Promise<string> {
  const process = Bun.spawn(command, {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);
  if (exitCode !== 0) {
    throw new Error(`${command.join(' ')} failed with exit code ${exitCode}\n${stderr}`);
  }
  return stdout;
}

async function pack(packageDirectory: string, packDirectory: string, required: readonly string[]): Promise<string> {
  const output = await run(['npm', 'pack', '--json', '--pack-destination', packDirectory], packageDirectory);
  const [result] = JSON.parse(output) as readonly PackResult[];
  if (!result) throw new Error(`npm pack returned no artifact for ${packageDirectory}`);

  const files = new Set(result.files.map((file) => file.path));
  for (const path of required) {
    if (!files.has(path)) throw new Error(`${result.filename} is missing required file: ${path}`);
  }
  for (const path of files) {
    if (path.startsWith('src/')) throw new Error(`${result.filename} unexpectedly publishes source file: ${path}`);
  }

  return join(packDirectory, result.filename);
}

const temporary = await mkdtemp(join(tmpdir(), 'elements-release-'));
const packs = join(temporary, 'packs');
const consumer = join(temporary, 'consumer');

try {
  await mkdir(packs, { recursive: true });
  await mkdir(consumer, { recursive: true });

  if (!skipBuild) await run(['bun', 'run', 'build'], root);

  const coreTarball = await pack(join(root, 'packages/core'), packs, [
    'package.json',
    'dist/index.js',
    'dist/index.d.ts',
    'dist/register.js',
    'dist/runtime.js',
  ]);
  const processTarball = await pack(join(root, 'packages/process-elements'), packs, [
    'package.json',
    'dist/index.js',
    'dist/index.d.ts',
    'dist/register.js',
    'dist/manifest.js',
  ]);
  const electricalTarball = await pack(join(root, 'packages/electrical-elements'), packs, [
    'package.json',
    'dist/index.js',
    'dist/index.d.ts',
    'dist/register.js',
    'dist/manifest.js',
  ]);

  await writeFile(join(consumer, 'package.json'), `${JSON.stringify({
    private: true,
    type: 'module',
    dependencies: {
      '@pom4h/elements-core': `file:${coreTarball}`,
      '@pom4h/process-elements': `file:${processTarball}`,
      '@pom4h/electrical-elements': `file:${electricalTarball}`,
    },
  }, null, 2)}\n`);

  await run(['npm', 'install', '--ignore-scripts'], consumer);

  await writeFile(join(consumer, 'server.mjs'), `
import { processElementsManifest } from '@pom4h/process-elements/manifest';
import { electricalElementsManifest } from '@pom4h/electrical-elements/manifest';

if (!Array.isArray(processElementsManifest.elements) || processElementsManifest.elements.length === 0) {
  throw new Error('process-elements manifest contains no elements');
}
if (electricalElementsManifest.elements.length !== 6) {
  throw new Error('electrical-elements manifest must contain six reference elements');
}
if (!electricalElementsManifest.elements.some((entry) => entry.tagName === 'ee-hardware-wallet')) {
  throw new Error('electrical-elements manifest is missing ee-hardware-wallet');
}
if (typeof globalThis.document !== 'undefined' || typeof globalThis.customElements !== 'undefined') {
  throw new Error('server smoke test unexpectedly has DOM globals');
}
console.log('server-safe manifests:', processElementsManifest.elements.length + electricalElementsManifest.elements.length, 'elements');
`);
  await run(['bun', 'server.mjs'], consumer);

  await writeFile(join(consumer, 'browser.ts'), `
import '@pom4h/process-elements/register';
import '@pom4h/electrical-elements/register';

const pump = document.createElement('pe-pump');
pump.setAttribute('label', 'P-101');
document.body.append(pump);
const motor = document.createElement('ee-motor');
motor.setAttribute('running', '');
motor.setAttribute('speed', '1450');
document.body.append(motor);
const wallet = document.createElement('ee-hardware-wallet');
wallet.setAttribute('state', 'review');
wallet.setAttribute('screen-line-1', 'SEND 0.10 BTC');
document.body.append(wallet);
if (!customElements.get('pe-pump') || !customElements.get('ee-motor') || !customElements.get('ee-hardware-wallet')) {
  throw new Error('browser registration failed');
}
`);
  await run(['bun', 'build', 'browser.ts', '--target=browser', '--outdir=browser-dist'], consumer);

  console.log('release package smoke test passed for core + process + electrical');
} finally {
  await rm(temporary, { recursive: true, force: true });
}
