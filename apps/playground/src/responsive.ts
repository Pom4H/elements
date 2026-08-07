import type { PortDefinition } from '@pom4h/elements-core';
import './responsive.css';

type MobileView = 'diagram' | 'devices';
type RuntimeElement = HTMLElement & { readonly ports?: readonly PortDefinition[] };
type PortPair = readonly [PortDefinition, PortDefinition];

const required = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing responsive Studio element: ${selector}`);
  return element;
};

const shell = required<HTMLElement>('#studio-shell');
const scene = required<HTMLElement>('#studio-scene');
const viewport = required<HTMLElement>('#viewport');
const deviceList = required<HTMLElement>('#device-list');
const dispatcherSearch = required<HTMLInputElement>('#dispatcher-search');
const dispatcherFilter = required<HTMLSelectElement>('#dispatcher-filter');
const toolHint = required<HTMLElement>('#tool-hint');
const toast = required<HTMLElement>('#toast');
const GRID = 12;
const SCENE_WIDTH = 1200;
const SCENE_HEIGHT = 720;
const MOBILE_VIEW_STORAGE_KEY = 'elements-studio:mobile-view';
const CONNECTION_TAGS = new Set(['el-connection', 'el-pipe', 'el-wire', 'el-signal']);

interface Preset {
  readonly prefix: string;
  readonly width: number;
  readonly label: (index: number) => string;
  readonly attributes: Readonly<Record<string, string | boolean>>;
}

const presets: Readonly<Record<string, Preset>> = {
  'pe-tank': { prefix: 't', width: 230, label: (i) => `T-${100 + i}`, attributes: { level: '50', temperature: '22', pressure: '1.0', capacity: '60', nozzles: '2', medium: 'water', status: 'normal', quality: 'good', detail: 'compact' } },
  'pe-pump': { prefix: 'p', width: 245, label: (i) => `P-${100 + i}`, attributes: { speed: '0', value: '0', unit: 'bar', status: 'normal', quality: 'good', detail: 'compact' } },
  'pe-control-valve': { prefix: 'v', width: 150, label: (i) => `FV-${100 + i}`, attributes: { position: '0', command: '0', medium: 'water', status: 'normal', quality: 'good', powered: true, detail: 'compact' } },
  'pe-controller': { prefix: 'plc', width: 250, label: (i) => `PLC-${String(i).padStart(2, '0')}`, attributes: { running: true, inputs: '16', outputs: '16', load: '28', status: 'normal', quality: 'good', detail: 'symbol' } },
  'pe-pid-pump': { prefix: 'pp', width: 180, label: (i) => `P-${200 + i}`, attributes: { abstraction: 'process', status: 'normal', quality: 'good' } },
  'pe-pid-valve': { prefix: 'pv', width: 150, label: (i) => `FV-${200 + i}`, attributes: { abstraction: 'process', position: '0', status: 'normal', quality: 'good' } },
  'pe-pid-vessel': { prefix: 'pt', width: 180, label: (i) => `T-${200 + i}`, attributes: { abstraction: 'process', level: '50', status: 'normal', quality: 'good' } },
};

let pendingPlacementTag: string | undefined;
let connectSource: RuntimeElement | undefined;
let renderQueued = false;
let toastTimer = 0;
let mobileView: MobileView = (() => {
  try { return localStorage.getItem(MOBILE_VIEW_STORAGE_KEY) === 'devices' ? 'devices' : 'diagram'; }
  catch { return 'diagram'; }
})();

const equipment = (): RuntimeElement[] => [...scene.children].filter(
  (element): element is RuntimeElement => element instanceof HTMLElement && element.hasAttribute('data-movable'),
);
const connections = (): HTMLElement[] => [...scene.children].filter(
  (element): element is HTMLElement => element instanceof HTMLElement && CONNECTION_TAGS.has(element.localName),
);
const labelFor = (element: Element): string => element.getAttribute('label') ?? element.id ?? element.localName;
const htmlAttribute = (name: string): string => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

function nextIndex(prefix: string): number {
  const used = equipment().map((element) => Number(element.id.startsWith(prefix) ? element.id.slice(prefix.length) : NaN)).filter(Number.isFinite);
  return Math.max(0, ...used) + 1;
}

function nextConnectionId(): string {
  let index = 1;
  while (scene.querySelector(`#${CSS.escape(`connection-${index}`)}`)) index += 1;
  return `connection-${index}`;
}

