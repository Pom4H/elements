import { rm } from 'node:fs/promises';

const generatedPaths = [
  'packages/core/dist',
  'packages/process-elements/dist',
  'apps/playground/dist',
  'packages/core/tsconfig.tsbuildinfo',
  'packages/process-elements/tsconfig.tsbuildinfo',
  'apps/playground/tsconfig.tsbuildinfo',
  'tsconfig.tools.tsbuildinfo',
] as const;

await Promise.all(generatedPaths.map((path) => rm(path, { recursive: true, force: true })));
