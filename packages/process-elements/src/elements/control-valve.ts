import {
  attribute,
  bind,
  defineElementDefinition,
  mediumIds,
  ports,
  svg,
  type ElementContext,
  type PortDefinition,
} from '@pom4h/elements-core';
import { booleanValue, clamp, numberValue, stateValue, stringValue } from '../shared.js';

const views = ['pid', 'flat', 'equipment'] as const;
const details = ['auto', 'full', 'compact', 'symbol'] as const;
const geometry = Object.freeze({ lineY: 190, inX: 42, outX: 158, stroke: 30, signalX: 18, signalY: 123, auxX: 174, supplyY: 78, powerY: 62 });

function position(context: ElementContext): number { return clamp(numberValue(context, 'position'), 0, 100); }
function command(context: ElementContext): number { return clamp(numberValue(context, 'command'), 0, 100); }
function deviation(context: ElementContext): number { return command(context) - position(context); }
function failOpen(context: ElementContext): boolean { return stringValue(context, 'action') === 'normally-open'; }
function electric(context: ElementContext): boolean { return stringValue(context, 'actuator') === 'electric'; }

function valvePorts(context: ElementContext): readonly PortDefinition[] {
  const medium = stringValue(context, 'medium', 'water');
  return [
    { id: 'in', x: geometry.inX, y: geometry.lineY, direction: 'left', kind: 'process', role: 'inlet', medium, label: 'Inlet' },
    { id: 'out', x: geometry.outX, y: geometry.lineY, direction: 'right', kind: 'process', role: 'outlet', medium, label: 'Outlet' },
    { id: 'signal', x: geometry.signalX, y: geometry.signalY, direction: 'left', kind: 'signal', role: 'inlet', label: 'Command' },
    electric(context)
      ? { id: 'power', x: geometry.auxX, y: geometry.powerY, direction: 'right', kind: 'electrical', role: 'inlet', label: 'Actuator power' }
      : { id: 'supply', x: geometry.auxX, y: geometry.supplyY, direction: 'right', kind: 'process', role: 'inlet', medium: 'air', label: 'Instrument air' },
  ];
}

const defaultPorts = valvePorts({ host: undefined as unknown as HTMLElement, attributes: { actuator: 'pneumatic', medium: 'water' }, states: {} });

