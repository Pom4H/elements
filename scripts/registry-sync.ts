import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ELEMENTS_MANIFEST_SCHEMA_VERSION } from '../packages/core/src/manifest.js';
import { processElementsManifest } from '../packages/process-elements/src/manifest.js';

interface RegistryElementsMeta {
  readonly schemaVersion: number;
  readonly tagName: string;
  readonly sourceOwned: boolean;
  readonly runtimePackage: string;
  readonly manifest: string;
  readonly definition: string;
  readonly register: string;
  readonly example?: Readonly<Record<string, unknown>>;
}

interface RegistryItem {
  readonly name: string;
  readonly meta?: { readonly elements?: RegistryElementsMeta };
}

interface RegistryFile {
  readonly items: readonly RegistryItem[];
}

const root = resolve(import.meta.dir, '..');
const registryPath = resolve(root, 'registry.json');
const manifestPath = resolve(root, 'registry/elements.manifest.json');
const checkOnly = Bun.argv.includes('--check');
const registry = JSON.parse(await readFile(registryPath, 'utf8')) as RegistryFile;
const entries = new Map(processElementsManifest.elements.map((entry) => [entry.tagName, entry]));

for (const item of registry.items) {
  const meta = item.meta?.elements;
  if (!meta) continue;
  if (meta.schemaVersion !== ELEMENTS_MANIFEST_SCHEMA_VERSION) {
    throw new Error(`${item.name}: registry schemaVersion ${meta.schemaVersion} does not match Elements manifest schema ${ELEMENTS_MANIFEST_SCHEMA_VERSION}`);
  }
  const entry = entries.get(meta.tagName);
  if (!entry) throw new Error(`${item.name}: unknown Elements tagName ${meta.tagName}`);
  const expectedReference = `registry/elements.manifest.json#${meta.tagName}`;
  if (meta.manifest !== expectedReference) {
    throw new Error(`${item.name}: manifest reference must be ${expectedReference}`);
  }
  for (const attribute of Object.keys(meta.example ?? {})) {
    if (!entry.attributes.some((definition) => definition.name === attribute)) {
      throw new Error(`${item.name}: example uses unknown public attribute ${attribute}`);
    }
  }
}

const serialized = `${JSON.stringify(processElementsManifest, null, 2)}\n`;
if (checkOnly) {
  const current = await readFile(manifestPath, 'utf8').catch(() => '');
  if (current !== serialized) {
    console.log('---BEGIN EXPECTED ELEMENTS MANIFEST---');
    console.log(serialized);
    console.log('---END EXPECTED ELEMENTS MANIFEST---');
    throw new Error('registry/elements.manifest.json is out of sync; run bun run registry:sync');
  }
  console.log(`registry semantic contract is in sync: ${registry.items.length} source items, ${entries.size} manifest entries`);
} else {
  await writeFile(manifestPath, serialized);
  console.log(`wrote ${manifestPath}`);
}
