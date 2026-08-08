import { mkdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const dist = join(root, 'apps/playground/dist');
const screenshots = join(root, 'docs/screenshots');

async function run(command: string[]): Promise<string> {
  const process = Bun.spawn(command, { cwd: root, stdout: 'pipe', stderr: 'pipe' });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);
  if (exitCode !== 0) throw new Error(`${command.join(' ')} failed with exit code ${exitCode}\n${stderr}`);
  return stdout;
}

await mkdir(screenshots, { recursive: true });
const registryHtml = Bun.file(join(dist, 'registry.html'));
if (!(await registryHtml.exists())) throw new Error('Registry Explorer build output is missing registry.html');

const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 0,
  async fetch(request) {
    const url = new URL(request.url);
    const relative = url.pathname === '/' ? 'registry.html' : url.pathname.slice(1);
    const file = Bun.file(join(dist, relative));
    if (!(await file.exists())) return new Response('Not found', { status: 404 });
    return new Response(file);
  },
});

const chrome = Bun.which('google-chrome') ?? Bun.which('google-chrome-stable') ?? Bun.which('chromium');
if (!chrome) throw new Error('No headless Chrome/Chromium binary found on the CI runner.');

const cases = [
  { name: 'registry-explorer-desktop.png', item: 'process-pump', size: '1440,1000' },
  { name: 'registry-explorer-tablet.png', item: 'process-tank', size: '1024,900' },
  { name: 'registry-explorer-mobile.png', item: 'process-control-valve', size: '390,844' },
] as const;

try {
  for (const shot of cases) {
    const url = `http://127.0.0.1:${server.port}/registry.html?item=${shot.item}`;
    const dom = await run([
      chrome,
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      '--virtual-time-budget=2200',
      '--dump-dom',
      url,
    ]);
    if (!dom.includes(`data-registry-ready=\"${shot.item}\"`)) {
      throw new Error(`Registry Explorer did not become ready for ${shot.item}`);
    }
    const path = join(screenshots, shot.name);
    await run([
      chrome,
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${shot.size}`,
      '--virtual-time-budget=2200',
      `--screenshot=${path}`,
      url,
    ]);
    const bytes = await readFile(path);
    if (bytes.byteLength < 20_000) throw new Error(`${shot.name} is unexpectedly small: ${bytes.byteLength} bytes`);
    console.log(`${shot.name}: ${bytes.byteLength} bytes`);
  }
  console.log('registry Explorer browser proof passed: 3 responsive screenshots');
} finally {
  server.stop(true);
}
