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

type RuntimeElement = HTMLElement & { readonly ports?: readonly ManifestPort[] };

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

registerProcessElements();
document.documentElement.dataset.app = 'elements-registry-explorer';

const [registry, manifest] = await Promise.all([
  json<RegistryFile>('./registry.json'),
  json<ElementsManifest>('./elements.manifest.json'),
]);

const manifestByTag = new Map(manifest.elements.map((entry) => [entry.tagName, entry]));
for (const item of registry.items) {
  const meta = item.meta.elements;
  if (meta.schemaVersion !== manifest.schemaVersion) throw new Error(`${item.name}: schema mismatch`);
  if (!manifestByTag.has(meta.tagName)) throw new Error(`${item.name}: missing manifest entry ${meta.tagName}`);
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
required<HTMLElement>('#schema-version').textContent = `v${manifest.schemaVersion}`;

const initialUrl = new URL(location.href);
const requestedTab = initialUrl.searchParams.get('tab');
let activeTab: ApiTab = requestedTab === 'ports' || requestedTab === 'parts' || requestedTab === 'motions' ? requestedTab : 'attributes';
let activeItem: RegistryItem | undefined;
let activeEntry: ManifestEntry | undefined;
let previewElement: RuntimeElement | undefined;

function initials(value: string): string {
  return value.split(/\s+/).map((part) => part[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
}

function stat(value: number, label: string): HTMLElement {
  const chip = document.createElement('div');
  chip.className = 'stat-chip';
  chip.append(text('strong', String(value)), text('span', label));
  return chip;
}

function livePorts(entry: ManifestEntry): readonly ManifestPort[] {
  return previewElement?.ports ?? entry.ports;
}

function renderStats(entry: ManifestEntry): void {
  const ports = livePorts(entry);
  stats.replaceChildren(
    stat(entry.attributes.length, 'attributes'),
    stat(ports.length, entry.dynamicPorts ? 'live ports' : 'ports'),
    stat(entry.parts.length, 'parts'),
    stat(entry.motions.length, 'motions'),
    stat(entry.states.length, 'states'),
  );
}

function setAttributeValue(element: HTMLElement, attribute: ManifestAttribute, value: Primitive): void {
  if (attribute.kind === 'boolean') element.toggleAttribute(attribute.name, Boolean(value));
  else element.setAttribute(attribute.name, String(value));
}

function refreshLiveTopology(): void {
  if (!activeEntry) return;
  const entry = activeEntry;
  requestAnimationFrame(() => {
    renderStats(entry);
    if (activeTab === 'ports') renderApi();
  });
}

function renderList(): void {
  const query = search.value.trim().toLowerCase();
  list.replaceChildren();
  for (const item of registry.items) {
    const entry = manifestByTag.get(item.meta.elements.tagName);
    const haystack = `${item.name} ${item.title} ${item.description} ${item.categories?.join(' ') ?? ''}`.toLowerCase();
    if (query && !haystack.includes(query)) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'registry-item';
    button.setAttribute('aria-current', String(item === activeItem));
    const icon = text('span', initials(item.title), 'registry-item-icon');
    const labels = document.createElement('span');
    labels.append(text('strong', item.title), text('small', item.meta.elements.tagName));
    button.append(icon, labels, text('span', String(entry?.attributes.length ?? 0), 'registry-item-count'));
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
    refreshLiveTopology();
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
    for (const port of livePorts(activeEntry)) {
      apiContent.append(apiRow(port.id, `${port.kind ?? 'generic'} · ${port.role ?? port.direction}`, `${Math.round(port.x)}, ${Math.round(port.y)}${port.medium ? ` · ${port.medium}` : ''}`, 'port'));
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
    activeTab === 'ports' && activeEntry.dynamicPorts
      ? 'Dynamic ports are read from the live custom element; the manifest supplies the initial topology and declares that the set is dynamic. '
      : 'No element-specific Explorer code. This panel is rendered from ',
    text('code', activeTab === 'ports' && activeEntry.dynamicPorts ? '.ports' : 'elements.manifest.json'),
    '.',
  );
  apiContent.append(note);
}

async function activate(item: RegistryItem): Promise<void> {
  const entry = manifestByTag.get(item.meta.elements.tagName);
  if (!entry) return;
  activeItem = item;
  activeEntry = entry;
  previewElement = undefined;
  renderList();
  title.textContent = item.title;
  description.textContent = item.description;
  category.textContent = (item.categories ?? ['elements']).join(' / ').toUpperCase();
  command.textContent = `bunx shadcn@latest add Pom4H/elements/${item.name}`;
  previewTag.textContent = `<${entry.tagName}>`;
  previewViewBox.textContent = `${entry.viewBox}${entry.dynamicViewBox ? ' · dynamic' : ''}`;
  renderStats(entry);

  const element = document.createElement(entry.tagName) as RuntimeElement;
  element.dataset.registryPreview = '';
  for (const attribute of entry.attributes) {
    const example = item.meta.elements.example?.[attribute.name];
    if (example !== undefined) setAttributeValue(element, attribute, example);
  }
  previewStage.replaceChildren(element);
  previewElement = element;
  renderApi();
  const url = new URL(location.href);
  url.searchParams.set('item', item.name);
  url.searchParams.set('tab', activeTab);
  history.replaceState(null, '', url);
  await customElements.whenDefined(entry.tagName);
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  renderStats(entry);
  if (activeTab === 'ports') renderApi();
  document.documentElement.dataset.registryReady = item.name;
}

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

const requested = initialUrl.searchParams.get('item');
const initial = registry.items.find((item) => item.name === requested) ?? registry.items[0];
if (!initial) throw new Error('Registry contains no items.');
await activate(initial);
required<HTMLElement>('#registry-explorer').setAttribute('aria-busy', 'false');
