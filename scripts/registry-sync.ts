import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

interface ManifestEntry {
  readonly tagName: string;
  readonly attributes: readonly { readonly name: string }[];
}

interface ElementsManifest {
  readonly schemaVersion: number;
  readonly name: string;
  readonly version: string;
  readonly elements: readonly ManifestEntry[];
}

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
const builtManifestModule = '../packages/process-elements/dist/manifest.js';
const checkOnly = Bun.argv.includes('--check');
const registry = JSON.parse(await readFile(registryPath, 'utf8')) as RegistryFile;
const module = await import(builtManifestModule) as { readonly processElementsManifest: ElementsManifest };
const processElementsManifest = module.processElementsManifest;
const entries = new Map<string, ManifestEntry>(processElementsManifest.elements.map((entry) => [entry.tagName, entry]));

for (const item of registry.items) {
  const meta = item.meta?.elements;
  if (!meta) continue;
  if (meta.schemaVersion !== processElementsManifest.schemaVersion) {
    throw new Error(`${item.name}: registry schemaVersion ${meta.schemaVersion} does not match Elements manifest schema ${processElementsManifest.schemaVersion}`);
  }
  const entry = entries.get(meta.tagName);
  if (!entry) throw new Error(`${item.name}: unknown Elements tagName ${meta.tagName}`);
  const expectedReference = `registry/elements.manifest.json#${meta.tagName}`;
  if (meta.manifest !== expectedReference) throw new Error(`${item.name}: manifest reference must be ${expectedReference}`);
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
