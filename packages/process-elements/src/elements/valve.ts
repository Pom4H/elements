import { attribute, bind, defineElementDefinition, mediumIds, svg } from '@pom4h/elements-core';
import { booleanValue, clamp, numberValue, stringValue } from '../shared.js';

const views = ['pid', 'flat', 'equipment'] as const;
const details = ['auto', 'full', 'compact', 'symbol'] as const;

function position(context: Parameters<typeof numberValue>[0]): number {
  return clamp(numberValue(context, 'position'), 0, 100);
}

export const valveDefinition = defineElementDefinition({
  tagName: 'pe-valve',
  displayName: 'Isolation valve',
  description: 'A manual or actuated isolation valve with P&ID, flat SCADA and equipment views over one open/closed contract.',
  viewBox: '0 0 260 190',
  template: svg`
<g class="view pid-view">
  <path class="line" d="M8 95 H66 M194 95 H252"/>
  <path class="body" data-part="body" d="M66 62 L130 95 L66 128 Z M194 62 L130 95 L194 128 Z"/>
  <path class="stem" d="M130 95 V46"/>
  <path class="handle" d="M102 46 H158"/>
  <rect class="status-outline" data-part="status-outline" x="58" y="54" width="144" height="82" rx="8"/>
  <circle class="operation-dot" data-part="operation-marker" cx="184" cy="61" r="6"/>
</g>
<g class="view flat-view">
  <path class="line" d="M8 95 H64 M196 95 H252"/>
  <path class="body" data-part="body" d="M64 60 L130 95 L64 130 Z M196 60 L130 95 L196 130 Z"/>
  <path class="stem" d="M130 95 V48"/>
  <g class="handle" data-part="handle" transform="translate(130 42)"><circle r="25"/><path d="M-25 0 H25 M0 -25 V25"/></g>
  <g data-part="travel"><path class="travel" d="M94 148 H166"/><circle class="travel-dot" cx="94" cy="148" r="6"/></g>
  <rect class="status-outline" data-part="status-outline" x="54" y="50" width="152" height="94" rx="10"/>
  <circle class="operation-dot" data-part="operation-marker" cx="188" cy="58" r="7"/>
</g>
<g class="view equipment-view">
  <path class="line" d="M8 95 H55 M205 95 H252"/>
  <rect class="fitting" x="55" y="72" width="18" height="46" rx="2"/>
  <rect class="fitting" x="187" y="72" width="18" height="46" rx="2"/>
  <path class="body" data-part="body" d="M72 74 Q95 58 130 58 Q165 58 188 74 V116 Q165 132 130 132 Q95 132 72 116 Z"/>
  <path class="stem" d="M130 72 V36"/>
  <g class="handle" data-part="handle" transform="translate(130 30)"><circle r="27"/><path d="M-27 0 H27 M0 -27 V27 M-19 -19 L19 19 M-19 19 L19 -19"/></g>
  <g data-part="travel"><path class="travel" d="M94 151 H166"/><circle class="travel-dot" cx="94" cy="151" r="6"/></g>
  <rect class="status-outline" data-part="status-outline" x="48" y="0" width="164" height="158" rx="12"/>
  <circle class="operation-dot" data-part="operation-marker" cx="190" cy="58" r="7"/>
</g>
<g class="tag-panel" transform="translate(54 162)" data-detail="standard"><rect class="panel" width="152" height="24" rx="4"/><text class="tag" data-part="label" x="10" y="16">HV-101</text><text class="readout" data-part="readout" x="142" y="16" text-anchor="end">OPEN</text></g>
`,
  styles: `
:host{display:inline-block;width:260px;max-width:100%;aspect-ratio:26/19;color:var(--elements-ink,#dbe7f3);container-type:inline-size;--eq-body:var(--elements-equipment-body,#31485a);--eq-body-2:var(--elements-equipment-body-alt,#3d566a);--eq-stroke:var(--elements-equipment-stroke,#9aafbd);--eq-line:var(--elements-line,#8095a4);--eq-panel:var(--elements-panel,#0d1922);--eq-muted:var(--elements-muted,#7890a1);--eq-process:var(--elements-process,#43bce8)}svg{width:100%;height:100%;overflow:visible}.view{display:none}:host(:not([view])) .equipment-view,:host([view="equipment"]) .equipment-view,:host([view="flat"]) .flat-view,:host([view="pid"]) .pid-view{display:inline}.body{fill:var(--eq-body);stroke:var(--eq-stroke);stroke-width:2}.fitting{fill:var(--eq-body-2);stroke:var(--eq-stroke);stroke-width:1.5}.line,.stem{fill:none;stroke:var(--eq-line);stroke-width:3;stroke-linecap:round}.handle{fill:none;stroke:var(--eq-stroke);stroke-width:2;transform-box:fill-box;transform-origin:center}.travel{stroke:var(--eq-line);stroke-width:2}.travel-dot{fill:var(--eq-process)}.status-outline{fill:none;stroke:transparent;stroke-width:3}.operation-dot{fill:var(--eq-muted)}.panel{fill:var(--eq-panel);stroke:var(--eq-line);stroke-width:1}.tag{fill:currentColor;font:700 11px/1 ui-monospace,monospace}.readout{fill:var(--eq-process);font:750 9px/1 ui-monospace,monospace}:host([view="pid"]) .tag-panel .panel{fill:transparent;stroke:none}:host([view="pid"]) .tag-panel .readout{display:none}:host([data-state~="open"]) .operation-dot{fill:var(--elements-ok,#56e29a)}:host([status="warning"]) .status-outline{stroke:var(--elements-warning,#ffbe4a)}:host([status="alarm"]) .status-outline{stroke:var(--elements-alarm,#ff5c74)}:host([quality="stale"]) .readout{opacity:.62}:host([quality="bad"]) .readout{opacity:.26}:host([detail="symbol"]) [data-detail]{display:none}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'HV-101', description: 'Valve tag.' }),
    open: attribute.boolean('open', { description: 'Whether the valve is open.' }),
    position: attribute.number('position', { defaultValue: 0, minimum: 0, maximum: 100, step: 1, unit: '%', description: 'Measured opening.' }),
    medium: attribute.enum('medium', mediumIds, { defaultValue: 'water', description: 'Process substance.' }),
    status: attribute.enum('status', ['normal', 'warning', 'alarm'] as const, { defaultValue: 'normal', description: 'Valve severity.' }),
    quality: attribute.enum('quality', ['unknown', 'good', 'stale', 'bad'] as const, { defaultValue: 'unknown', description: 'Telemetry quality.' }),
    detail: attribute.enum('detail', details, { defaultValue: 'auto', description: 'Visual detail.' }),
    view: attribute.enum('view', views, { defaultValue: 'equipment', description: 'SVG visual family.' }),
  },
  states: {
    open: (context) => booleanValue(context, 'open') || position(context) > 1,
    closed: (context) => !booleanValue(context, 'open') && position(context) <= 1,
  },
  bindings: [
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('readout', (context) => (booleanValue(context, 'open') || position(context) > 1 ? `${Math.round(Math.max(position(context), 100 * Number(booleanValue(context, 'open'))))}%` : 'CLOSED'), ['open', 'position']),
  ],
  motions: [
    { id: 'valve-travel', type: 'scrub', target: 'travel', progress: (context) => (booleanValue(context, 'open') ? 1 : position(context) / 100), keyframes: [{ transform: 'translateX(0px)' }, { transform: 'translateX(72px)' }], options: { duration: 1000, fill: 'both' }, reducedMotion: 'preserve' },
  ],
  ports: [
    { id: 'in', x: 8, y: 95, direction: 'left', kind: 'process', role: 'inlet', label: 'Inlet' },
    { id: 'out', x: 252, y: 95, direction: 'right', kind: 'process', role: 'outlet', label: 'Outlet' },
  ],
  parts: [
    { name: 'body', description: 'Valve silhouette.', detail: 'essential' },
    { name: 'handle', description: 'Manual handle.', detail: 'standard' },
    { name: 'travel', description: 'Position scrub target.', detail: 'standard' },
    { name: 'operation-marker', description: 'Open-state marker.', detail: 'essential' },
    { name: 'status-outline', description: 'Severity outline.', detail: 'essential' },
    { name: 'label', detail: 'standard' },
    { name: 'readout', detail: 'standard' },
  ],
});
