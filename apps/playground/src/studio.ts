import type { AttributeDefinition, ElementDefinition, PortDefinition } from '@pom4h/elements-core';
import { registerProcessElements } from '@pom4h/process-elements/register';
import { enableSceneDragging } from './drag.js';
import './studio.css';

registerProcessElements();
document.documentElement.dataset.app = 'elements-studio-shell';

type WorkspaceMode = 'run' | 'edit';
type CanvasTool = 'select' | 'pan' | 'connect';
type InspectorTab = 'properties' | 'signals' | 'operate';
type BottomTab = 'alarms' | 'events' | 'diagnostics';

type ElementConstructor = CustomElementConstructor & { readonly definition?: ElementDefinition };
type RuntimeElement = HTMLElement & {
  readonly ports?: readonly PortDefinition[];
  readonly context?: {
    readonly attributes?: Readonly<Record<string, unknown>>;
    readonly states?: Readonly<Record<string, boolean>>;
  };
  readonly activeMotions?: readonly unknown[];
};

interface AlarmRecord {
  readonly severity: 'warning' | 'alarm';
  readonly source: string;
  readonly message: string;
  readonly value: string;
}

interface EventRecord {
  readonly time: string;
  readonly source: string;
  readonly message: string;
}

interface LibraryPreset {
  readonly prefix: string;
  readonly width: number;
  readonly label: (index: number) => string;
  readonly attributes: Readonly<Record<string, string | boolean>>;
}

const shell = required<HTMLElement>('#studio-shell');
const scene = required<HTMLElement>('#studio-scene');
const viewport = required<HTMLElement>('#viewport');
const stage = required<HTMLElement>('#scene-stage');
const propertyEditor = required<HTMLElement>('#property-editor');
const signalInspector = required<HTMLElement>('#signal-inspector');
const operatorPanel = required<HTMLElement>('#operator-panel');
const equipmentTree = required<HTMLElement>('#equipment-tree');
const alarmList = required<HTMLElement>('#alarm-list');
const eventList = required<HTMLElement>('#event-list');
const toast = required<HTMLElement>('#toast');
const toolHint = required<HTMLElement>('#tool-hint');

const SCENE_WIDTH = 1200;
const SCENE_HEIGHT = 720;
const GRID = 12;

let mode: WorkspaceMode = 'edit';
let tool: CanvasTool = 'select';
let zoom = 1;
let selected: RuntimeElement | undefined;
let connectSource: RuntimeElement | undefined;
let stopDragging: () => void = () => undefined;
let toastTimer = 0;
let panSession: { readonly x: number; readonly y: number; readonly left: number; readonly top: number } | undefined;
const events: EventRecord[] = [];

