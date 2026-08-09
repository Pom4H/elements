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

interface ManifestSource {
  readonly path: string;
  readonly module: string;
  readonly exportName: string;
}

const root = resolve(import.meta.dir, '..');
const registryPath = resolve(root, 'registry.json');
const checkOnly = Bun.argv.includes('--check');
const registry = JSON.parse(await readFile(registryPath, 'utf8')) as RegistryFile;

const manifestSources: readonly ManifestSource[] = [
  {
    path: 'registry/elements.manifest.json',
    module: '../packages/process-elements/dist/manifest.js',
    exportName: 'processElementsManifest',
  },
  {
    path: 'registry/electrical-elements.manifest.json',
    module: '../packages/electrical-elements/dist/manifest.js',
    exportName: 'electricalElementsManifest',
  },
];

const manifests = new Map<string, ElementsManifest>();
for (const source of manifestSources) {
  const loaded = await import(source.module) as Readonly<Record<string, unknown>>;
  const manifest = loaded[source.exportName] as ElementsManifest | undefined;
  if (!manifest) throw new Error(`${source.module} does not export ${source.exportName}`);
  manifests.set(source.path, manifest);
}

function parseManifestReference(reference: string): { readonly path: string; readonly tagName: string } {
  const separator = reference.lastIndexOf('#');
  if (separator <= 0 || separator === reference.length - 1) {
    throw new Error(`invalid Elements manifest reference: ${reference}`);
  }
  return { path: reference.slice(0, separator), tagName: reference.slice(separator + 1) };
}

let linkedItems = 0;
for (const item of registry.items) {
  const meta = item.meta?.elements;
  if (!meta) continue;
  linkedItems += 1;
  const reference = parseManifestReference(meta.manifest);
  if (reference.tagName !== meta.tagName) {
    throw new Error(`${item.name}: manifest fragment ${reference.tagName} does not match tagName ${meta.tagName}`);
  }
  const manifest = manifests.get(reference.path);
  if (!manifest) throw new Error(`${item.name}: unknown Elements manifest artifact ${reference.path}`);
  if (meta.schemaVersion !== manifest.schemaVersion) {
    throw new Error(`${item.name}: registry schemaVersion ${meta.schemaVersion} does not match ${manifest.name} schema ${manifest.schemaVersion}`);
  }
  const entry = manifest.elements.find((candidate) => candidate.tagName === meta.tagName);
  if (!entry) throw new Error(`${item.name}: ${meta.tagName} is not present in ${reference.path}`);
  for (const attribute of Object.keys(meta.example ?? {})) {
    if (!entry.attributes.some((definition) => definition.name === attribute)) {
      throw new Error(`${item.name}: example uses unknown public attribute ${attribute}`);
    }
  }
}

let totalEntries = 0;
for (const source of manifestSources) {
  const manifest = manifests.get(source.path);
  if (!manifest) continue;
  totalEntries += manifest.elements.length;
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  const manifestPath = resolve(root, source.path);
  if (checkOnly) {
    const current = await readFile(manifestPath, 'utf8').catch(() => '');
    if (current !== serialized) {
      console.log(`---BEGIN EXPECTED ${source.path}---`);
      console.log(serialized);
      console.log(`---END EXPECTED ${source.path}---`);
      throw new Error(`${source.path} is out of sync; run bun run registry:sync`);
    }
  } else {
    await writeFile(manifestPath, serialized);
    console.log(`wrote ${manifestPath}`);
  }
}

if (checkOnly) {
  console.log(`registry semantic contract is in sync: ${linkedItems} source items, ${manifests.size} packages, ${totalEntries} manifest entries`);
}
