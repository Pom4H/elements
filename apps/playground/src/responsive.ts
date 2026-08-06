import type { PortDefinition } from '@pom4h/elements-core';
import './responsive.css';

type MobileView = 'diagram' | 'devices';
type RuntimeElement = HTMLElement & { readonly ports?: readonly PortDefinition[] };

const required = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing responsive Studio element: ${selector}`);
  return element;
};

const shell = required<HTMLElement>('#studio-shell');
const scene = required<HTMLElement>('#studio-scene');
const stage = required<HTMLElement>('#scene-stage');
const viewport = required<HTMLElement>('#viewport');
const deviceList = required<HTMLElement>('#device-list');
const dispatcherSearch = required<HTMLInputElement>('#dispatcher-search');
const dispatcherFilter = required<HTMLSelectElement>('#dispatcher-filter');
const toolHint = required<HTMLElement>('#tool-hint');
const toast = required<HTMLElement>('#toast');

const GRID = 12;
const SCENE_WIDTH = 1200;
const SCENE_HEIGHT = 720;

interface Preset {
  readonly prefix: string;
  readonly width: number;
  readonly label: (index: number) => string;
  readonly attributes: Readonly<Record<string, string | boolean>>;
}

const presets: Readonly<Record<string, Preset>> = {
  'pe-tank': { prefix: 't', width: 230, label: (index) => `T-${100 + index}`, attributes: { level: '50', temperature: '22', pressure: '1.0', capacity: '60', nozzles: '2', medium: 'water', status: 'normal', quality: 'good', detail: 'compact' } },
  'pe-pump': { prefix: 'p', width: 245, label: (index) => `P-${100 + index}`, attributes: { speed: '0', value: '0', unit: 'bar', status: 'normal', quality: 'good', detail: 'compact' } },
  'pe-control-valve': { prefix: 'v', width: 150, label: (index) => `FV-${100 + index}`, attributes: { position: '0', command: '0', medium: 'water', status: 'normal', quality: 'good', powered: true, detail: 'compact' } },
  'pe-controller': { prefix: 'plc', width: 250, label: (index) => `PLC-${String(index).padStart(2, '0')}`, attributes: { running: true, inputs: '16', outputs: '16', load: '28', status: 'normal', quality: 'good', detail: 'symbol' } },
  'pe-pid-pump': { prefix: 'pp', width: 180, label: (index) => `P-${200 + index}`, attributes: { abstraction: 'process', status: 'normal', quality: 'good' } },
  'pe-pid-valve': { prefix: 'pv', width: 150, label: (index) => `FV-${200 + index}`, attributes: { abstraction: 'process', position: '0', status: 'normal', quality: 'good' } },
  'pe-pid-vessel': { prefix: 'pt', width: 180, label: (index) => `T-${200 + index}`, attributes: { abstraction: 'process', level: '50', status: 'normal', quality: 'good' } },
};

let pendingPlacementTag: string | undefined;
let connectSource: RuntimeElement | undefined;
let stickyConnect = false;
let mobileView: MobileView = 'diagram';
let renderQueued = false;
let toastTimer = 0;

function equipment(): RuntimeElement[] {
  return [...scene.children].filter((element): element is RuntimeElement => element instanceof HTMLElement && element.hasAttribute('data-movable'));
}

function connections(): HTMLElement[] {
  return [...scene.children].filter((element): element is HTMLElement => element instanceof HTMLElement && element.localName.startsWith('el-'));
}

function labelFor(element: Element): string {
  return element.getAttribute('label') ?? element.id ?? element.localName;
}

function nextIndex(prefix: string): number {
  const values = equipment().map((element) => Number(element.id.startsWith(prefix) ? element.id.slice(prefix.length) : NaN)).filter(Number.isFinite);
  return Math.max(0, ...values) + 1;
}

function htmlAttribute(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function showToast(message: string): void {
  toast.textContent = message;
  toast.setAttribute('data-open', '');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.removeAttribute('data-open'), 2400);
}

function setMobileView(next: MobileView): void {
  mobileView = next;
  shell.dataset.mobileView = next;
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-mobile-view]')) {
    button.setAttribute('aria-pressed', String(button.dataset.mobileView === next));
  }
  closePanels();
  if (next === 'devices') renderDeviceDispatcher();
  else window.setTimeout(() => document.querySelector<HTMLButtonElement>('#fit-view')?.click(), 40);
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

function armPlacement(button: HTMLButtonElement): void {
  if (shell.dataset.mode === 'run') {
    showToast('Switch to Edit mode to place equipment.');
    return;
  }
  const tagName = button.dataset.create;
  const preset = tagName ? presets[tagName] : undefined;
  if (!tagName || !preset) return;
  pendingPlacementTag = tagName;
  scene.dataset.tool = 'place';
  scene.dataset.placementLabel = preset.label(nextIndex(preset.prefix));
  toolHint.textContent = `Click the canvas to place ${tagName.replace('pe-', '').replaceAll('-', ' ')}.`;
  for (const candidate of document.querySelectorAll<HTMLButtonElement>('[data-create]')) candidate.setAttribute('aria-pressed', String(candidate === button));
  closePanels();
  showToast('Placement armed. Click the intended canvas position.');
}

function placeElement(tagName: string, clientX: number, clientY: number): RuntimeElement | undefined {
  const preset = presets[tagName];
  if (!preset) return undefined;
  const bounds = scene.getBoundingClientRect();
  const scaleX = bounds.width > 0 ? SCENE_WIDTH / bounds.width : 1;
  const scaleY = bounds.height > 0 ? SCENE_HEIGHT / bounds.height : 1;
  const logicalX = (clientX - bounds.left) * scaleX;
  const logicalY = (clientY - bounds.top) * scaleY;
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
  window.setTimeout(() => element.click(), 0);
  showToast(`${labelFor(element)} placed at ${x}, ${y}.`);
  queueRender();
  return element;
}

function choosePort(element: RuntimeElement, role: 'inlet' | 'outlet'): PortDefinition | undefined {
  const ports = element.ports ?? [];
  const candidates = [
    ...ports.filter((port) => port.role === role),
    ...ports.filter((port) => role === 'outlet' ? port.direction === 'right' || port.direction === 'bottom' : port.direction === 'left' || port.direction === 'top'),
    ...ports,
  ].filter((port, index, all) => all.findIndex((candidate) => candidate.id === port.id) === index);
  return candidates.find((port) => !portIsUsed(element.id, port.id)) ?? candidates[0];
}

function portIsUsed(elementId: string, portId: string): boolean {
  const reference = `${elementId}:${portId}`;
  return connections().some((connection) => `${connection.getAttribute('from') ?? ''} ${connection.getAttribute('to') ?? ''}`.split(/\s+/).includes(reference));
}

function compatible(source: PortDefinition, target: PortDefinition): boolean {
  if (source.kind && target.kind && source.kind !== target.kind) return false;
  if (source.medium && target.medium && source.medium !== target.medium) return false;
  return true;
}

function connect(element: RuntimeElement): void {
  if (!connectSource) {
    connectSource = element;
    element.dataset.connectSource = 'true';
    toolHint.textContent = `Source ${labelFor(element)} selected. Choose a target.`;
    return;
  }
  if (connectSource === element) {
    delete connectSource.dataset.connectSource;
    connectSource = undefined;
    return;
  }
  const sourcePort = choosePort(connectSource, 'outlet');
  const targetPort = choosePort(element, 'inlet');
  if (!sourcePort || !targetPort || !compatible(sourcePort, targetPort)) {
    showToast('No compatible unused source and target ports.');
    return;
  }
  const kind = sourcePort.kind === 'electrical' || targetPort.kind === 'electrical' ? 'wire' : sourcePort.kind === 'signal' || targetPort.kind === 'signal' ? 'signal' : 'pipe';
  const connection = document.createElement(`el-${kind}`);
  connection.id = `connection-${connections().length + 1}`;
  connection.setAttribute('from', `${connectSource.id}:${sourcePort.id}`);
  connection.setAttribute('to', `${element.id}:${targetPort.id}`);
  connection.setAttribute('label', `${labelFor(connectSource)} to ${labelFor(element)}`);
  if (kind === 'pipe') {
    connection.setAttribute('diameter', '18');
    connection.setAttribute('flowing', '');
    connection.setAttribute('speed', '1');
  }
  scene.append(connection);
  delete connectSource.dataset.connectSource;
  connectSource = undefined;
  toolHint.textContent = 'Connection created. Select the next source and target, or press Escape.';
  showToast('Connection created. Connect remains active.');
  queueRender();
}

function stopConnect(): void {
  stickyConnect = false;
  if (connectSource) delete connectSource.dataset.connectSource;
  connectSource = undefined;
}

function semanticDetail(): void {
  const output = document.querySelector<HTMLOutputElement>('#zoom-value');
  const zoom = Number.parseFloat(output?.value ?? '100') / 100;
  const detail = zoom < .48 ? 'symbol' : zoom < .9 ? 'compact' : 'full';
  const abstraction = zoom < .48 ? 'symbol' : zoom < .82 ? 'process' : zoom < 1.25 ? 'operational' : 'diagnostic';
  scene.dataset.zoomTier = abstraction;
  for (const element of equipment()) {
    if (element.localName.startsWith('pe-pid-')) element.setAttribute('abstraction', abstraction);
    else element.setAttribute('detail', detail);
  }
}

function deviceState(element: RuntimeElement): string {
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

function actionButton(element: RuntimeElement, label: string, action: string, className = ''): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.dataset.deviceId = element.id;
  button.dataset.deviceAction = action;
  button.className = className;
  return button;
}

function renderDeviceDispatcher(): void {
  const query = dispatcherSearch.value.trim().toLowerCase();
  const filter = dispatcherFilter.value;
  const devices = equipment().filter((element) => element.localName !== 'el-junction');
  deviceList.replaceChildren();
  let visible = 0;
  for (const element of devices) {
    const severity = element.getAttribute('status') ?? 'normal';
    const state = deviceState(element);
    const haystack = `${labelFor(element)} ${element.localName} ${state} ${severity}`.toLowerCase();
    const running = element.hasAttribute('running');
    const matches = filter === 'all' || filter === 'running' && running || filter === 'stopped' && !running || filter === 'attention' && severity !== 'normal';
    if ((query && !haystack.includes(query)) || !matches) continue;
    visible += 1;
    const card = document.createElement('article');
    card.className = 'device-card';
    card.dataset.severity = severity;
    const icon = labelFor(element).split('-')[0]?.slice(0, 3) ?? 'DEV';
    card.innerHTML = `<header class="device-card-header"><div class="device-card-icon">${icon}</div><div class="device-card-title"><strong>${labelFor(element)}</strong><small>${element.localName.replace(/^pe-/, '').replaceAll('-', ' ')}</small></div><span class="device-state">${state}</span></header><div class="device-telemetry">${metrics(element).map(([name, value]) => `<span><small>${name}</small><strong>${value}</strong></span>`).join('')}</div><div class="device-actions"></div>`;
    const actions = card.querySelector<HTMLElement>('.device-actions')!;
    if (element.localName.includes('pump') || element.localName === 'pe-controller') actions.append(actionButton(element, running ? 'Stop' : 'Start', 'toggle-running', running ? 'danger' : 'primary'));
    else if (element.localName.includes('valve')) actions.append(actionButton(element, 'Close', 'close'), actionButton(element, 'Open', 'open', 'primary'));
    else actions.append(actionButton(element, 'Diagram', 'diagram'), actionButton(element, 'Inspect', 'inspect', 'primary'));
    if (actions.childElementCount === 1) actions.append(actionButton(element, 'Inspect', 'inspect'));
    deviceList.append(card);
  }
  if (visible === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-table';
    empty.textContent = devices.length === 0 ? 'No devices in this view. Switch to Edit and place equipment.' : 'No devices match the filter.';
    deviceList.append(empty);
  }
  required<HTMLElement>('#dispatcher-online').textContent = `${devices.length} online`;
  const alarms = devices.filter((element) => (element.getAttribute('status') ?? 'normal') !== 'normal').length;
  required<HTMLElement>('#dispatcher-alerts').textContent = `${alarms} alarm${alarms === 1 ? '' : 's'}`;
}

function handleDeviceAction(button: HTMLButtonElement): void {
  const id = button.dataset.deviceId;
  const element = id ? scene.querySelector<RuntimeElement>(`#${CSS.escape(id)}`) : null;
  if (!element) return;
  const action = button.dataset.deviceAction;
  if (action === 'toggle-running') {
    element.toggleAttribute('running');
    if (element.localName.includes('pump')) element.setAttribute('speed', element.hasAttribute('running') ? '1450' : '0');
  } else if (action === 'open' || action === 'close') {
    const value = action === 'open' ? '100' : '0';
    element.setAttribute('command', value);
    element.setAttribute('position', value);
  } else {
    element.click();
    if (action === 'diagram') setMobileView('diagram');
    shell.dataset.rightOpen = 'true';
  }
  renderDeviceDispatcher();
}