const presets: Readonly<Record<string, LibraryPreset>> = {
  'pe-tank': {
    prefix: 't', width: 230, label: (index) => `T-${100 + index}`,
    attributes: { level: '64', temperature: '32', pressure: '1.2', capacity: '40', nozzles: '2', medium: 'water', status: 'normal', quality: 'good', detail: 'compact' },
  },
  'pe-pump': {
    prefix: 'p', width: 245, label: (index) => `P-${100 + index}`,
    attributes: { speed: '0', value: '0', unit: 'bar', status: 'normal', quality: 'good', detail: 'compact' },
  },
  'pe-control-valve': {
    prefix: 'v', width: 150, label: (index) => `FV-${100 + index}`,
    attributes: { position: '50', command: '50', medium: 'water', status: 'normal', quality: 'good', powered: true, detail: 'compact' },
  },
  'pe-controller': {
    prefix: 'plc', width: 250, label: (index) => `PLC-${String(index).padStart(2, '0')}`,
    attributes: { running: true, inputs: '16', outputs: '16', inputState: '1010101010101010', outputState: '1100110011001100', scanRate: '10', load: '35', activity: '1', status: 'normal', quality: 'good', detail: 'symbol' },
  },
  'pe-pid-pump': {
    prefix: 'pp', width: 180, label: (index) => `P-${200 + index}`,
    attributes: { running: true, speed: '1450', status: 'normal', quality: 'good', abstraction: 'operational' },
  },
  'pe-pid-valve': {
    prefix: 'pv', width: 180, label: (index) => `FV-${200 + index}`,
    attributes: { active: true, position: '50', status: 'normal', quality: 'good', abstraction: 'operational' },
  },
  'pe-pid-vessel': {
    prefix: 'pt', width: 180, label: (index) => `V-${200 + index}`,
    attributes: { active: true, level: '55', status: 'normal', quality: 'good', abstraction: 'operational' },
  },
};

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing studio element: ${selector}`);
  return element;
}

function definitionFor(element: Element): ElementDefinition | undefined {
  return (customElements.get(element.localName) as ElementConstructor | undefined)?.definition;
}

function movableFromEvent(event: Event): RuntimeElement | undefined {
  return event.composedPath()
    .filter((node): node is RuntimeElement => node instanceof HTMLElement)
    .find((node) => node.parentElement === scene && node.hasAttribute('data-movable'));
}

function equipment(): RuntimeElement[] {
  return [...scene.querySelectorAll<RuntimeElement>(':scope > [data-movable]')];
}

function connections(): HTMLElement[] {
  return [...scene.querySelectorAll<HTMLElement>(':scope > el-connection, :scope > el-pipe, :scope > el-wire, :scope > el-signal')];
}

function labelFor(element: HTMLElement): string {
  return element.getAttribute('label') ?? element.id ?? element.localName;
}

function setMode(next: WorkspaceMode): void {
  mode = next;
  shell.dataset.mode = next;
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
    button.setAttribute('aria-pressed', String(button.dataset.mode === next));
  }

  if (next === 'run') {
    setTool('select');
    setInspectorTab('operate');
    logEvent('WORKSPACE', 'Entered Run mode');
    showToast('Run mode: editing locked, live controls enabled.');
  } else {
    setInspectorTab('properties');
    logEvent('WORKSPACE', 'Entered Edit mode');
    showToast('Edit mode: placement, connections and properties enabled.');
  }
  syncDragging();
  renderOperatorPanel();
}

function setTool(next: CanvasTool): void {
  if (mode === 'run' && next !== 'select') return;
  tool = next;
  scene.dataset.tool = next;
  viewport.dataset.tool = next;
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-tool]')) {
    button.classList.toggle('is-active', button.dataset.tool === next);
  }
  if (next !== 'connect') clearConnectSource();
  toolHint.textContent = next === 'select'
    ? 'Select and drag objects. Right dock edits metadata-backed attributes.'
    : next === 'pan'
      ? 'Drag the canvas to pan. Use Ctrl + wheel to zoom.'
      : 'Select a source, then a target. Compatible ports are chosen automatically.';
  syncDragging();
}

function syncDragging(): void {
  stopDragging();
  stopDragging = mode === 'edit' && tool === 'select'
    ? enableSceneDragging(scene, { grid: GRID, scale: () => zoom })
    : () => undefined;
}

function setInspectorTab(tab: InspectorTab): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-inspector-tab]')) {
    button.classList.toggle('is-active', button.dataset.inspectorTab === tab);
  }
  for (const view of document.querySelectorAll<HTMLElement>('[data-inspector-view]')) {
    view.classList.toggle('is-active', view.dataset.inspectorView === tab);
  }
}

function setBottomTab(tab: BottomTab): void {
  const dock = required<HTMLElement>('#bottom-dock');
  dock.dataset.open = 'true';
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-bottom-tab]')) {
    button.classList.toggle('is-active', button.dataset.bottomTab === tab);
  }
  for (const view of document.querySelectorAll<HTMLElement>('[data-bottom-view]')) {
    view.classList.toggle('is-active', view.dataset.bottomView === tab);
  }
}

function selectElement(element: RuntimeElement | undefined, announce = false): void {
  if (selected === element) return;
  selected?.removeAttribute('data-selected');
  selected = element;
  selected?.setAttribute('data-selected', '');
  updateSelectionHeader();
  renderProperties();
  renderSignals();
  renderOperatorPanel();
  renderTree();
  if (announce && selected) logEvent(labelFor(selected), 'Selected in engineering canvas');
}

function updateSelectionHeader(): void {
  const title = required<HTMLElement>('#selection-title');
  const subtitle = required<HTMLElement>('#selection-subtitle');
  const type = required<HTMLElement>('#selection-type');
  const icon = required<HTMLElement>('#selection-icon');
  const status = required<HTMLElement>('#selection-status');
  const path = required<HTMLElement>('#selected-path');

  if (!selected) {
    title.textContent = 'No selection';
    subtitle.textContent = 'Select an object in the view';
    type.textContent = 'WORKSPACE';
    icon.textContent = '—';
    status.textContent = 'idle';
    status.className = 'selection-status';
    path.textContent = 'Area 01 / —';
    return;
  }

  const definition = definitionFor(selected);
  const severity = selected.getAttribute('status') ?? 'normal';
  title.textContent = labelFor(selected);
  subtitle.textContent = `<${selected.localName}> · #${selected.id}`;
  type.textContent = definition?.displayName.toUpperCase() ?? 'SCENE OBJECT';
  icon.textContent = selected.localName.includes('pump') ? 'P'
    : selected.localName.includes('valve') ? 'V'
      : selected.localName.includes('tank') || selected.localName.includes('vessel') ? 'T'
        : selected.localName.includes('controller') ? 'C' : 'J';
  status.textContent = severity;
  status.className = `selection-status is-${severity}`;
  path.textContent = `Area 01 / ${labelFor(selected)}`;
}

function renderTree(): void {
  const query = required<HTMLInputElement>('#project-search').value.trim().toLowerCase();
  equipmentTree.replaceChildren();
  for (const element of equipment()) {
    const label = labelFor(element);
    if (query && !`${label} ${element.localName} ${element.id}`.toLowerCase().includes(query)) continue;
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `tree-row${element === selected ? ' is-selected' : ''}`;
    const severity = element.getAttribute('status') ?? 'normal';
    row.innerHTML = `<span></span><span class="tree-icon">${severity === 'alarm' ? '●' : severity === 'warning' ? '◆' : '◇'}</span><strong>${label}</strong><span class="tree-count">${element.localName.replace('pe-', '')}</span>`;
    row.addEventListener('click', () => selectElement(element, true));
    equipmentTree.append(row);
  }
  required<HTMLElement>('#connection-count').textContent = String(connections().length);
  required<HTMLElement>('#scene-object-count').textContent = `${equipment().length} objects · ${connections().length} connections`;
}

