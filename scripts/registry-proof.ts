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

async function customize(path: string, from: string, to: string): Promise<void> {
  const source = await readFile(path, 'utf8');
  const customized = source.replace(from, to);
  if (customized === source) throw new Error(`could not locate customization token in ${path}`);
  await writeFile(path, customized);
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

  const processItem = `Pom4H/elements/process-pump#${ref}`;
  const electricalItem = `Pom4H/elements/electrical-motor#${ref}`;
  await run(['bunx', 'shadcn@latest', 'add', processItem, '--yes', '--cwd', consumer], consumer);
  await run(['bunx', 'shadcn@latest', 'add', electricalItem, '--yes', '--cwd', consumer], consumer);

  const pumpPath = join(consumer, 'src/elements/process-pump/pump.ts');
  const processSharedPath = join(consumer, 'src/elements/shared.ts');
  const pumpRegisterPath = join(consumer, 'src/elements/process-pump/register.ts');
  const motorPath = join(consumer, 'src/elements/electrical-motor/motor.ts');
  const electricalSharedPath = join(consumer, 'src/elements/electrical-shared.ts');
  const motorRegisterPath = join(consumer, 'src/elements/electrical-motor/register.ts');
  for (const path of [pumpPath, processSharedPath, pumpRegisterPath, motorPath, electricalSharedPath, motorRegisterPath]) {
    if (!(await exists(path))) throw new Error(`shadcn did not install expected source file: ${path}`);
  }

  const labelBinding = "bind.text('label', (context) => stringValue(context, 'label'), ['label']),";
  await customize(pumpPath, labelBinding, "bind.text('label', () => 'P-CUSTOM', ['label']),");
  await customize(motorPath, labelBinding, "bind.text('label', () => 'M-CUSTOM', ['label']),");

  await writeFile(join(consumer, 'browser.ts'), `
import './src/elements/process-pump/register.ts';
import './src/elements/electrical-motor/register.ts';

const pump = document.createElement('pe-pump');
pump.setAttribute('label', 'P-ORIGINAL');
pump.setAttribute('running', '');
pump.setAttribute('speed', '1450');
pump.setAttribute('value', '6.2');
pump.setAttribute('quality', 'good');
document.body.append(pump);

const motor = document.createElement('ee-motor');
motor.setAttribute('label', 'M-ORIGINAL');
motor.setAttribute('running', '');
motor.setAttribute('speed', '1450');
motor.setAttribute('load', '72');
motor.setAttribute('quality', 'good');
document.body.append(motor);

setTimeout(() => {
  const pumpRendered = Boolean(pump.shadowRoot?.querySelector('svg'));
  const pumpCustomized = pump.shadowRoot?.textContent?.includes('P-CUSTOM') === true;
  const motorRendered = Boolean(motor.shadowRoot?.querySelector('svg'));
  const motorCustomized = motor.shadowRoot?.textContent?.includes('M-CUSTOM') === true;
  document.body.dataset.pumpProof = String(pumpRendered) + ':' + String(pumpCustomized);
  document.body.dataset.motorProof = String(motorRendered) + ':' + String(motorCustomized);
  document.body.dataset.proof = pumpRendered && pumpCustomized && motorRendered && motorCustomized
    ? 'rendered-two-custom-domains'
    : 'failed';
}, 80);
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
    '--virtual-time-budget=2200',
    '--dump-dom',
    `http://127.0.0.1:${server.port}/`,
  ], consumer);

  if (!dom.includes('data-proof="rendered-two-custom-domains"')) {
    throw new Error(`source registry browser proof failed\n${dom}`);
  }

  console.log(`shadcn source registry proof passed for ${processItem} and ${electricalItem}`);
  console.log('two domains -> copied source -> consumer rendering edits -> browser render: P-CUSTOM + M-CUSTOM');
} finally {
  server?.stop(true);
  await rm(temporary, { recursive: true, force: true });
}
