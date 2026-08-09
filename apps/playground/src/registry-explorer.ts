import { registerElectricalElements } from '@pom4h/electrical-elements/register';
import { registerProcessElements } from '@pom4h/process-elements/register';
import './registry-explorer.css';

type Primitive = string | number | boolean;
type ApiTab = 'attributes' | 'ports' | 'parts' | 'motions';

interface ManifestAttribute {
  readonly name: string;
  readonly property: string;
  readonly kind: 'string' | 'number' | 'boolean' | 'enum';
  readonly default: unknown;
  readonly values?: readonly string[];
  readonly minimum?: number;
  readonly maximum?: number;
  readonly step?: number;
  readonly unit?: string;
  readonly description?: string;
}

interface ManifestPort {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly direction: string;
  readonly kind?: string;
  readonly role?: string;
  readonly medium?: string;
  readonly label?: string;
}

interface ManifestEntry {
  readonly tagName: string;
  readonly name: string;
  readonly description?: string;
  readonly viewBox: string;
  readonly dynamicViewBox: boolean;
  readonly attributes: readonly ManifestAttribute[];
  readonly states: readonly string[];
  readonly parts: readonly { readonly name: string; readonly description?: string; readonly detail?: string }[];
  readonly ports: readonly ManifestPort[];
  readonly dynamicPorts: boolean;
  readonly motions: readonly { readonly id: string; readonly type: string; readonly target: unknown }[];
  readonly composition: readonly string[];
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
  readonly example?: Readonly<Record<string, Primitive>>;
}

interface RegistryItem {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly categories?: readonly string[];
  readonly meta: { readonly elements: RegistryElementsMeta };
}

interface RegistryFile {
  readonly name: string;
  readonly items: readonly RegistryItem[];
}

interface ManifestRecord {
  readonly manifest: ElementsManifest;
  readonly entry: ManifestEntry;
}

interface PortAwareElement extends HTMLElement {
  readonly ports?: readonly ManifestPort[];
}

const required = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing Registry Explorer element: ${selector}`);
  return element;
};

const text = (tag: string, content: string, className?: string): HTMLElement => {
  const element = document.createElement(tag);
  element.textContent = content;
  if (className) element.className = className;
  return element;
};

async function json<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
  return response.json() as Promise<T>;
}

function manifestPath(reference: string): string {
  const separator = reference.lastIndexOf('#');
  if (separator <= 0) throw new Error(`Invalid Elements manifest reference: ${reference}`);
  return reference.slice(0, separator);
}

registerProcessElements();
registerElectricalElements();
document.documentElement.dataset.app = 'elements-registry-explorer';

const registry = await json<RegistryFile>('./registry.json');
const manifestPaths = [...new Set(registry.items.map((item) => manifestPath(item.meta.elements.manifest)))];
const loadedManifests = await Promise.all(manifestPaths.map(async (path) => ({
  path,
  manifest: await json<ElementsManifest>(`./${path}`),
})));

const records = new Map<string, ManifestRecord>();
for (const { path, manifest } of loadedManifests) {
  for (const entry of manifest.elements) records.set(`${path}#${entry.tagName}`, { manifest, entry });
}
for (const item of registry.items) {
  const meta = item.meta.elements;
  const record = records.get(meta.manifest);
  if (!record) throw new Error(`${item.name}: missing manifest entry ${meta.manifest}`);
  if (meta.schemaVersion !== record.manifest.schemaVersion) throw new Error(`${item.name}: schema mismatch`);
  if (meta.tagName !== record.entry.tagName) throw new Error(`${item.name}: manifest tag mismatch`);
}

const list = required<HTMLElement>('#registry-list');
const search = required<HTMLInputElement>('#registry-search');
const title = required<HTMLElement>('#item-title');
const description = required<HTMLElement>('#item-description');
const category = required<HTMLElement>('#item-category');
const command = required<HTMLElement>('#install-command');
const copy = required<HTMLButtonElement>('#copy-command');
const stats = required<HTMLElement>('#registry-stats');
const previewStage = required<HTMLElement>('#preview-stage');
const previewTag = required<HTMLElement>('#preview-tag');
const previewViewBox = required<HTMLElement>('#preview-viewbox');
const apiContent = required<HTMLElement>('#api-content');
const schemaVersions = [...new Set(loadedManifests.map(({ manifest }) => manifest.schemaVersion))];
required<HTMLElement>('#schema-version').textContent = `v${schemaVersions.join('/')} · ${loadedManifests.length} packages`;