function renderProperties(): void {
  propertyEditor.replaceChildren();
  if (!selected) {
    propertyEditor.append(emptyInspector('Select an object to edit its geometry and public attributes.'));
    return;
  }

  propertyEditor.append(propertySection('Layout', [
    numericControl('X', 'x', '', 0, SCENE_WIDTH),
    numericControl('Y', 'y', '', 0, SCENE_HEIGHT),
    numericControl('Width', 'width', 'px', 40, 600),
  ]));

  const definition = definitionFor(selected);
  if (!definition) {
    propertyEditor.append(emptyInspector('This scene object has no public element definition.'));
    return;
  }

  const controls = Object.values(definition.attributes).map((attribute) => controlForAttribute(attribute));
  propertyEditor.append(propertySection('Element attributes', controls));

  const identity = document.createElement('section');
  identity.className = 'property-section';
  identity.innerHTML = '<header><h3>Identity</h3></header>';
  const grid = document.createElement('div');
  grid.className = 'property-grid';
  grid.append(textControl('DOM id', 'id', selected.id));
  identity.append(grid);
  propertyEditor.prepend(identity);
}

function propertySection(title: string, controls: HTMLElement[]): HTMLElement {
  const section = document.createElement('section');
  section.className = 'property-section';
  const header = document.createElement('header');
  header.innerHTML = `<h3>${title}</h3>`;
  const grid = document.createElement('div');
  grid.className = 'property-grid';
  grid.append(...controls);
  section.append(header, grid);
  return section;
}

function emptyInspector(message: string): HTMLElement {
  const element = document.createElement('div');
  element.className = 'empty-table';
  element.textContent = message;
  return element;
}

function rowWithControl(label: string, control: HTMLElement): HTMLElement {
  const row = document.createElement('div');
  row.className = 'property-row';
  const caption = document.createElement('label');
  caption.textContent = label;
  row.append(caption, control);
  return row;
}

function textControl(label: string, attribute: string, value: string): HTMLElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.addEventListener('change', () => {
    if (!selected) return;
    if (attribute === 'id') {
      const next = input.value.trim();
      if (!next || document.getElementById(next)) {
        input.value = selected.id;
        showToast('The id must be unique and non-empty.');
        return;
      }
      const previous = selected.id;
      selected.id = next;
      rewriteConnectionReferences(previous, next);
    } else {
      selected.setAttribute(attribute, input.value);
    }
    logEvent(labelFor(selected), `${label} changed to ${input.value}`);
    refreshAfterMutation();
  });
  return rowWithControl(label, input);
}

function numericControl(label: string, attribute: string, unit: string, minimum?: number, maximum?: number): HTMLElement {
  const input = document.createElement('input');
  input.type = 'number';
  input.value = selected?.getAttribute(attribute) ?? '0';
  if (minimum !== undefined) input.min = String(minimum);
  if (maximum !== undefined) input.max = String(maximum);
  input.addEventListener('input', () => {
    if (!selected || !Number.isFinite(input.valueAsNumber)) return;
    selected.setAttribute(attribute, String(input.valueAsNumber));
    updateSelectionHeader();
  });
  input.addEventListener('change', () => {
    if (selected) logEvent(labelFor(selected), `${label} set to ${input.value}${unit}`);
  });
  if (!unit) return rowWithControl(label, input);
  const wrapper = document.createElement('div');
  wrapper.className = 'number-with-unit';
  const suffix = document.createElement('span');
  suffix.className = 'unit';
  suffix.textContent = unit;
  wrapper.append(input, suffix);
  return rowWithControl(label, wrapper);
}

function controlForAttribute(attribute: AttributeDefinition<unknown>): HTMLElement {
  const current = selected?.getAttribute(attribute.attribute);
  if (attribute.kind === 'boolean') {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = selected?.hasAttribute(attribute.attribute) ?? false;
    input.addEventListener('change', () => {
      if (!selected) return;
      selected.toggleAttribute(attribute.attribute, input.checked);
      logEvent(labelFor(selected), `${attribute.property} ${input.checked ? 'enabled' : 'disabled'}`);
      refreshAfterMutation();
    });
    return rowWithControl(humanize(attribute.property), input);
  }

  if (attribute.kind === 'enum') {
    const select = document.createElement('select');
    for (const value of attribute.values ?? []) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.append(option);
    }
    select.value = current ?? String(attribute.defaultValue ?? '');
    select.addEventListener('change', () => {
      if (!selected) return;
      selected.setAttribute(attribute.attribute, select.value);
      logEvent(labelFor(selected), `${attribute.property} changed to ${select.value}`);
      refreshAfterMutation();
    });
    return rowWithControl(humanize(attribute.property), select);
  }

  if (attribute.kind === 'number') {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = current ?? String(attribute.defaultValue ?? 0);
    if (attribute.minimum !== undefined) input.min = String(attribute.minimum);
    if (attribute.maximum !== undefined) input.max = String(attribute.maximum);
    if (attribute.step !== undefined) input.step = String(attribute.step);
    input.addEventListener('input', () => {
      if (!selected || !Number.isFinite(input.valueAsNumber)) return;
      selected.setAttribute(attribute.attribute, String(input.valueAsNumber));
      renderSignals();
    });
    input.addEventListener('change', () => {
      if (selected) logEvent(labelFor(selected), `${attribute.property} set to ${input.value}${attribute.unit ?? ''}`);
    });
    if (!attribute.unit) return rowWithControl(humanize(attribute.property), input);
    const wrapper = document.createElement('div');
    wrapper.className = 'number-with-unit';
    const suffix = document.createElement('span');
    suffix.className = 'unit';
    suffix.textContent = attribute.unit;
    wrapper.append(input, suffix);
    return rowWithControl(humanize(attribute.property), wrapper);
  }

  const input = document.createElement('input');
  input.type = 'text';
  input.value = current ?? String(attribute.defaultValue ?? '');
  input.addEventListener('change', () => {
    if (!selected) return;
    selected.setAttribute(attribute.attribute, input.value);
    logEvent(labelFor(selected), `${attribute.property} changed to ${input.value}`);
    refreshAfterMutation();
  });
  return rowWithControl(humanize(attribute.property), input);
}