function showToast(message: string): void {
  toast.textContent = message;
  toast.setAttribute('data-open', '');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.removeAttribute('data-open'), 1500);
}

function closePanels(): void {
  shell.dataset.leftOpen = 'false';
  shell.dataset.rightOpen = 'false';
}

function clearPlacement(): void {
  pendingPlacementTag = undefined;
  scene.removeAttribute('data-placement-label');
  if (scene.dataset.tool === 'place') scene.dataset.tool = 'select';
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-create]')) button.removeAttribute('aria-pressed');
}

function clearConnect(): void {
  connectSource?.removeAttribute('data-connect-source');
  connectSource = undefined;
}

function clearTransientEditing(): void {
  clearPlacement();
  clearConnect();
}

function setMobileView(next: MobileView): void {
  mobileView = next;
  try { localStorage.setItem(MOBILE_VIEW_STORAGE_KEY, next); } catch { /* optional */ }
  shell.dataset.mobileView = next;
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-mobile-view]')) {
    button.setAttribute('aria-pressed', String(button.dataset.mobileView === next));
  }
  closePanels();
  if (next === 'devices') renderDeviceDispatcher();
  else setTimeout(() => document.querySelector<HTMLButtonElement>('#fit-view')?.click(), 40);
}

function armPlacement(button: HTMLButtonElement): void {
  if (shell.dataset.mode === 'run') return showToast('Switch to Edit mode to place equipment.');
  const tagName = button.dataset.create;
  const preset = tagName ? presets[tagName] : undefined;
  if (!tagName || !preset) return;
  clearConnect();
  pendingPlacementTag = tagName;
  scene.dataset.tool = 'place';
  scene.dataset.placementLabel = preset.label(nextIndex(preset.prefix));
  toolHint.textContent = `Click the canvas to place ${tagName.replace('pe-', '').replaceAll('-', ' ')}.`;
  for (const candidate of document.querySelectorAll<HTMLButtonElement>('[data-create]')) {
    candidate.setAttribute('aria-pressed', String(candidate === button));
  }
  closePanels();
  showToast('Placement armed. Click the intended canvas position.');
}

function placeElement(tagName: string, clientX: number, clientY: number): void {
  const preset = presets[tagName];
  if (!preset) return;
  const bounds = scene.getBoundingClientRect();
  const logicalX = (clientX - bounds.left) * (bounds.width > 0 ? SCENE_WIDTH / bounds.width : 1);
  const logicalY = (clientY - bounds.top) * (bounds.height > 0 ? SCENE_HEIGHT / bounds.height : 1);
  const index = nextIndex(preset.prefix);
  const element = document.createElement(tagName) as RuntimeElement;
  const x = Math.max(0, Math.min(SCENE_WIDTH - preset.width, Math.round((logicalX - preset.width / 2) / GRID) * GRID));
  const y = Math.max(0, Math.min(SCENE_HEIGHT - 100, Math.round((logicalY - 60) / GRID) * GRID));
  element.id = `${preset.prefix}${index}`;
  element.setAttribute('data-movable', '');
  element.setAttribute('x', String(x));
  element.setAttribute('y', String(y));
  element.setAttribute('width', String(preset.width));
  element.setAttribute('label', preset.label(index));
  for (const [name, value] of Object.entries(preset.attributes)) {
    if (value === true) element.setAttribute(htmlAttribute(name), '');
    else if (value !== false) element.setAttribute(htmlAttribute(name), value);
  }
  scene.append(element);
  clearPlacement();
  scene.dispatchEvent(new CustomEvent('elements-layout-change', { bubbles: true, composed: true, detail: { element, x, y } }));
  setTimeout(() => element.click(), 0);
  showToast(`${labelFor(element)} placed at ${x}, ${y}.`);
  queueRender();
}

function portUsed(elementId: string, portId: string): boolean {
  const reference = `${elementId}:${portId}`;
  return connections().some((connection) => `${connection.getAttribute('from') ?? ''} ${connection.getAttribute('to') ?? ''}`.split(/\s+/).includes(reference));
}

function candidates(element: RuntimeElement, role: 'inlet' | 'outlet'): readonly PortDefinition[] {
  const directionMatches = (port: PortDefinition): boolean => role === 'outlet'
    ? ['right', 'bottom', 'top'].includes(port.direction)
    : ['left', 'top', 'bottom'].includes(port.direction);
  const score = (port: PortDefinition): number =>
    (portUsed(element.id, port.id) ? 0 : 100)
    + (port.role === role ? 48 : port.role === 'bidirectional' ? 34 : 0)
    + (port.kind === 'process' ? 24 : 0)
    + (directionMatches(port) ? 8 : 0);
  return [...(element.ports ?? [])].sort((a, b) => score(b) - score(a));
}