let activeTab: ApiTab = 'attributes';
let activeItem: RegistryItem | undefined;
let activeEntry: ManifestEntry | undefined;
let activeManifest: ElementsManifest | undefined;
let previewElement: HTMLElement | undefined;

function initials(value: string): string {
  return value.split(/\s+/).map((part) => part[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
}

function stat(value: number, label: string): HTMLElement {
  const chip = document.createElement('div');
  chip.className = 'stat-chip';
  chip.append(text('strong', String(value)), text('span', label));
  return chip;
}

function livePorts(): readonly ManifestPort[] {
  if (!activeEntry) return [];
  if (!activeEntry.dynamicPorts) return activeEntry.ports;
  const resolved = (previewElement as PortAwareElement | undefined)?.ports;
  return Array.isArray(resolved) ? resolved : activeEntry.ports;
}

function renderStats(): void {
  if (!activeEntry) return;
  const resolvedPorts = livePorts();
  stats.replaceChildren(
    stat(activeEntry.attributes.length, 'attributes'),
    stat(resolvedPorts.length, activeEntry.dynamicPorts ? 'live ports' : 'ports'),
    stat(activeEntry.parts.length, 'parts'),
    stat(activeEntry.motions.length, 'motions'),
    stat(activeEntry.states.length, 'states'),
  );
}

function setAttributeValue(element: HTMLElement, attribute: ManifestAttribute, value: Primitive): void {
  if (attribute.kind === 'boolean') element.toggleAttribute(attribute.name, Boolean(value));
  else element.setAttribute(attribute.name, String(value));
}

function renderList(): void {
  const query = search.value.trim().toLowerCase();
  list.replaceChildren();
  for (const item of registry.items) {
    const record = records.get(item.meta.elements.manifest);
    const haystack = `${item.name} ${item.title} ${item.description} ${item.categories?.join(' ') ?? ''} ${record?.manifest.name ?? ''}`.toLowerCase();
    if (query && !haystack.includes(query)) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'registry-item';
    button.setAttribute('aria-current', String(item === activeItem));
    const icon = text('span', initials(item.title), 'registry-item-icon');
    const labels = document.createElement('span');
    labels.append(text('strong', item.title), text('small', item.meta.elements.tagName));
    button.append(icon, labels, text('span', String(record?.entry.attributes.length ?? 0), 'registry-item-count'));
    button.addEventListener('click', () => void activate(item));
    list.append(button);
  }
}

function apiRow(name: string, primary: string, secondary: string, kind: string): HTMLElement {
  const row = document.createElement('div');
  row.className = 'api-row';
  const meta = document.createElement('div');
  meta.className = 'api-meta';
  meta.append(text('strong', primary), text('small', secondary));
  row.append(text('code', name, 'api-name'), meta, text('span', kind, 'api-kind'));
  return row;
}

function attributeControl(attribute: ManifestAttribute): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'attribute-control';
  wrapper.append(text('label', 'live value'));
  let input: HTMLInputElement | HTMLSelectElement;
  if (attribute.kind === 'enum') {
    const select = document.createElement('select');
    for (const value of attribute.values ?? []) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.append(option);
    }
    select.value = previewElement?.getAttribute(attribute.name) ?? String(attribute.default ?? '');
    input = select;
  } else {
    const field = document.createElement('input');
    if (attribute.kind === 'boolean') {
      field.type = 'checkbox';
      field.checked = previewElement?.hasAttribute(attribute.name) ?? Boolean(attribute.default);
    } else if (attribute.kind === 'number') {
      field.type = 'number';
      if (attribute.minimum !== undefined) field.min = String(attribute.minimum);
      if (attribute.maximum !== undefined) field.max = String(attribute.maximum);
      if (attribute.step !== undefined) field.step = String(attribute.step);
      field.value = previewElement?.getAttribute(attribute.name) ?? String(attribute.default ?? 0);
    } else {
      field.type = 'text';
      field.value = previewElement?.getAttribute(attribute.name) ?? String(attribute.default ?? '');
    }
    input = field;
  }
  input.setAttribute('aria-label', `${attribute.name} value`);
  input.addEventListener('input', () => {
    if (!previewElement) return;
    if (input instanceof HTMLInputElement && input.type === 'checkbox') previewElement.toggleAttribute(attribute.name, input.checked);
    else setAttributeValue(previewElement, attribute, attribute.kind === 'number' ? Number(input.value) : input.value);
    requestAnimationFrame(() => {
      renderStats();
      if (activeTab === 'ports') renderApi();
    });
  });
  wrapper.append(input);
  return wrapper;
}

