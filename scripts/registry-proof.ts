import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const ref = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || 'main';
const temporary = await mkdtemp(join(tmpdir(), 'elements-registry-proof-'));
const consumer = join(temporary, 'consumer');

async function run(command: string[], cwd: string): Promise<string> {
  const process = Bun.spawn(command, { cwd, stdout: 'pipe', stderr: 'pipe' });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);
  if (exitCode !== 0) throw new Error(`${command.join(' ')} failed with exit code ${exitCode}\n${stderr}`);
  return stdout;
}

async function exists(path: string): Promise<boolean> {
  return Bun.file(path).exists();
}

let server: ReturnType<typeof Bun.serve> | undefined;

try {
  await mkdir(consumer, { recursive: true });
  await writeFile(join(consumer, 'package.json'), `${JSON.stringify({
    private: true,
    type: 'module',
    dependencies: {
      '@pom4h/elements-core': `file:${join(root, 'packages/core')}`,
    },
  }, null, 2)}\n`);
  await run(['npm', 'install', '--ignore-scripts'], consumer);

  const item = `Pom4H/elements/process-pump#${ref}`;
  await run(['bunx', 'shadcn@latest', 'add', item, '--yes', '--cwd', consumer], consumer);

  const pumpPath = join(consumer, 'src/elements/process-pump/pump.ts');
  const sharedPath = join(consumer, 'src/elements/shared.ts');
  const registerPath = join(consumer, 'src/elements/process-pump/register.ts');
  for (const path of [pumpPath, sharedPath, registerPath]) {
    if (!(await exists(path))) throw new Error(`shadcn did not install expected source file: ${path}`);
  }

  // This is the point of the source-registry model: edit the copied component and
  // prove the application receives the customization without a fork or override.
  const pumpSource = await readFile(pumpPath, 'utf8');
  const customized = pumpSource.replace("defaultValue: 'P-101'", "defaultValue: 'P-CUSTOM'");
  if (customized === pumpSource) throw new Error('could not locate the pump default label for ownership proof');
  await writeFile(pumpPath, customized);

  await writeFile(join(consumer, 'browser.ts'), `
import './src/elements/process-pump/register.ts';

const pump = document.createElement('pe-pump');
pump.setAttribute('running', '');
pump.setAttribute('speed', '1450');
pump.setAttribute('value', '6.2');
pump.setAttribute('quality', 'good');
document.body.append(pump);

setTimeout(() => {
  const rendered = Boolean(pump.shadowRoot?.querySelector('svg'));
  const customized = pump.shadowRoot?.textContent?.includes('P-CUSTOM') === true;
  document.body.dataset.proof = rendered && customized ? 'rendered-custom-source' : 'failed';
}, 50);
`);
  await run(['bun', 'build', 'browser.ts', '--target=browser', '--outfile=browser.js'], consumer);
  await writeFile(join(consumer, 'index.html'), '<!doctype html><html><body><script type="module" src="/browser.js"></script></body></html>');

  server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(request) {
      const url = new URL(request.url);
      const relative = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      const file = Bun.file(join(consumer, relative));
      if (!(await file.exists())) return new Response('Not found', { status: 404 });
      return new Response(file);
    },
  });

  const chrome = Bun.which('google-chrome') ?? Bun.which('google-chrome-stable') ?? Bun.which('chromium');
  if (!chrome) throw new Error('No headless Chrome/Chromium binary found on the CI runner.');
  const dom = await run([
    chrome,
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--virtual-time-budget=2000',
    '--dump-dom',
    `http://127.0.0.1:${server.port}/`,
  ], consumer);

  if (!dom.includes('data-proof="rendered-custom-source"')) {
    throw new Error(`source registry browser proof failed\n${dom}`);
  }

  console.log(`shadcn source registry proof passed for ${item}`);
  console.log('installed source -> consumer edit -> browser render: P-CUSTOM');
} finally {
  server?.stop(true);
  await rm(temporary, { recursive: true, force: true });
}