export const controlValveDefinition = defineElementDefinition({
  tagName: 'pe-control-valve',
  displayName: 'Control valve',
  description: 'A control valve with P&ID, flat SCADA and equipment SVG views sharing travel, actuator, state and live-port contracts.',
  viewBox: '0 0 200 250',
  detailBreakpoints: { symbol: 132, compact: 200 },
  template: svg`
<!-- P&ID -->
<g class="view pid-view">
  <path class="line" d="M42 190 H58 M142 190 H158"/>
  <path class="body" data-part="body" d="M58 166 L100 190 L58 214 Z M142 166 L100 190 L142 214 Z"/>
  <path class="stem" d="M100 190 V142"/>
  <path class="actuator pneumatic-only" d="M66 142 A34 25 0 0 1 134 142 Z"/>
  <rect class="actuator electric-only" x="70" y="112" width="60" height="30" rx="3"/>
  <text class="view-mark electric-only" x="100" y="133" text-anchor="middle">M</text>
  <path class="status-outline" data-part="status-outline" d="M50 158 H150 V220 H50 Z"/>
</g>

<!-- Flat SCADA -->
<g class="view flat-view">
  <path class="line" d="M42 190 H56 M144 190 H158"/>
  <path class="body" data-part="body" d="M56 168 L100 190 L56 212 Z M144 168 L100 190 L144 212 Z"/>
  <path class="stem-guide" d="M100 167 V104"/>
  <g data-part="stem-travel"><path class="stem" d="M100 166 V120"/><circle class="travel-pointer" data-part="travel-pointer" cx="100" cy="120" r="5"/></g>
  <g data-part="command-marker"><path class="command-mark" d="M117 151 L126 146 V156 Z"/></g>
  <path class="actuator pneumatic-only" d="M58 100 A42 31 0 0 1 142 100 Z"/>
  <rect class="actuator electric-only" x="62" y="66" width="76" height="36" rx="5"/>
  <g class="handwheel electric-only" data-part="handwheel" transform="translate(48 84)"><circle r="15"/><path d="M-15 0 H15 M0 -15 V15"/></g>
  <circle class="positioner" cx="38" cy="126" r="14"/><circle class="positioner-led" data-part="positioner-led" cx="38" cy="126" r="4"/>
  <rect class="travel-scale" data-part="travel-scale" x="122" y="112" width="8" height="44" rx="4"/>
  <path class="status-outline" data-part="status-outline" d="M48 60 H152 V220 H48 Z"/>
</g>

<!-- Equipment -->
<g class="view equipment-view">
  <rect class="fitting" x="42" y="172" width="16" height="36"/>
  <rect class="fitting" x="142" y="172" width="16" height="36"/>
  <path class="body" data-part="body" d="M56 178 Q56 162 100 162 Q144 162 144 178 V202 Q144 218 100 218 Q56 218 56 202 Z"/>
  <path class="fitting" d="M84 146 H116 L112 164 H88 Z"/>
  <path class="yoke" d="M88 146 L78 98 H89 L96 146 M112 146 L122 98 H111 L104 146"/>
  <rect class="fitting" x="75" y="90" width="50" height="9" rx="2"/>
  <g data-part="stem-travel"><rect class="stem" x="97" y="96" width="6" height="52"/><rect class="travel-pointer" data-part="travel-pointer" x="104" y="133" width="22" height="5" rx="1"/></g>
  <g data-part="command-marker"><path class="command-mark" d="M132 136 L141 131 V141 Z"/></g>
  <path class="actuator pneumatic-only" d="M44 86 Q44 48 100 48 Q156 48 156 86 Z"/>
  <rect class="fitting pneumatic-only" x="40" y="84" width="120" height="12" rx="3"/>
  <rect class="actuator electric-only" x="62" y="48" width="86" height="40" rx="5"/>
  <rect class="fitting electric-only" x="58" y="84" width="104" height="12" rx="3"/>
  <g class="handwheel electric-only" data-part="handwheel" transform="translate(46 68)"><circle r="16"/><path d="M-16 0 H16 M0 -16 V16 M-11 -11 L11 11 M-11 11 L11 -11"/></g>
  <rect class="positioner" x="20" y="108" width="36" height="30" rx="3"/><circle class="positioner-led" data-part="positioner-led" cx="28" cy="130" r="4"/><text class="position-readout" x="38" y="121" text-anchor="middle" data-part="positioner-readout">68</text>
  <rect class="travel-scale" data-part="travel-scale" x="128" y="100" width="8" height="42" rx="3"/>
  <path class="status-outline" data-part="status-outline" d="M36 40 H166 V224 H36 Z"/>
</g>

<g class="tag-panel" data-part="tag" transform="translate(20 224)" data-detail="standard">
  <rect class="panel" width="160" height="22" rx="4"/>
  <rect class="operation-strip" data-part="status-strip" width="4" height="22" rx="2"/>
  <text class="tag" x="12" y="15" data-part="label">FV-101</text>
  <text class="meta" x="70" y="14" data-part="meta" data-detail="fine">FC · AIR</text>
  <text class="readout" x="150" y="15" text-anchor="end" data-part="readout">68 / 75</text>
</g>
`,
  styles: `
:host{display:inline-block;width:200px;max-width:100%;aspect-ratio:4/5;color:var(--elements-ink,#dbe7f3);container-type:inline-size;contain:layout style;--eq-body:var(--elements-equipment-body,#31485a);--eq-body-2:var(--elements-equipment-body-alt,#3d566a);--eq-stroke:var(--elements-equipment-stroke,#9aafbd);--eq-line:var(--elements-line,#8095a4);--eq-panel:var(--elements-panel,#0d1922);--eq-muted:var(--elements-muted,#7890a1);--eq-process:var(--elements-process,#43bce8)}svg{width:100%;height:100%;overflow:visible}.view{display:none}:host(:not([view])) .equipment-view,:host([view="equipment"]) .equipment-view,:host([view="flat"]) .flat-view,:host([view="pid"]) .pid-view{display:inline}.electric-only{display:none}:host([actuator="electric"]) .electric-only{display:inline}:host([actuator="electric"]) .pneumatic-only{display:none}
.body{fill:var(--eq-body);stroke:var(--eq-stroke);stroke-width:2}.fitting,.actuator,.positioner{fill:var(--eq-body-2);stroke:var(--eq-stroke);stroke-width:1.6}.line,.stem-guide,.yoke{fill:none;stroke:var(--eq-line);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}.stem{fill:var(--eq-stroke);stroke:none}.travel-pointer{fill:var(--eq-process)}.command-mark{fill:var(--elements-warning,#ffbe4a)}.travel-scale{fill:var(--eq-panel);stroke:var(--eq-line);stroke-width:1}.positioner-led{fill:var(--eq-muted)}.position-readout{fill:currentColor;font:700 9px/1 ui-monospace,monospace}.handwheel{fill:none;stroke:var(--eq-stroke);stroke-width:2}.status-outline{fill:none;stroke:transparent;stroke-width:3}.panel{fill:var(--eq-panel);stroke:var(--eq-line);stroke-width:1}.operation-strip{fill:var(--eq-muted)}.tag{fill:currentColor;font:700 12px/1 ui-monospace,monospace}.meta{fill:var(--eq-muted);font:650 7px/1 ui-monospace,monospace}.readout{fill:var(--eq-process);font:750 9px/1 ui-monospace,monospace}.view-mark{fill:currentColor;font:800 14px/1 ui-monospace,monospace}
:host([data-state~="open"]) .operation-strip{fill:var(--elements-ok,#56e29a)}:host([data-state~="powered"]) .positioner-led{fill:var(--elements-ok,#56e29a)}:host([data-state~="stuck"]) .travel-pointer,:host([data-state~="stuck"]) .stem{fill:var(--elements-alarm,#ff5c74)}:host([data-state~="warning"]) .status-outline{stroke:var(--elements-warning,#ffbe4a)}:host([data-state~="alarm"]) .status-outline{stroke:var(--elements-alarm,#ff5c74)}:host([data-state~="manual"]) .handwheel{stroke:var(--elements-warning,#ffbe4a)}:host([data-state~="bad-quality"]) .readout{opacity:.26}:host([data-state~="stale"]) .readout{opacity:.62}
:host([detail="compact"]) [data-detail="fine"],:host([detail="symbol"]) [data-detail]{display:none}:host([detail="symbol"]) text{display:none}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'FV-101', description: 'Equipment tag.' }),
    position: attribute.number('position', { defaultValue: 0, minimum: 0, maximum: 100, step: 1, unit: '%', cssVariable: '--valve-position', description: 'Actual travel from 0 to 100 percent.' }),
    command: attribute.number('command', { defaultValue: 0, minimum: 0, maximum: 100, step: 1, unit: '%', description: 'Commanded travel.' }),
    actuator: attribute.enum('actuator', ['pneumatic', 'electric'] as const, { defaultValue: 'pneumatic', description: 'Actuator type and auxiliary port.' }),
    action: attribute.enum('action', ['normally-closed', 'normally-open'] as const, { defaultValue: 'normally-closed', description: 'Fail position.' }),
    medium: attribute.enum('medium', mediumIds, { defaultValue: 'water', description: 'Process substance.' }),
    mode: attribute.enum('mode', ['auto', 'manual'] as const, { defaultValue: 'auto', description: 'Control mode.' }),
    deadband: attribute.number('deadband', { defaultValue: .5, minimum: 0, step: .1, unit: '%', description: 'Settled travel deadband.' }),
    stuck: attribute.boolean('stuck', { description: 'Whether actual travel has stopped following command.' }),
    powered: attribute.boolean('powered', { description: 'Whether motive power is available.' }),
    status: attribute.enum('status', ['idle', 'normal', 'warning', 'alarm'] as const, { defaultValue: 'idle', description: 'Process severity.' }),
    quality: attribute.enum('quality', ['good', 'stale', 'bad'] as const, { defaultValue: 'good', description: 'Telemetry quality.' }),
    detail: attribute.enum('detail', details, { defaultValue: 'auto', description: 'Visual level of detail.' }),
    view: attribute.enum('view', views, { defaultValue: 'equipment', description: 'SVG visual family. Does not change valve data or ports.' }),
  },
  states: {
    open: (context) => position(context) > numberValue(context, 'deadband'),
    closed: (context) => position(context) <= numberValue(context, 'deadband'),
    opening: (context) => !booleanValue(context, 'stuck') && deviation(context) > numberValue(context, 'deadband'),
    closing: (context) => !booleanValue(context, 'stuck') && deviation(context) < -numberValue(context, 'deadband'),
    travelling: (context) => !booleanValue(context, 'stuck') && Math.abs(deviation(context)) > numberValue(context, 'deadband'),
    stuck: (context) => booleanValue(context, 'stuck'),
    manual: (context) => stringValue(context, 'mode') === 'manual',
    powered: (context) => booleanValue(context, 'powered'),
    electric,
    'fail-open': failOpen,
    warning: (context) => stringValue(context, 'status') === 'warning' || booleanValue(context, 'stuck'),
    alarm: (context) => stringValue(context, 'status') === 'alarm',
    stale: (context) => stringValue(context, 'quality') === 'stale',
    'bad-quality': (context) => stringValue(context, 'quality') === 'bad',
  },
  bindings: [
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('meta', (context) => `${failOpen(context) ? 'FO' : 'FC'} · ${electric(context) ? 'MOV' : 'AIR'}`, ['action', 'actuator']),
    bind.text('readout', (context) => `${Math.round(position(context))} / ${Math.round(command(context))}`, ['position', 'command']),
    bind.text('positioner-readout', (context) => String(Math.round(position(context))), ['position']),
  ],
  motions: [
    { id: 'stem-travel', type: 'scrub', target: 'stem-travel', progress: (context) => position(context) / 100, settle: 420, keyframes: [{ transform: 'translateY(0px)' }, { transform: `translateY(-${geometry.stroke}px)` }], options: { duration: 1000, fill: 'both' }, reducedMotion: 'preserve' },
    { id: 'command-marker', type: 'scrub', target: 'command-marker', progress: (context) => command(context) / 100, keyframes: [{ transform: 'translateY(0px)' }, { transform: `translateY(-${geometry.stroke}px)` }], options: { duration: 1000, fill: 'both' }, reducedMotion: 'preserve' },
    { id: 'handwheel-turn', type: 'loop', target: 'handwheel', active: (context) => stateValue(context, 'manual') && stateValue(context, 'travelling'), playbackRate: (context) => (stateValue(context, 'closing') ? -1 : 1), keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], options: { duration: 2400, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze' },
    { id: 'severity-change', type: 'transition', target: 'status-outline', trigger: (context) => stringValue(context, 'status'), enabled: (context) => stringValue(context, 'status') !== 'normal', keyframes: [{ opacity: .35 }, { opacity: 1 }], options: { duration: 360, easing: 'ease-out' }, reducedMotion: 'finish' },
  ],
  ports: ports(defaultPorts, valvePorts),
  parts: [
    { name: 'body', description: 'Valve body in every visual family.', detail: 'essential' },
    { name: 'stem-travel', description: 'Actual travel motion target.', detail: 'essential' },
    { name: 'travel-pointer', detail: 'essential' },
    { name: 'command-marker', description: 'Commanded travel.', detail: 'standard' },
    { name: 'travel-scale', detail: 'standard' },
    { name: 'handwheel', detail: 'standard' },
    { name: 'positioner-led', detail: 'standard' },
    { name: 'positioner-readout', detail: 'standard' },
    { name: 'status-outline', description: 'Warning/alarm outline.', detail: 'essential' },
    { name: 'status-strip', detail: 'standard' },
    { name: 'label', detail: 'standard' },
    { name: 'readout', detail: 'standard' },
    { name: 'meta', detail: 'fine' },
  ],
});