function newProject(): void {
  if ((equipment().length || connections().length) && !window.confirm('Clear the active view and start from an empty process diagram?')) return;
  for (const node of [...connections(), ...equipment()]) node.remove();
  clearPlacement();
  stopConnect();
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

// Capture library clicks before the legacy create-in-the-centre handler.
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const create = target?.closest<HTMLButtonElement>('[data-create]');
  if (create) {
    event.preventDefault();
    event.stopImmediatePropagation();
    armPlacement(create);
    return;
  }

  const toolButton = target?.closest<HTMLButtonElement>('[data-tool]');
  if (toolButton) {
    if (toolButton.dataset.tool === 'connect') stickyConnect = true;
    else stopConnect();
  }
}, true);

scene.addEventListener('click', (event) => {
  const path = event.composedPath();
  const movable = path.find((node): node is RuntimeElement => node instanceof HTMLElement && node.parentElement === scene && node.hasAttribute('data-movable'));
  if (pendingPlacementTag && !movable && shell.dataset.mode !== 'run') {
    event.preventDefault();
    event.stopImmediatePropagation();
    placeElement(pendingPlacementTag, event.clientX, event.clientY);
    return;
  }
  if (stickyConnect && movable && shell.dataset.mode !== 'run') {
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
  if (window.innerWidth <= 900) {
    shell.dataset.leftOpen = 'true';
    shell.dataset.rightOpen = 'false';
  }
});

for (const button of document.querySelectorAll<HTMLButtonElement>('#zoom-in, #zoom-out, #fit-view')) button.addEventListener('click', () => queueMicrotask(semanticDetail));
viewport.addEventListener('wheel', () => window.setTimeout(semanticDetail, 0), { passive: true });

for (const button of document.querySelectorAll<HTMLButtonElement>('#mode-run, #mode-edit')) button.addEventListener('click', () => {
  window.setTimeout(() => {
    if (shell.dataset.mode === 'run' && window.innerWidth <= 900) setMobileView('devices');
    else if (shell.dataset.mode !== 'run') setMobileView('diagram');
    renderDeviceDispatcher();
  }, 0);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    clearPlacement();
    stopConnect();
  }
});

window.addEventListener('resize', () => {
  closePanels();
  if (shell.dataset.mode === 'run' && window.innerWidth <= 620) setMobileView('devices');
  renderDeviceDispatcher();
});

new MutationObserver(queueRender).observe(scene, { attributes: true, childList: true, subtree: false });
renderDeviceDispatcher();
semanticDetail();