function humanize(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/-/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function renderSignals(): void {
  signalInspector.replaceChildren();
  if (!selected) {
    signalInspector.append(emptyInspector('Select an object to inspect live attributes, states and ports.'));
    return;
  }

  const attributes = selected.context?.attributes ?? Object.fromEntries(
    [...selected.attributes].map((attribute) => [attribute.name, attribute.value]),
  );
  const states = selected.context?.states ?? {};
  const attributeSection = document.createElement('section');
  attributeSection.className = 'property-section';
  attributeSection.innerHTML = '<header><h3>Live values</h3></header>';
  const attributeList = document.createElement('div');
  attributeList.className = 'signal-list';
  for (const [name, value] of Object.entries(attributes)) attributeList.append(signalRow(name, formatSignal(value)));
  attributeSection.append(attributeList);

  const stateSection = document.createElement('section');
  stateSection.className = 'property-section';
  stateSection.innerHTML = '<header><h3>Derived states</h3></header>';
  const stateList = document.createElement('div');
  stateList.className = 'signal-list';
  const stateEntries = Object.entries(states);
  if (stateEntries.length === 0) stateList.append(signalRow('state', 'none'));
  for (const [name, value] of stateEntries) stateList.append(signalRow(name, value ? 'active' : 'inactive', value ? 'good' : ''));
  stateSection.append(stateList);

  const portSection = document.createElement('section');
  portSection.className = 'property-section';
  portSection.innerHTML = `<header><h3>Ports · ${selected.ports?.length ?? 0}</h3></header>`;
  const chips = document.createElement('div');
  chips.className = 'port-chips';
  for (const port of selected.ports ?? []) {
    const chip = document.createElement('span');
    chip.className = 'port-chip';
    chip.textContent = `${port.id} · ${port.kind ?? 'any'}${port.role ? ` · ${port.role}` : ''}`;
    chips.append(chip);
  }
  if (!selected.ports?.length) chips.textContent = 'No connection ports.';
  portSection.append(chips);

  signalInspector.append(attributeSection, stateSection, portSection);
}

function signalRow(name: string, value: string, state = ''): HTMLElement {
  const row = document.createElement('div');
  row.className = 'signal-row';
  const key = document.createElement('span');
  const output = document.createElement('strong');
  key.textContent = name;
  output.textContent = value;
  if (state) output.className = state;
  row.append(key, output);
  return row;
}

function formatSignal(value: unknown): string {
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value ?? '—');
}

function renderOperatorPanel(): void {
  operatorPanel.replaceChildren();
  if (!selected) {
    operatorPanel.append(emptyInspector('Select an object to expose safe operator controls.'));
    return;
  }

  const card = document.createElement('section');
  card.className = 'operator-card';
  const title = document.createElement('h3');
  title.textContent = labelFor(selected);
  const description = document.createElement('p');
  description.textContent = mode === 'run'
    ? 'Commands write the same public attributes used by the engineering model.'
    : 'Operate remains available in Edit mode so the configured object can be tested in place.';
  card.append(title, description);

  if (selected.localName.includes('pump')) {
    card.append(rangeOperator('Speed', 'speed', 0, 2900, 10, ' rpm'));
    const buttons = operatorButtons();
    buttons.append(
      operatorButton(selected.hasAttribute('running') ? 'Stop' : 'Start', selected.hasAttribute('running') ? 'danger' : 'primary', () => {
        if (!selected) return;
        const running = !selected.hasAttribute('running');
        selected.toggleAttribute('running', running);
        selected.setAttribute('speed', running ? selected.getAttribute('speed') === '0' ? '1450' : selected.getAttribute('speed') ?? '1450' : '0');
        logEvent(labelFor(selected), running ? 'Start command' : 'Stop command');
        renderOperatorPanel();
      }),
      operatorButton('Acknowledge', '', () => acknowledgeSelected()),
    );
    card.append(buttons);
  } else if (selected.localName.includes('valve')) {
    card.append(rangeOperator('Command', 'command', 0, 100, 1, '%'));
    const buttons = operatorButtons();
    buttons.append(
      operatorButton('Open', 'primary', () => commandSelected('command', '100')),
      operatorButton('Close', 'danger', () => commandSelected('command', '0')),
    );
    card.append(buttons);
  } else if (selected.localName.includes('tank') || selected.localName.includes('vessel')) {
    card.append(rangeOperator('Level simulation', 'level', 0, 100, 1, '%'));
    const buttons = operatorButtons();
    buttons.append(
      operatorButton('Fill', 'primary', () => commandSelected('level', '82')),
      operatorButton('Drain', 'danger', () => commandSelected('level', '8')),
    );
    card.append(buttons);
  } else if (selected.localName.includes('controller')) {
    card.append(rangeOperator('CPU load', 'load', 0, 100, 1, '%'));
    const buttons = operatorButtons();
    buttons.append(
      operatorButton('Network pulse', 'primary', () => {
        if (!selected) return;
        selected.setAttribute('activity', String(Number(selected.getAttribute('activity') ?? 0) + 1));
        logEvent(labelFor(selected), 'Network activity pulse');
      }),
      operatorButton('Reset fault', '', () => acknowledgeSelected()),
    );
    card.append(buttons);
  } else {
    description.textContent = 'No operator controls are declared for this object type.';
  }
  operatorPanel.append(card);
}

