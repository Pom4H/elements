import { attribute, bind, defineElementDefinition, svg } from '@pom4h/elements-core';
import { numberValue, stringValue } from '../shared.js';

const views = ['pid', 'flat', 'equipment'] as const;
const details = ['auto', 'full', 'compact', 'symbol'] as const;
const variables = ['pressure', 'temperature', 'flow', 'level'] as const;
const functions = ['indicator', 'transmitter', 'controller', 'switch'] as const;

const variableLetters: Readonly<Record<(typeof variables)[number], string>> = { pressure: 'P', temperature: 'T', flow: 'F', level: 'L' };
const functionLetters: Readonly<Record<(typeof functions)[number], string>> = { indicator: 'I', transmitter: 'T', controller: 'C', switch: 'S' };

function code(context: Parameters<typeof stringValue>[0]): string {
  const variable = stringValue(context, 'variable', 'pressure') as (typeof variables)[number];
  const fn = stringValue(context, 'function', 'transmitter') as (typeof functions)[number];
  return `${variableLetters[variable] ?? 'P'}${functionLetters[fn] ?? 'T'}`;
}

export const instrumentDefinition = defineElementDefinition({
  tagName: 'pe-instrument',
  displayName: 'Process instrument',
  description: 'A generic ISA-style pressure, temperature, flow or level instrument with three SVG visual families.',
  viewBox: '0 0 240 210',
  template: svg`
<g class="view pid-view"><path class="tap" d="M8 105 H68"/><circle class="body" data-part="body" cx="120" cy="105" r="52"/><text class="code" data-part="code" x="120" y="99" text-anchor="middle">PT</text><path class="separator" d="M78 105 H162"/><text class="tag" data-part="label" x="120" y="123" text-anchor="middle">101</text><path class="signal" d="M172 105 H232"/><circle class="status-outline" data-part="status-outline" cx="120" cy="105" r="61"/></g>
<g class="view flat-view"><path class="tap" d="M8 105 H66"/><circle class="body" data-part="body" cx="120" cy="105" r="54"/><text class="code" data-part="code" x="120" y="90" text-anchor="middle">PT</text><text class="value" data-part="readout" x="120" y="116" text-anchor="middle">6.2</text><text class="unit" data-part="unit-readout" x="120" y="132" text-anchor="middle">bar</text><path class="signal" d="M174 105 H232"/><circle class="quality" data-part="quality-indicator" cx="154" cy="71" r="5"/><circle class="status-outline" data-part="status-outline" cx="120" cy="105" r="62"/></g>
<g class="view equipment-view"><path class="tap" d="M8 105 H54"/><path class="neck" d="M54 96 H78 V114 H54 Z"/><circle class="body" data-part="body" cx="126" cy="105" r="58"/><circle class="dial" cx="126" cy="105" r="44"/><path class="needle" d="M126 105 L154 82"/><circle class="hub" cx="126" cy="105" r="5"/><text class="code small" data-part="code" x="126" y="84" text-anchor="middle">PT</text><text class="value" data-part="readout" x="126" y="130" text-anchor="middle">6.2</text><path class="signal" d="M184 105 H232"/><circle class="quality" data-part="quality-indicator" cx="164" cy="68" r="5"/><circle class="status-outline" data-part="status-outline" cx="126" cy="105" r="66"/></g>
<text class="external-tag" data-part="full-label" x="120" y="194" text-anchor="middle" data-detail="standard">PT-101</text>
`,
  styles: `
:host{display:inline-block;width:240px;max-width:100%;aspect-ratio:8/7;color:var(--elements-ink,#dbe7f3);--eq-body:var(--elements-equipment-body,#31485a);--eq-body-2:var(--elements-equipment-body-alt,#3d566a);--eq-stroke:var(--elements-equipment-stroke,#9aafbd);--eq-line:var(--elements-line,#8095a4);--eq-muted:var(--elements-muted,#7890a1);--eq-process:var(--elements-process,#43bce8)}svg{width:100%;height:100%}.view{display:none}:host(:not([view])) .equipment-view,:host([view="equipment"]) .equipment-view,:host([view="flat"]) .flat-view,:host([view="pid"]) .pid-view{display:inline}.body{fill:var(--eq-body);stroke:var(--eq-stroke);stroke-width:2}.dial{fill:color-mix(in srgb,var(--eq-body) 70%,#000);stroke:var(--eq-line);stroke-width:1.4}.neck{fill:var(--eq-body-2);stroke:var(--eq-stroke);stroke-width:1.4}.tap{fill:none;stroke:var(--eq-line);stroke-width:3}.signal{fill:none;stroke:var(--eq-line);stroke-width:2;stroke-dasharray:5 5}.separator{stroke:var(--eq-line);stroke-width:1}.code{fill:currentColor;font:800 20px/1 ui-monospace,monospace}.code.small{font-size:13px}.tag{fill:currentColor;font:700 13px/1 ui-monospace,monospace}.value{fill:var(--eq-process);font:800 20px/1 ui-monospace,monospace}.unit{fill:var(--eq-muted);font:650 9px/1 ui-monospace,monospace}.needle{stroke:var(--eq-process);stroke-width:3;stroke-linecap:round}.hub{fill:var(--eq-process)}.quality{fill:var(--eq-muted)}.status-outline{fill:none;stroke:transparent;stroke-width:3}.external-tag{fill:currentColor;font:700 11px/1 ui-monospace,monospace;letter-spacing:.06em}:host([status="warning"]) .status-outline{stroke:var(--elements-warning,#ffbe4a)}:host([status="alarm"]) .status-outline{stroke:var(--elements-alarm,#ff5c74)}:host([quality="good"]) .quality{fill:var(--elements-ok,#56e29a)}:host([quality="stale"]) .quality{fill:var(--elements-warning,#ffbe4a)}:host([quality="bad"]) .quality{fill:var(--elements-alarm,#ff5c74)}:host([quality="stale"]) .value{opacity:.62}:host([quality="bad"]) .value{opacity:.26}:host([detail="symbol"]) [data-detail]{display:none}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'PT-101', description: 'Instrument tag.' }),
    variable: attribute.enum('variable', variables, { defaultValue: 'pressure', description: 'Measured process variable.' }),
    function: attribute.enum('function', functions, { defaultValue: 'transmitter', description: 'Instrument function.' }),
    value: attribute.number('value', { defaultValue: 0, step: .1, description: 'Measured value.' }),
    unit: attribute.string('unit', { defaultValue: 'bar', description: 'Engineering unit.' }),
    status: attribute.enum('status', ['normal', 'warning', 'alarm'] as const, { defaultValue: 'normal', description: 'Instrument severity.' }),
    quality: attribute.enum('quality', ['unknown', 'good', 'stale', 'bad'] as const, { defaultValue: 'unknown', description: 'Measurement quality.' }),
    detail: attribute.enum('detail', details, { defaultValue: 'auto', description: 'Visual detail.' }),
    view: attribute.enum('view', views, { defaultValue: 'equipment', description: 'SVG visual family.' }),
  },
  bindings: [
    bind.text('code', (context) => code(context), ['variable', 'function']),
    bind.text('full-label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('label', (context) => stringValue(context, 'label').replace(/^[A-Z]+-?/i, ''), ['label']),
    bind.text('readout', (context) => numberValue(context, 'value').toFixed(1), ['value']),
    bind.text('unit-readout', (context) => stringValue(context, 'unit'), ['unit']),
  ],
  ports: [
    { id: 'process', x: 8, y: 105, direction: 'left', kind: 'process', role: 'bidirectional', label: 'Process tap' },
    { id: 'signal', x: 232, y: 105, direction: 'right', kind: 'signal', role: 'outlet', label: 'Instrument signal' },
  ],
  parts: [{ name: 'body', detail: 'essential' }, { name: 'code', detail: 'essential' }, { name: 'readout', detail: 'essential' }, { name: 'quality-indicator', detail: 'standard' }, { name: 'status-outline', detail: 'essential' }, { name: 'full-label', detail: 'standard' }],
});
