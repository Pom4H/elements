import { attribute, bind, defineElementDefinition, mediumIds, svg } from '@pom4h/elements-core';
import { booleanValue, numberValue, stringValue } from '../shared.js';

const views = ['pid', 'flat', 'equipment'] as const;
const details = ['auto', 'full', 'compact', 'symbol'] as const;

export const heatExchangerDefinition = defineElementDefinition({
  tagName: 'pe-heat-exchanger',
  displayName: 'Heat exchanger',
  description: 'A two-stream heat exchanger with P&ID, flat SCADA and equipment SVG views over the same four process ports.',
  viewBox: '0 0 360 240',
  template: svg`
<g class="view pid-view"><path class="line hot" d="M8 80 H112 M248 80 H352"/><path class="line cold" d="M8 160 H112 M248 160 H352"/><circle class="body" data-part="body" cx="180" cy="120" r="72"/><path class="coil" d="M132 80 L228 160 M132 160 L228 80"/><circle class="status-outline" data-part="status-outline" cx="180" cy="120" r="82"/><circle class="operation-dot" data-part="operation-marker" cx="233" cy="65" r="6"/></g>
<g class="view flat-view"><path class="line hot" d="M8 80 H98 M262 80 H352"/><path class="line cold" d="M8 160 H98 M262 160 H352"/><rect class="body" data-part="body" x="98" y="48" width="164" height="144" rx="30"/><path class="coil" d="M122 72 C150 72 150 104 180 104 C210 104 210 136 238 136 M122 168 C150 168 150 136 180 136 C210 136 210 104 238 104"/><rect class="status-outline" data-part="status-outline" x="88" y="38" width="184" height="164" rx="38"/><circle class="operation-dot" data-part="operation-marker" cx="244" cy="61" r="7"/></g>
<g class="view equipment-view"><path class="line hot" d="M8 80 H76 M284 80 H352"/><path class="line cold" d="M8 160 H76 M284 160 H352"/><path class="body" data-part="body" d="M76 62 Q92 44 116 44 H244 Q268 44 284 62 V178 Q268 196 244 196 H116 Q92 196 76 178 Z"/><path class="head" d="M92 52 V188 M268 52 V188"/><path class="coil" d="M112 78 H248 M112 96 H248 M112 114 H248 M112 132 H248 M112 150 H248 M112 168 H248"/><path class="baffle" d="M132 70 V174 M164 70 V174 M196 70 V174 M228 70 V174"/><rect class="status-outline" data-part="status-outline" x="66" y="34" width="228" height="172" rx="36"/><circle class="operation-dot" data-part="operation-marker" cx="260" cy="56" r="7"/></g>
<g data-detail="standard"><rect class="panel" x="96" y="204" width="168" height="28" rx="5"/><text class="tag" data-part="label" x="108" y="222">HX-101</text><text class="readout" data-part="readout" x="252" y="222" text-anchor="end">82 → 46 °C</text></g>
`,
  styles: `
:host{display:inline-block;width:360px;max-width:100%;aspect-ratio:3/2;color:var(--elements-ink,#dbe7f3);--eq-body:var(--elements-equipment-body,#31485a);--eq-stroke:var(--elements-equipment-stroke,#9aafbd);--eq-line:var(--elements-line,#8095a4);--eq-panel:var(--elements-panel,#0d1922);--eq-muted:var(--elements-muted,#7890a1);--eq-hot:var(--elements-hot,#ff8a4a);--eq-cold:var(--elements-process,#43bce8)}svg{width:100%;height:100%}.view{display:none}:host(:not([view])) .equipment-view,:host([view="equipment"]) .equipment-view,:host([view="flat"]) .flat-view,:host([view="pid"]) .pid-view{display:inline}.body{fill:var(--eq-body);stroke:var(--eq-stroke);stroke-width:2}.line,.coil,.head,.baffle{fill:none;stroke:var(--eq-line);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.line.hot{stroke:var(--eq-hot)}.line.cold{stroke:var(--eq-cold)}.coil{stroke-width:2}.head,.baffle{stroke-width:1.5;opacity:.7}.status-outline{fill:none;stroke:transparent;stroke-width:3}.operation-dot{fill:var(--eq-muted)}.panel{fill:var(--eq-panel);stroke:var(--eq-line);stroke-width:1}.tag{fill:currentColor;font:700 12px/1 ui-monospace,monospace}.readout{fill:var(--eq-cold);font:750 10px/1 ui-monospace,monospace}:host([data-state~="active"]) .operation-dot{fill:var(--elements-ok,#56e29a)}:host([status="warning"]) .status-outline{stroke:var(--elements-warning,#ffbe4a)}:host([status="alarm"]) .status-outline{stroke:var(--elements-alarm,#ff5c74)}:host([quality="stale"]) .readout{opacity:.62}:host([quality="bad"]) .readout{opacity:.26}:host([detail="symbol"]) [data-detail]{display:none}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'HX-101', description: 'Heat exchanger tag.' }),
    active: attribute.boolean('active', { description: 'Whether heat transfer duty is active.' }),
    hotIn: attribute.number('hotIn', { attribute: 'hot-in', defaultValue: 0, step: 1, unit: '°C', description: 'Hot-side inlet temperature.' }),
    hotOut: attribute.number('hotOut', { attribute: 'hot-out', defaultValue: 0, step: 1, unit: '°C', description: 'Hot-side outlet temperature.' }),
    coldIn: attribute.number('coldIn', { attribute: 'cold-in', defaultValue: 0, step: 1, unit: '°C', description: 'Cold-side inlet temperature.' }),
    coldOut: attribute.number('coldOut', { attribute: 'cold-out', defaultValue: 0, step: 1, unit: '°C', description: 'Cold-side outlet temperature.' }),
    hotMedium: attribute.enum('hotMedium', mediumIds, { attribute: 'hot-medium', defaultValue: 'water', description: 'Hot stream medium.' }),
    coldMedium: attribute.enum('coldMedium', mediumIds, { attribute: 'cold-medium', defaultValue: 'water', description: 'Cold stream medium.' }),
    status: attribute.enum('status', ['normal', 'warning', 'alarm'] as const, { defaultValue: 'normal', description: 'Heat exchanger severity.' }),
    quality: attribute.enum('quality', ['unknown', 'good', 'stale', 'bad'] as const, { defaultValue: 'unknown', description: 'Telemetry quality.' }),
    detail: attribute.enum('detail', details, { defaultValue: 'auto', description: 'Visual detail.' }),
    view: attribute.enum('view', views, { defaultValue: 'equipment', description: 'SVG visual family.' }),
  },
  states: { active: (context) => booleanValue(context, 'active') },
  bindings: [bind.text('label', (context) => stringValue(context, 'label'), ['label']), bind.text('readout', (context) => `${Math.round(numberValue(context, 'hotIn'))} → ${Math.round(numberValue(context, 'hotOut'))} °C`, ['hotIn', 'hotOut'])],
  ports: [
    { id: 'hot-in', x: 8, y: 80, direction: 'left', kind: 'process', role: 'inlet', label: 'Hot inlet' },
    { id: 'hot-out', x: 352, y: 80, direction: 'right', kind: 'process', role: 'outlet', label: 'Hot outlet' },
    { id: 'cold-in', x: 8, y: 160, direction: 'left', kind: 'process', role: 'inlet', label: 'Cold inlet' },
    { id: 'cold-out', x: 352, y: 160, direction: 'right', kind: 'process', role: 'outlet', label: 'Cold outlet' },
  ],
  parts: [{ name: 'body', detail: 'essential' }, { name: 'operation-marker', detail: 'essential' }, { name: 'status-outline', detail: 'essential' }, { name: 'label', detail: 'standard' }, { name: 'readout', detail: 'standard' }],
});