function choosePorts(sourceElement: RuntimeElement, targetElement: RuntimeElement): PortPair | undefined {
  let best: { pair: PortPair; score: number } | undefined;
  for (const source of candidates(sourceElement, 'outlet')) {
    for (const target of candidates(targetElement, 'inlet')) {
      if (source.kind && target.kind && source.kind !== target.kind) continue;
      if (source.medium && target.medium && source.medium !== target.medium) continue;
      const score = (portUsed(sourceElement.id, source.id) ? 0 : 80)
        + (portUsed(targetElement.id, target.id) ? 0 : 80)
        + (source.role === 'outlet' ? 32 : source.role === 'bidirectional' ? 22 : 0)
        + (target.role === 'inlet' ? 32 : target.role === 'bidirectional' ? 22 : 0)
        + (source.kind === 'process' && target.kind === 'process' ? 36 : 0)
        + (source.medium !== undefined && source.medium === target.medium ? 24 : 0)
        + (source.kind === 'signal' && target.kind === 'signal' ? 20 : 0)
        + (source.kind === 'electrical' && target.kind === 'electrical' ? 20 : 0);
      if (!best || score > best.score) best = { pair: [source, target], score };
    }
  }
  return best?.pair;
}

function connect(element: RuntimeElement): void {
  if (!connectSource) {
    connectSource = element;
    element.setAttribute('data-connect-source', 'true');
    toolHint.textContent = `Source ${labelFor(element)} selected. Choose a target.`;
    return;
  }
  if (connectSource === element) return clearConnect();
  const sourceElement = connectSource;
  const pair = choosePorts(sourceElement, element);
  if (!pair) return showToast('No compatible source and target ports are available.');
  const [sourcePort, targetPort] = pair;
  const kind = sourcePort.kind === 'electrical' || targetPort.kind === 'electrical' ? 'wire'
    : sourcePort.kind === 'signal' || targetPort.kind === 'signal' ? 'signal' : 'pipe';
  const connection = document.createElement(`el-${kind}`);
  connection.id = nextConnectionId();
  connection.setAttribute('from', `${sourceElement.id}:${sourcePort.id}`);
  connection.setAttribute('to', `${element.id}:${targetPort.id}`);
  connection.setAttribute('label', `${labelFor(sourceElement)} to ${labelFor(element)}`);
  if (kind === 'pipe') {
    connection.setAttribute('diameter', '18');
    connection.setAttribute('flowing', '');
    connection.setAttribute('speed', '1');
    const medium = sourcePort.medium ?? targetPort.medium;
    if (medium) connection.setAttribute('medium', medium);
  }
  scene.append(connection);
  clearConnect();
  toolHint.textContent = 'Connection created. Select the next source and target, or press Escape.';
  showToast('Connection created. Connect remains active.');
  queueRender();
}

function semanticDetail(): void {
  const zoom = Number.parseFloat(document.querySelector<HTMLOutputElement>('#zoom-value')?.value ?? '100') / 100;
  const detail = zoom < .48 ? 'symbol' : zoom < .9 ? 'compact' : 'full';
  const abstraction = zoom < .48 ? 'symbol' : zoom < .82 ? 'process' : zoom < 1.25 ? 'operational' : 'diagnostic';
  if (scene.dataset.zoomTier !== abstraction) scene.dataset.zoomTier = abstraction;
  for (const element of equipment()) {
    if (!element.localName.startsWith('pe-')) continue;
    if (element.localName.startsWith('pe-pid-')) element.setAttribute('abstraction', abstraction);
    else element.setAttribute('detail', detail);
  }
}

function stateFor(element: RuntimeElement): string {
  if (element.localName.includes('pump') || element.localName === 'pe-controller') return element.hasAttribute('running') ? 'running' : 'stopped';
  if (element.localName.includes('valve')) return `${Math.round(Number(element.getAttribute('position') ?? 0))}% open`;
  if (element.localName.includes('tank') || element.localName.includes('vessel')) return `${Math.round(Number(element.getAttribute('level') ?? 0))}% level`;
  return 'online';
}