function rangeOperator(label: string, attribute: string, minimum: number, maximum: number, step: number, unit: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'operator-control';
  const caption = document.createElement('label');
  const output = document.createElement('output');
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(minimum);
  input.max = String(maximum);
  input.step = String(step);
  input.value = selected?.getAttribute(attribute) ?? String(minimum);
  output.value = `${input.value}${unit}`;
  caption.append(document.createTextNode(label), output);
  input.addEventListener('input', () => {
    if (!selected) return;
    selected.setAttribute(attribute, input.value);
    output.value = `${input.value}${unit}`;
  });
  input.addEventListener('change', () => {
    if (selected) logEvent(labelFor(selected), `${label} command ${input.value}${unit}`);
  });
  wrapper.append(caption, input);
  return wrapper;
}

function operatorButtons(): HTMLElement {
  const element = document.createElement('div');
  element.className = 'operator-buttons';
  return element;
}

function operatorButton(label: string, style: string, action: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.className = style;
  button.addEventListener('click', action);
  return button;
}

function commandSelected(attribute: string, value: string): void {
  if (!selected) return;
  selected.setAttribute(attribute, value);
  logEvent(labelFor(selected), `${attribute} command ${value}`);
  renderOperatorPanel();
}

function acknowledgeSelected(): void {
  if (!selected) return;
  selected.setAttribute('status', 'normal');
  selected.removeAttribute('stuck');
  logEvent(labelFor(selected), 'Alarm acknowledged');
  refreshAfterMutation();
}

function rewriteConnectionReferences(previous: string, next: string): void {
  for (const connection of connections()) {
    for (const attribute of ['from', 'to']) {
      const value = connection.getAttribute(attribute);
      if (!value) continue;
      const rewritten = value.split(/\s+/).map((token) => {
        if (token === previous) return next;
        if (token.startsWith(`${previous}:`)) return `${next}${token.slice(previous.length)}`;
        return token;
      }).join(' ');
      connection.setAttribute(attribute, rewritten);
    }
  }
}

function createElement(tagName: string): void {
  if (mode !== 'edit') {
    showToast('Switch to Edit mode to place elements.');
    return;
  }
  const preset = presets[tagName];
  if (!preset) return;
  const index = nextIndex(preset.prefix);
  const element = document.createElement(tagName) as RuntimeElement;
  element.id = `${preset.prefix}${index}`;
  element.setAttribute('data-movable', '');
  element.setAttribute('x', String(420 + ((index - 1) % 4) * 36));
  element.setAttribute('y', String(150 + ((index - 1) % 5) * 42));
  element.setAttribute('width', String(preset.width));
  element.setAttribute('label', preset.label(index));
  for (const [attribute, value] of Object.entries(preset.attributes)) {
    const htmlAttribute = attribute.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    if (value === true) element.setAttribute(htmlAttribute, '');
    else if (value !== false) element.setAttribute(htmlAttribute, value);
  }
  scene.append(element);
  syncDragging();
  selectElement(element);
  renderTree();
  logEvent(labelFor(element), `Placed ${tagName}`);
  showToast(`${labelFor(element)} added to the active view.`);
}

function nextIndex(prefix: string): number {
  let index = 1;
  while (document.getElementById(`${prefix}${index}`)) index += 1;
  return index;
}

function duplicateSelected(): void {
  if (mode !== 'edit' || !selected || selected.localName === 'el-junction') return;
  const clone = selected.cloneNode(false) as RuntimeElement;
  const preset = presets[selected.localName];
  const prefix = preset?.prefix ?? 'node';
  const index = nextIndex(prefix);
  clone.id = `${prefix}${index}`;
  clone.setAttribute('x', String(Number(selected.getAttribute('x') ?? 0) + 36));
  clone.setAttribute('y', String(Number(selected.getAttribute('y') ?? 0) + 36));
  clone.setAttribute('label', `${labelFor(selected)} COPY`);
  clone.removeAttribute('data-selected');
  scene.append(clone);
  syncDragging();
  selectElement(clone);
  renderTree();
  logEvent(labelFor(clone), 'Duplicated from selected object');
}