function renderApi(): void {
  if (!activeEntry) return;
  apiContent.replaceChildren();
  if (activeTab === 'attributes') {
    for (const attribute of activeEntry.attributes) {
      const row = apiRow(
        attribute.name,
        attribute.description ?? attribute.property,
        attribute.kind === 'enum' ? (attribute.values ?? []).join(' · ') : `default ${String(attribute.default)}${attribute.unit ? ` ${attribute.unit}` : ''}`,
        attribute.kind,
      );
      row.append(attributeControl(attribute));
      apiContent.append(row);
    }
  } else if (activeTab === 'ports') {
    for (const port of livePorts()) {
      apiContent.append(apiRow(port.id, `${port.kind ?? 'generic'} · ${port.role ?? port.direction}`, `${Math.round(port.x)}, ${Math.round(port.y)}${port.medium ? ` · ${port.medium}` : ''}${port.label ? ` · ${port.label}` : ''}`, 'port'));
    }
  } else if (activeTab === 'parts') {
    for (const part of activeEntry.parts) apiContent.append(apiRow(part.name, part.description ?? 'Semantic SVG part', part.detail ?? 'standard', 'part'));
  } else {
    for (const motion of activeEntry.motions) apiContent.append(apiRow(motion.id, motion.type, String(motion.target), 'motion'));
  }
  if (apiContent.childElementCount === 0) apiContent.append(text('div', `No ${activeTab} declared.`, 'empty-api'));
  const note = document.createElement('div');
  note.className = 'manifest-note';
  note.append(
    'No element-specific Explorer code. Metadata comes from ',
    text('code', activeManifest ? `${activeManifest.name}@${activeManifest.version}` : 'Elements manifest'),
    activeEntry.dynamicPorts && activeTab === 'ports' ? '; this port list is resolved from the live instance.' : '.',
  );
  apiContent.append(note);
}

async function activate(item: RegistryItem): Promise<void> {
  const record = records.get(item.meta.elements.manifest);
  if (!record) return;
  activeItem = item;
  activeEntry = record.entry;
  activeManifest = record.manifest;
  renderList();
  title.textContent = item.title;
  description.textContent = item.description;
  category.textContent = (item.categories ?? ['elements']).join(' / ').toUpperCase();
  command.textContent = `bunx shadcn@latest add Pom4H/elements/${item.name}`;
  previewTag.textContent = `<${record.entry.tagName}>`;
  previewViewBox.textContent = `${record.entry.viewBox}${record.entry.dynamicViewBox ? ' · dynamic' : ''} · ${record.manifest.name.replace('@pom4h/', '')}`;

  const element = document.createElement(record.entry.tagName) as HTMLElement;
  element.dataset.registryPreview = '';
  for (const attribute of record.entry.attributes) {
    const example = item.meta.elements.example?.[attribute.name];
    if (example !== undefined) setAttributeValue(element, attribute, example);
  }
  previewStage.replaceChildren(element);
  previewElement = element;
  renderStats();
  renderApi();
  const url = new URL(location.href);
  url.searchParams.set('item', item.name);
  url.searchParams.set('tab', activeTab);
  history.replaceState(null, '', url);
  await customElements.whenDefined(record.entry.tagName);
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  renderStats();
  if (activeTab === 'ports') renderApi();
  document.documentElement.dataset.registryReady = item.name;
}

const requestedTab = new URL(location.href).searchParams.get('tab');
if (requestedTab === 'attributes' || requestedTab === 'ports' || requestedTab === 'parts' || requestedTab === 'motions') activeTab = requestedTab;
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-api-tab]')) {
  button.setAttribute('aria-pressed', String(button.dataset.apiTab === activeTab));
  button.addEventListener('click', () => {
    activeTab = button.dataset.apiTab as ApiTab;
    for (const candidate of document.querySelectorAll<HTMLButtonElement>('[data-api-tab]')) candidate.setAttribute('aria-pressed', String(candidate === button));
    renderApi();
    const url = new URL(location.href);
    url.searchParams.set('tab', activeTab);
    history.replaceState(null, '', url);
  });
}

search.addEventListener('input', renderList);
copy.addEventListener('click', async () => {
  await navigator.clipboard?.writeText(command.textContent ?? '');
  copy.textContent = 'Copied';
  setTimeout(() => { copy.textContent = 'Copy'; }, 1000);
});

const requested = new URL(location.href).searchParams.get('item');
const initial = registry.items.find((item) => item.name === requested) ?? registry.items[0];
if (!initial) throw new Error('Registry contains no items.');
await activate(initial);
required<HTMLElement>('#registry-explorer').setAttribute('aria-busy', 'false');