function metrics(element: RuntimeElement): readonly [string, string][] {
  if (element.localName.includes('pump')) return [['speed', `${element.getAttribute('speed') ?? 0} rpm`], ['pressure', `${element.getAttribute('value') ?? 0} ${element.getAttribute('unit') ?? 'bar'}`], ['quality', element.getAttribute('quality') ?? 'unknown']];
  if (element.localName.includes('valve')) return [['position', `${element.getAttribute('position') ?? 0}%`], ['command', `${element.getAttribute('command') ?? 0}%`], ['mode', element.getAttribute('mode') ?? 'auto']];
  if (element.localName.includes('tank') || element.localName.includes('vessel')) return [['level', `${element.getAttribute('level') ?? 0}%`], ['pressure', `${element.getAttribute('pressure') ?? 0} bar`], ['temp', `${element.getAttribute('temperature') ?? 0} °C`]];
  return [['load', `${element.getAttribute('load') ?? 0}%`], ['scan', `${element.getAttribute('scan-rate') ?? 0} ms`], ['quality', element.getAttribute('quality') ?? 'unknown']];
}

function text<K extends keyof HTMLElementTagNameMap>(tag: K, value: string, className = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
}

function action(element: RuntimeElement, label: string, name: string, className = ''): HTMLButtonElement {
  const button = text('button', label, className);
  button.type = 'button';
  button.dataset.deviceId = element.id;
  button.dataset.deviceAction = name;
  return button;
}

function deviceCard(element: RuntimeElement): HTMLElement {
  const card = document.createElement('article');
  const severity = element.getAttribute('status') ?? 'normal';
  const running = element.hasAttribute('running');
  card.className = 'device-card';
  card.dataset.severity = severity;
  const header = document.createElement('header');
  header.className = 'device-card-header';
  const title = document.createElement('div');
  title.className = 'device-card-title';
  title.append(text('strong', labelFor(element)), text('small', element.localName.replace(/^pe-/, '').replaceAll('-', ' ')));
  header.append(text('div', labelFor(element).split('-')[0]?.slice(0, 3) ?? 'DEV', 'device-card-icon'), title, text('span', stateFor(element), 'device-state'));
  const telemetry = document.createElement('div');
  telemetry.className = 'device-telemetry';
  for (const [name, value] of metrics(element)) {
    const item = document.createElement('span');
    item.append(text('small', name), text('strong', value));
    telemetry.append(item);
  }
  const actions = document.createElement('div');
  actions.className = 'device-actions';
  if (element.localName.includes('pump') || element.localName === 'pe-controller') actions.append(action(element, running ? 'Stop' : 'Start', 'toggle-running', running ? 'danger' : 'primary'));
  else if (element.localName.includes('valve')) actions.append(action(element, 'Close', 'close'), action(element, 'Open', 'open', 'primary'));
  else actions.append(action(element, 'Diagram', 'diagram'), action(element, 'Inspect', 'inspect', 'primary'));
  if (actions.childElementCount === 1) actions.append(action(element, 'Inspect', 'inspect'));
  card.append(header, telemetry, actions);
  return card;
}

function renderDeviceDispatcher(): void {
  const query = dispatcherSearch.value.trim().toLowerCase();
  const filter = dispatcherFilter.value;
  const devices = equipment().filter((element) => element.localName !== 'el-junction');
  deviceList.replaceChildren();
  let visible = 0;
  for (const element of devices) {
    const severity = element.getAttribute('status') ?? 'normal';
    const state = stateFor(element);
    const running = element.hasAttribute('running');
    const matches = filter === 'all' || filter === 'running' && running || filter === 'stopped' && !running || filter === 'attention' && severity !== 'normal';
    if ((query && !`${labelFor(element)} ${element.localName} ${state} ${severity}`.toLowerCase().includes(query)) || !matches) continue;
    visible += 1;
    deviceList.append(deviceCard(element));
  }
  if (!visible) deviceList.append(text('div', devices.length ? 'No devices match the filter.' : 'No devices in this view. Switch to Edit and place equipment.', 'empty-table'));
  required<HTMLElement>('#dispatcher-online').textContent = `${devices.length} online`;
  const alarms = devices.filter((element) => (element.getAttribute('status') ?? 'normal') !== 'normal').length;
  required<HTMLElement>('#dispatcher-alerts').textContent = `${alarms} alarm${alarms === 1 ? '' : 's'}`;
}

