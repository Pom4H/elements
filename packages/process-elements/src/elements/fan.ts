import { attribute, bind, defineElementDefinition, svg } from '@pom4h/elements-core';
import { booleanValue, numberValue, stateValue, stringValue } from '../shared.js';

const views = ['pid', 'flat', 'equipment'] as const;
const details = ['auto', 'full', 'compact', 'symbol'] as const;

export const fanDefinition = defineElementDefinition({
  tagName: 'pe-fan',
  displayName: 'Fan / blower',
  description: 'A fan or blower with P&ID, flat SCADA and equipment SVG views sharing speed, flow, state and process ports.',
  viewBox: '0 0 320 220',
  template: svg`
<g class="view pid-view"><path class="line" d="M8 110 H74 M246 110 H312"/><circle class="body" data-part="body" cx="160" cy="110" r="68"/><g class="rotor" data-part="rotor" transform="translate(160 110)"><path d="M0 -45 Q36 -29 20 3 Q5 13 0 0 Q-13 -5 0 -45 Z"/><path d="M39 23 Q-4 52 -20 17 Q-21 0 -7 -2 Q2 -13 39 23 Z"/><path d="M-39 23 Q-33 -26 3 -20 Q18 -12 7 1 Q9 14 -39 23 Z"/></g><circle class="status-outline" data-part="status-outline" cx="160" cy="110" r="78"/><circle class="operation-dot" data-part="operation-marker" cx="211" cy="58" r="6"/></g>
<g class="view flat-view"><path class="line" d="M8 110 H72 M248 110 H312"/><circle class="body" data-part="body" cx="160" cy="110" r="70"/><circle class="inner" cx="160" cy="110" r="50"/><g class="rotor" data-part="rotor" transform="translate(160 110)"><path d="M0 -42 Q34 -26 18 3 Q5 14 0 0 Q-14 -5 0 -42 Z"/><path d="M36 21 Q-4 48 -18 15 Q-19 1 -7 -2 Q2 -12 36 21 Z"/><path d="M-36 21 Q-30 -23 3 -18 Q17 -10 6 1 Q8 13 -36 21 Z"/></g><circle class="status-outline" data-part="status-outline" cx="160" cy="110" r="78"/><circle class="operation-dot" data-part="operation-marker" cx="212" cy="58" r="7"/></g>
<g class="view equipment-view"><path class="line" d="M8 110 H62 M252 110 H312"/><path class="body" data-part="body" d="M74 48 H184 Q240 48 252 110 Q240 172 184 172 H74 Z"/><circle class="inner" cx="150" cy="110" r="48"/><g class="rotor" data-part="rotor" transform="translate(150 110)"><path d="M0 -40 Q32 -25 17 3 Q5 13 0 0 Q-13 -5 0 -40 Z"/><path d="M35 20 Q-4 47 -17 14 Q-18 1 -6 -2 Q2 -12 35 20 Z"/><path d="M-35 20 Q-29 -22 3 -17 Q16 -10 6 1 Q8 12 -35 20 Z"/></g><rect class="drive" x="184" y="81" width="62" height="58" rx="16"/><path class="case-line" d="M198 88 V132 M212 85 V135 M226 88 V132"/><circle class="status-outline" data-part="status-outline" cx="150" cy="110" r="78"/><circle class="operation-dot" data-part="operation-marker" cx="223" cy="76" r="7"/></g>
<g data-detail="standard"><rect class="panel" x="74" y="184" width="172" height="30" rx="5"/><text class="tag" data-part="label" x="86" y="204">F-101</text><text class="readout" data-part="readout" x="234" y="204" text-anchor="end">42 m³/s</text></g>
`,
  styles: `
:host{display:inline-block;width:320px;max-width:100%;aspect-ratio:16/11;color:var(--elements-ink,#dbe7f3);--eq-body:var(--elements-equipment-body,#31485a);--eq-body-2:var(--elements-equipment-body-alt,#3d566a);--eq-stroke:var(--elements-equipment-stroke,#9aafbd);--eq-line:var(--elements-line,#8095a4);--eq-panel:var(--elements-panel,#0d1922);--eq-muted:var(--elements-muted,#7890a1);--eq-process:var(--elements-process,#43bce8)}svg{width:100%;height:100%}.view{display:none}:host(:not([view])) .equipment-view,:host([view="equipment"]) .equipment-view,:host([view="flat"]) .flat-view,:host([view="pid"]) .pid-view{display:inline}.body,.drive{fill:var(--eq-body);stroke:var(--eq-stroke);stroke-width:2}.drive{fill:var(--eq-body-2);stroke-width:1.5}.inner{fill:color-mix(in srgb,var(--eq-body) 72%,#000);stroke:var(--eq-line);stroke-width:1.2}.rotor{fill:var(--eq-process);transform-box:fill-box;transform-origin:center;opacity:.3}.line,.case-line{fill:none;stroke:var(--eq-line);stroke-width:3;stroke-linecap:round}.case-line{stroke-width:2}.status-outline{fill:none;stroke:transparent;stroke-width:3}.operation-dot{fill:var(--eq-muted)}.panel{fill:var(--eq-panel);stroke:var(--eq-line);stroke-width:1}.tag{fill:currentColor;font:700 12px/1 ui-monospace,monospace}.readout{fill:var(--eq-process);font:750 10px/1 ui-monospace,monospace}:host([data-state~="running"]) .rotor{opacity:1}:host([data-state~="running"]) .operation-dot{fill:var(--elements-ok,#56e29a)}:host([status="warning"]) .status-outline{stroke:var(--elements-warning,#ffbe4a)}:host([status="alarm"]) .status-outline{stroke:var(--elements-alarm,#ff5c74)}:host([quality="stale"]) .readout{opacity:.62}:host([quality="bad"]) .readout{opacity:.26}:host([detail="symbol"]) [data-detail]{display:none}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'F-101', description: 'Fan tag.' }),
    running: attribute.boolean('running', { description: 'Whether the fan is running.' }),
    speed: attribute.number('speed', { defaultValue: 0, minimum: 0, step: 1, unit: 'rpm', description: 'Fan speed.' }),
    flow: attribute.number('flow', { defaultValue: 0, minimum: 0, step: .1, unit: 'm³/s', description: 'Air or gas flow.' }),
    status: attribute.enum('status', ['normal', 'warning', 'alarm'] as const, { defaultValue: 'normal', description: 'Fan severity.' }),
    quality: attribute.enum('quality', ['unknown', 'good', 'stale', 'bad'] as const, { defaultValue: 'unknown', description: 'Telemetry quality.' }),
    detail: attribute.enum('detail', details, { defaultValue: 'auto', description: 'Visual detail.' }),
    view: attribute.enum('view', views, { defaultValue: 'equipment', description: 'SVG visual family.' }),
  },
  states: { running: (context) => booleanValue(context, 'running') && numberValue(context, 'speed') > 0 },
  bindings: [bind.text('label', (context) => stringValue(context, 'label'), ['label']), bind.text('readout', (context) => `${numberValue(context, 'flow').toFixed(1)} m³/s`, ['flow'])],
  motions: [{ id: 'fan-rotor', type: 'loop', target: 'rotor', active: (context) => stateValue(context, 'running'), playbackRate: (context) => Math.max(.1, numberValue(context, 'speed') / 1450), keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], options: { duration: 1100, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze' }],
  ports: [
    { id: 'in', x: 8, y: 110, direction: 'left', kind: 'process', role: 'inlet', medium: 'air' },
    { id: 'out', x: 312, y: 110, direction: 'right', kind: 'process', role: 'outlet', medium: 'air' },
    { id: 'power', x: 220, y: 20, direction: 'top', kind: 'electrical', role: 'inlet' },
  ],
  parts: [{ name: 'body', detail: 'essential' }, { name: 'rotor', detail: 'essential' }, { name: 'operation-marker', detail: 'essential' }, { name: 'status-outline', detail: 'essential' }, { name: 'label', detail: 'standard' }, { name: 'readout', detail: 'standard' }],
});