function deleteSelected(): void {
  if (mode !== 'edit' || !selected) return;
  const id = selected.id;
  const label = labelFor(selected);
  for (const connection of connections()) {
    const endpoints = `${connection.getAttribute('from') ?? ''} ${connection.getAttribute('to') ?? ''}`.split(/\s+/);
    if (endpoints.some((endpoint) => endpoint === id || endpoint.startsWith(`${id}:`))) connection.remove();
  }
  selected.remove();
  selectElement(equipment()[0]);
  syncDragging();
  renderTree();
  logEvent(label, 'Deleted from active view');
}

function handleConnectSelection(element: RuntimeElement): void {
  if (!connectSource) {
    connectSource = element;
    element.setAttribute('data-connect-source', '');
    selectElement(element);
    toolHint.textContent = `${labelFor(element)} selected as source. Choose a target.`;
    return;
  }
  if (element === connectSource) {
    clearConnectSource();
    toolHint.textContent = 'Connection cancelled.';
    return;
  }

  const sourcePort = choosePort(connectSource, 'outlet');
  const targetPort = choosePort(element, 'inlet');
  if (!sourcePort || !targetPort) {
    showToast('No compatible outlet/inlet pair is available.');
    clearConnectSource();
    return;
  }
  if (sourcePort.kind && targetPort.kind && sourcePort.kind !== targetPort.kind) {
    showToast(`Port domains differ: ${sourcePort.kind} → ${targetPort.kind}.`);
    clearConnectSource();
    return;
  }

  const kind = sourcePort.kind ?? targetPort.kind ?? 'process';
  const tag = kind === 'electrical' ? 'el-wire' : kind === 'signal' ? 'el-signal' : 'el-pipe';
  const connection = document.createElement(tag);
  connection.id = `link-${Date.now().toString(36)}`;
  connection.setAttribute('from', `${connectSource.id}:${sourcePort.id}`);
  connection.setAttribute('to', `${element.id}:${targetPort.id}`);
  connection.setAttribute('label', `${labelFor(connectSource)} to ${labelFor(element)}`);
  if (kind === 'process') {
    connection.setAttribute('diameter', '12');
    const medium = sourcePort.medium ?? targetPort.medium;
    if (medium) connection.setAttribute('medium', medium);
  }
  scene.append(connection);
  logEvent('CONNECTION', `${labelFor(connectSource)}:${sourcePort.id} → ${labelFor(element)}:${targetPort.id}`);
  clearConnectSource();
  setTool('select');
  renderTree();
  showToast('Connection created and routed.');
}

function choosePort(element: RuntimeElement, role: 'inlet' | 'outlet'): PortDefinition | undefined {
  const ports = element.ports ?? [];
  return ports.find((port) => port.role === role)
    ?? ports.find((port) => role === 'outlet' ? port.direction === 'right' || port.direction === 'bottom' : port.direction === 'left' || port.direction === 'top')
    ?? ports[0];
}

function clearConnectSource(): void {
  connectSource?.removeAttribute('data-connect-source');
  connectSource = undefined;
}

function applyZoom(next: number): void {
  zoom = Math.min(1.6, Math.max(0.45, Math.round(next * 20) / 20));
  scene.style.transform = `scale(${zoom})`;
  stage.style.width = `${SCENE_WIDTH * zoom}px`;
  stage.style.height = `${SCENE_HEIGHT * zoom}px`;
  required<HTMLOutputElement>('#zoom-value').value = `${Math.round(zoom * 100)}%`;
}

function fitView(): void {
  const availableWidth = Math.max(320, viewport.clientWidth - 76);
  const availableHeight = Math.max(240, viewport.clientHeight - 76);
  applyZoom(Math.min(availableWidth / SCENE_WIDTH, availableHeight / SCENE_HEIGHT, 1));
  viewport.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
}

function saveProject(): void {
  const snapshot = {
    version: 1,
    savedAt: new Date().toISOString(),
    mode,
    zoom,
    markup: scene.innerHTML,
  };
  localStorage.setItem('elements-studio-project', JSON.stringify(snapshot));
  required<HTMLElement>('#workspace-status').textContent = 'Saved';
  logEvent('PROJECT', 'Project snapshot saved locally');
  showToast('Project saved to the browser workspace.');
}

function refreshAfterMutation(): void {
  updateSelectionHeader();
  renderSignals();
  renderOperatorPanel();
  renderTree();
}

function logEvent(source: string, message: string): void {
  events.unshift({
    time: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()),
    source,
    message,
  });
  events.splice(30);
  renderEvents();
}

function renderEvents(): void {
  eventList.replaceChildren();
  for (const event of events) {
    const row = document.createElement('div');
    row.className = 'event-row';
    const time = document.createElement('time');
    const source = document.createElement('strong');
    const message = document.createElement('span');
    time.textContent = event.time;
    source.textContent = event.source;
    message.textContent = event.message;
    row.append(time, source, message);
    eventList.append(row);
  }
}

