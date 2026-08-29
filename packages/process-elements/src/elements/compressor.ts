import { attribute, bind, defineElementDefinition, svg } from '@pom4h/elements-core';
import { booleanValue, numberValue, stateValue, stringValue } from '../shared.js';

const views = ['pid', 'flat', 'equipment'] as const;
const details = ['auto', 'full', 'compact', 'symbol'] as const;

export const compressorDefinition = defineElementDefinition({
  tagName: 'pe-compressor',
  displayName: 'Compressor',
  description: 'A generic process-gas compressor with three interchangeable SVG visual families.',
  viewBox: '0 0 340 220',
  template: svg`
<g class="view pid-view"><path class="line" d="M8 110 H76 M264 110 H332"/><circle class="body" data-part="body" cx="170" cy="110" r="72"/><path class="compress-mark" d="M128 76 L214 110 L128 144 Z"/><path class="compress-mark secondary" d="M144 84 L214 110 L144 136 Z"/><circle class="status-outline" data-part="status-outline" cx="170" cy="110" r="82"/><circle class="operation-dot" data-part="operation-marker" cx="224" cy="55" r="6"/></g>
<g class="view flat-view"><path class="line" d="M8 110 H76 M264 110 H332"/><circle class="body" data-part="body" cx="170" cy="110" r="72"/><g transform="translate(170 110)"><g class="rotor" data-part="rotor"><path class="compress-fill" d="M-42 -36 L48 0 L-42 36 Z"/><path class="compress-cut" d="M-24 -20 L20 0 L-24 20 Z"/></g></g><circle class="status-outline" data-part="status-outline" cx="170" cy="110" r="82"/><circle class="operation-dot" data-part="operation-marker" cx="224" cy="55" r="7"/></g>
<g class="view equipment-view"><path class="line" d="M8 110 H58 M282 110 H332"/><path class="body" data-part="body" d="M58 72 Q82 48 122 48 H222 Q258 48 282 72 V148 Q258 172 222 172 H122 Q82 172 58 148 Z"/><circle class="inner" cx="138" cy="110" r="45"/><g transform="translate(138 110)"><g class="rotor" data-part="rotor"><path class="compress-fill" d="M-28 -30 L34 0 L-28 30 Z"/><path class="compress-cut" d="M-15 -15 L12 0 L-15 15 Z"/></g></g><rect class="drive" x="192" y="82" width="70" height="56" rx="16"/><path class="case-line" d="M208 91 V129 M224 87 V133 M240 91 V129"/><path class="foot" d="M96 172 H126 L132 190 H90 Z M208 172 H238 L244 190 H202 Z"/><circle class="status-outline" data-part="status-outline" cx="160" cy="110" r="88"/><circle class="operation-dot" data-part="operation-marker" cx="236" cy="66" r="7"/></g>
<g class="tag-panel" data-detail="standard"><rect class="panel" x="82" y="186" width="176" height="28" rx="5"/><text class="tag" data-part="label" x="94" y="204">C-101</text><text class="readout" data-part="readout" x="246" y="204" text-anchor="end">7.2 BAR</text></g>
`,
  styles: `
:host{display:inline-block;width:340px;max-width:100%;aspect-ratio:17/11;color:var(--elements-ink,#dbe7f3);--eq-body:var(--elements-equipment-body,#31485a);--eq-body-2:var(--elements-equipment-body-alt,#3d566a);--eq-stroke:var(--elements-equipment-stroke,#9aafbd);--eq-line:var(--elements-line,#8095a4);--eq-panel:var(--elements-panel,#0d1922);--eq-muted:var(--elements-muted,#7890a1);--eq-process:var(--elements-process,#43bce8)}svg{width:100%;height:100%}.view{display:none}:host(:not([view])) .equipment-view,:host([view="equipment"]) .equipment-view,:host([view="flat"]) .flat-view,:host([view="pid"]) .pid-view{display:inline}.body,.drive{fill:var(--eq-body);stroke:var(--eq-stroke);stroke-width:2}.drive{fill:var(--eq-body-2);stroke-width:1.5}.inner{fill:color-mix(in srgb,var(--eq-body) 72%,#000);stroke:var(--eq-line);stroke-width:1.3}.line,.case-line{fill:none;stroke:var(--eq-line);stroke-width:3;stroke-linecap:round}.case-line{stroke-width:2}.foot{fill:var(--eq-body);stroke:var(--eq-line);stroke-width:1}.compress-mark{fill:none;stroke:var(--eq-stroke);stroke-width:3}.compress-mark.secondary{opacity:.45}.compress-fill{fill:var(--eq-process)}.compress-cut{fill:var(--eq-body)}.rotor{transform-box:fill-box;transform-origin:center;opacity:.35}.status-outline{fill:none;stroke:transparent;stroke-width:3}.operation-dot{fill:var(--eq-muted)}.panel{fill:var(--eq-panel);stroke:var(--eq-line);stroke-width:1}.tag{fill:currentColor;font:700 12px/1 ui-monospace,monospace}.readout{fill:var(--eq-process);font:750 10px/1 ui-monospace,monospace}:host([view="pid"]) .tag-panel .panel{fill:transparent;stroke:none}:host([view="pid"]) .tag-panel .readout{display:none}:host([data-state~="running"]) .rotor{opacity:1}:host([data-state~="running"]) .operation-dot{fill:var(--elements-ok,#56e29a)}:host([status="warning"]) .status-outline{stroke:var(--elements-warning,#ffbe4a)}:host([status="alarm"]) .status-outline{stroke:var(--elements-alarm,#ff5c74)}:host([quality="stale"]) .readout{opacity:.62}:host([quality="bad"]) .readout{opacity:.26}:host([detail="symbol"]) [data-detail]{display:none}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'C-101', description: 'Compressor tag.' }),
    running: attribute.boolean('running', { description: 'Whether the compressor is running.' }),
    speed: attribute.number('speed', { defaultValue: 0, minimum: 0, step: 1, unit: 'rpm', description: 'Shaft speed.' }),
    pressure: attribute.number('pressure', { defaultValue: 0, minimum: 0, step: .1, unit: 'bar', description: 'Discharge pressure.' }),
    flow: attribute.number('flow', { defaultValue: 0, minimum: 0, step: .1, unit: 'm³/h', description: 'Gas flow.' }),
    status: attribute.enum('status', ['normal', 'warning', 'alarm'] as const, { defaultValue: 'normal', description: 'Compressor severity.' }),
    quality: attribute.enum('quality', ['unknown', 'good', 'stale', 'bad'] as const, { defaultValue: 'unknown', description: 'Telemetry quality.' }),
    detail: attribute.enum('detail', details, { defaultValue: 'auto', description: 'Visual detail.' }),
    view: attribute.enum('view', views, { defaultValue: 'equipment', description: 'SVG visual family.' }),
  },
  states: { running: (context) => booleanValue(context, 'running') && numberValue(context, 'speed') > 0 },
  bindings: [bind.text('label', (context) => stringValue(context, 'label'), ['label']), bind.text('readout', (context) => `${numberValue(context, 'pressure').toFixed(1)} BAR`, ['pressure'])],
  motions: [{ id: 'compressor-rotor', type: 'loop', target: 'rotor', active: (context) => stateValue(context, 'running'), playbackRate: (context) => Math.max(.1, numberValue(context, 'speed') / 3600), keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], options: { duration: 1200, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze' }],
  ports: [
    { id: 'in', x: 8, y: 110, direction: 'left', kind: 'process', role: 'inlet', medium: 'air' },
    { id: 'out', x: 332, y: 110, direction: 'right', kind: 'process', role: 'outlet', medium: 'air' },
    { id: 'power', x: 230, y: 20, direction: 'top', kind: 'electrical', role: 'inlet' },
  ],
  parts: [{ name: 'body', detail: 'essential' }, { name: 'rotor', detail: 'essential' }, { name: 'operation-marker', detail: 'essential' }, { name: 'status-outline', detail: 'essential' }, { name: 'label', detail: 'standard' }, { name: 'readout', detail: 'standard' }],
});