function handleDeviceAction(button: HTMLButtonElement): void {
  const id = button.dataset.deviceId;
  const element = id ? scene.querySelector<RuntimeElement>(`#${CSS.escape(id)}`) : null;
  if (!element) return;
  const name = button.dataset.deviceAction;
  if (name === 'toggle-running') {
    element.toggleAttribute('running');
    if (element.localName.includes('pump')) element.setAttribute('speed', element.hasAttribute('running') ? '1450' : '0');
  } else if (name === 'open' || name === 'close') {
    const value = name === 'open' ? '100' : '0';
    element.setAttribute('command', value);
    element.setAttribute('position', value);
  } else {
    element.click();
    if (name === 'diagram') setMobileView('diagram');
    shell.dataset.rightOpen = 'true';
  }
  renderDeviceDispatcher();
}

function newProject(): void {
  if ((equipment().length || connections().length) && !confirm('Clear the active view and start from an empty process diagram?')) return;
  for (const node of [...connections(), ...equipment()]) node.remove();
  clearTransientEditing();
  queueRender();
  showToast('Empty process view ready.');
}

function queueRender(): void {
  if (renderQueued) return;
  renderQueued = true;
  queueMicrotask(() => {
    renderQueued = false;
    renderDeviceDispatcher();
    semanticDetail();
  });
}

// Responsive augments the base Studio state; it does not own a second tool state machine.
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const create = target?.closest<HTMLButtonElement>('[data-create]');
  if (create) {
    event.preventDefault();
    event.stopImmediatePropagation();
    armPlacement(create);
    return;
  }
  const tool = target?.closest<HTMLButtonElement>('[data-tool]');
  if (tool) {
    clearPlacement();
    if (tool.dataset.tool !== 'connect') clearConnect();
  }
}, true);

scene.addEventListener('click', (event) => {
  const movable = event.composedPath().find((node): node is RuntimeElement => node instanceof HTMLElement && node.parentElement === scene && node.hasAttribute('data-movable'));
  if (pendingPlacementTag && !movable && shell.dataset.mode !== 'run') {
    event.preventDefault();
    event.stopImmediatePropagation();
    placeElement(pendingPlacementTag, event.clientX, event.clientY);
    return;
  }
  if (scene.dataset.tool === 'connect' && movable && shell.dataset.mode !== 'run') {
    event.preventDefault();
    event.stopImmediatePropagation();
    connect(movable);
  }
}, true);

required<HTMLButtonElement>('#new-project').addEventListener('click', (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  newProject();
}, true);
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-mobile-view]')) button.addEventListener('click', () => setMobileView(button.dataset.mobileView as MobileView));
required<HTMLButtonElement>('#mobile-inspector-toggle').addEventListener('click', () => {
  shell.dataset.rightOpen = String(shell.dataset.rightOpen !== 'true');
  shell.dataset.leftOpen = 'false';
});
required<HTMLButtonElement>('#mobile-scrim').addEventListener('click', closePanels);
dispatcherSearch.addEventListener('input', renderDeviceDispatcher);
dispatcherFilter.addEventListener('change', renderDeviceDispatcher);
deviceList.addEventListener('click', (event) => {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-device-action]') : null;
  if (button) handleDeviceAction(button);
});
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-left-panel]')) button.addEventListener('click', () => {
  if (innerWidth <= 900) {
    shell.dataset.leftOpen = 'true';
    shell.dataset.rightOpen = 'false';
  }
});
for (const button of document.querySelectorAll<HTMLButtonElement>('#zoom-in, #zoom-out, #fit-view')) button.addEventListener('click', () => queueMicrotask(semanticDetail));
viewport.addEventListener('wheel', () => setTimeout(semanticDetail, 0), { passive: true });
for (const button of document.querySelectorAll<HTMLButtonElement>('#mode-run, #mode-edit')) button.addEventListener('click', () => {
  // studio.ts registered first and has already updated shell.dataset.mode here.
  if (shell.dataset.mode === 'run') clearTransientEditing();
  setTimeout(() => {
    if (shell.dataset.mode === 'run' && innerWidth <= 900) setMobileView(mobileView);
    else if (shell.dataset.mode !== 'run') setMobileView('diagram');
    renderDeviceDispatcher();
  }, 0);
});
addEventListener('keydown', (event) => { if (event.key === 'Escape') clearTransientEditing(); });
addEventListener('resize', () => {
  closePanels();
  renderDeviceDispatcher();
  if (mobileView === 'diagram') setTimeout(() => document.querySelector<HTMLButtonElement>('#fit-view')?.click(), 80);
});
new MutationObserver(queueRender).observe(scene, { attributes: true, childList: true, subtree: false });
setMobileView(mobileView);
renderDeviceDispatcher();
semanticDetail();