function collectAlarms(): AlarmRecord[] {
  const alarms: AlarmRecord[] = [];
  for (const element of equipment()) {
    const label = labelFor(element);
    const quality = element.getAttribute('quality');
    if (quality === 'bad') alarms.push({ severity: 'alarm', source: label, message: 'Telemetry quality is bad', value: 'bad' });
    else if (quality === 'stale') alarms.push({ severity: 'warning', source: label, message: 'Telemetry has not updated', value: 'stale' });

    if (element.localName.includes('tank') || element.localName.includes('vessel')) {
      const level = Number(element.getAttribute('level') ?? 0);
      if (level <= 5) alarms.push({ severity: 'alarm', source: label, message: 'Low-low level', value: `${level.toFixed(1)}%` });
      else if (level <= 15) alarms.push({ severity: 'warning', source: label, message: 'Low level', value: `${level.toFixed(1)}%` });
    }
    if (element.localName.includes('valve')) {
      const position = Number(element.getAttribute('position') ?? 0);
      const command = Number(element.getAttribute('command') ?? position);
      const deviation = Math.abs(command - position);
      if (element.hasAttribute('stuck')) alarms.push({ severity: 'alarm', source: label, message: 'Valve travel is stuck', value: `${deviation.toFixed(1)}% dev.` });
      else if (deviation >= 12) alarms.push({ severity: 'warning', source: label, message: 'Position deviation', value: `${deviation.toFixed(1)}%` });
    }
    const explicit = element.getAttribute('status');
    if (explicit === 'alarm' && !alarms.some((alarm) => alarm.source === label && alarm.severity === 'alarm')) {
      alarms.push({ severity: 'alarm', source: label, message: 'Equipment alarm', value: 'active' });
    } else if (explicit === 'warning' && !alarms.some((alarm) => alarm.source === label)) {
      alarms.push({ severity: 'warning', source: label, message: 'Equipment warning', value: 'active' });
    }
  }
  return alarms;
}

function renderAlarms(): void {
  const alarms = collectAlarms();
  alarmList.replaceChildren();
  if (alarms.length === 0) alarmList.append(emptyInspector('No active alarms. The process is within configured limits.'));
  for (const alarm of alarms) {
    const row = document.createElement('div');
    row.className = 'table-row';
    row.innerHTML = `<span class="severity ${alarm.severity}">${alarm.severity}</span><strong>${alarm.source}</strong><span>${alarm.message}</span><span>${alarm.value}</span><span>unack.</span>`;
    alarmList.append(row);
  }
  const count = String(alarms.length);
  const badge = required<HTMLElement>('#alarm-badge');
  badge.textContent = count;
  badge.dataset.count = count;
  required<HTMLElement>('#alarm-tab-count').textContent = count;
}

function simulateProcess(): void {
  const valves = [...scene.querySelectorAll<RuntimeElement>('pe-control-valve')];
  for (const valve of valves) {
    const position = Number(valve.getAttribute('position') ?? 0);
    const command = Number(valve.getAttribute('command') ?? position);
    if (!valve.hasAttribute('stuck') && Math.abs(command - position) > 0.2) {
      valve.setAttribute('position', String(position + Math.sign(command - position) * Math.min(1.4, Math.abs(command - position))));
    }
  }

  const tank = scene.querySelector<RuntimeElement>('#t1');
  const runningPumps = [...scene.querySelectorAll<RuntimeElement>('pe-pump[running]')].length;
  if (tank && mode === 'run') {
    const level = Number(tank.getAttribute('level') ?? 72);
    const next = Math.max(4, Math.min(88, level - runningPumps * 0.035 + (level < 18 ? 0.12 : 0)));
    tank.setAttribute('level', next.toFixed(2));
  }

  const p1 = scene.querySelector<RuntimeElement>('#p1');
  const feed = scene.querySelector<HTMLElement>('#feed-a');
  if (p1 && feed) feed.toggleAttribute('flowing', p1.hasAttribute('running'));
  const p2 = scene.querySelector<RuntimeElement>('#p2');
  const feedB = scene.querySelector<HTMLElement>('#feed-b');
  if (p2 && feedB) feedB.toggleAttribute('flowing', p2.hasAttribute('running'));

  renderAlarms();
  renderSignals();
  updateDiagnostics();
  updateSelectionHeader();
}

function updateDiagnostics(): void {
  const allEquipment = equipment();
  const motionCount = allEquipment.reduce((sum, element) => sum + (element.activeMotions?.length ?? 0), 0);
  const badQuality = allEquipment.some((element) => ['bad', 'stale'].includes(element.getAttribute('quality') ?? 'good'));
  required<HTMLElement>('#route-health').textContent = `${connections().length} / ${connections().length}`;
  required<HTMLElement>('#motion-health').textContent = motionCount > 0 ? `${motionCount} active` : 'idle';
  required<HTMLElement>('#quality-health').textContent = badQuality ? 'degraded' : 'good';
}

function showToast(message: string): void {
  toast.textContent = message;
  toast.setAttribute('data-open', '');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.removeAttribute('data-open'), 2600);
}

