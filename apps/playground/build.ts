import { rm } from 'node:fs/promises';

await rm('./dist', { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: ['./index.html'],
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
  process.exitCode = 1;
}