function bindShell(): void {
  required<HTMLButtonElement>('#mode-run').addEventListener('click', () => setMode('run'));
  required<HTMLButtonElement>('#mode-edit').addEventListener('click', () => setMode('edit'));
  required<HTMLButtonElement>('#save-project').addEventListener('click', saveProject);
  required<HTMLButtonElement>('#fullscreen').addEventListener('click', () => void document.documentElement.requestFullscreen());
  required<HTMLButtonElement>('#settings-button').addEventListener('click', () => showToast('Workspace settings will be stored per project.'));

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-left-panel]')) {
    button.addEventListener('click', () => {
      const panel = button.dataset.leftPanel;
      for (const candidate of document.querySelectorAll<HTMLElement>('[data-panel]')) candidate.classList.toggle('is-active', candidate.dataset.panel === panel);
      for (const candidate of document.querySelectorAll<HTMLElement>('[data-left-panel]')) candidate.classList.toggle('is-active', candidate === button);
    });
  }
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-tool]')) button.addEventListener('click', () => setTool(button.dataset.tool as CanvasTool));
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-inspector-tab]')) button.addEventListener('click', () => setInspectorTab(button.dataset.inspectorTab as InspectorTab));
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-bottom-tab]')) button.addEventListener('click', () => setBottomTab(button.dataset.bottomTab as BottomTab));
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-create]')) button.addEventListener('click', () => createElement(button.dataset.create ?? ''));

  required<HTMLInputElement>('#project-search').addEventListener('input', renderTree);
  required<HTMLInputElement>('#library-search').addEventListener('input', (event) => {
    const query = (event.currentTarget as HTMLInputElement).value.trim().toLowerCase();
    for (const button of document.querySelectorAll<HTMLElement>('[data-create]')) {
      button.hidden = Boolean(query && !button.textContent?.toLowerCase().includes(query));
    }
  });

  required<HTMLButtonElement>('#duplicate-selection').addEventListener('click', duplicateSelected);
  required<HTMLButtonElement>('#delete-selection').addEventListener('click', deleteSelected);
  required<HTMLButtonElement>('#zoom-in').addEventListener('click', () => applyZoom(zoom + 0.1));
  required<HTMLButtonElement>('#zoom-out').addEventListener('click', () => applyZoom(zoom - 0.1));
  required<HTMLButtonElement>('#fit-view').addEventListener('click', fitView);
  required<HTMLButtonElement>('#grid-toggle').addEventListener('click', (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    scene.classList.toggle('no-grid');
    button.classList.toggle('is-active', !scene.classList.contains('no-grid'));
  });
  required<HTMLButtonElement>('#bottom-toggle').addEventListener('click', () => {
    const dock = required<HTMLElement>('#bottom-dock');
    dock.dataset.open = String(dock.dataset.open !== 'true');
  });

  scene.addEventListener('click', (event) => {
    const element = movableFromEvent(event);
    if (!element || tool === 'pan') return;
    if (mode === 'edit' && tool === 'connect') handleConnectSelection(element);
    else selectElement(element, true);
  });

  scene.addEventListener('elements-update', (event) => {
    if (event.target === selected) {
      updateSelectionHeader();
      if (document.querySelector('[data-inspector-view="signals"]')?.classList.contains('is-active')) renderSignals();
    }
  });

  scene.addEventListener('elements-layout-change', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement) logEvent(labelFor(target), 'Position changed');
  });

  viewport.addEventListener('pointerdown', (event) => {
    if (tool !== 'pan' || event.button !== 0) return;
    panSession = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    viewport.setPointerCapture(event.pointerId);
    viewport.setAttribute('data-panning', '');
    event.preventDefault();
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!panSession) return;
    viewport.scrollLeft = panSession.left - (event.clientX - panSession.x);
    viewport.scrollTop = panSession.top - (event.clientY - panSession.y);
  });
  const endPan = (event: PointerEvent): void => {
    if (!panSession) return;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    panSession = undefined;
    viewport.removeAttribute('data-panning');
  };
  viewport.addEventListener('pointerup', endPan);
  viewport.addEventListener('pointercancel', endPan);
  viewport.addEventListener('wheel', (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    applyZoom(zoom + (event.deltaY < 0 ? 0.1 : -0.1));
  }, { passive: false });
  viewport.addEventListener('mousemove', (event) => {
    const bounds = scene.getBoundingClientRect();
    const x = Math.round((event.clientX - bounds.left) / zoom);
    const y = Math.round((event.clientY - bounds.top) / zoom);
    required<HTMLElement>('#cursor-position').textContent = `X ${Math.max(0, x)} · Y ${Math.max(0, y)}`;
  });

  window.addEventListener('keydown', (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveProject();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      duplicateSelected();
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') deleteSelected();
    else if (event.key.toLowerCase() === 'v') setTool('select');
    else if (event.key.toLowerCase() === 'h') setTool('pan');
    else if (event.key.toLowerCase() === 'c') setTool('connect');
    else if (event.key === 'F2') setMode(mode === 'run' ? 'edit' : 'run');
    else if (event.key === 'Escape') {
      clearConnectSource();
      setTool('select');
    }
  });
}

bindShell();
applyZoom(0.85);
syncDragging();
renderTree();
selectElement(scene.querySelector<RuntimeElement>('#t1') ?? undefined);
logEvent('RUNTIME', 'Elements runtime registered');
logEvent('SCENE', `${equipment().length} objects and ${connections().length} connections loaded`);
renderAlarms();
updateDiagnostics();
window.setInterval(simulateProcess, 420);
window.setTimeout(fitView, 80);
