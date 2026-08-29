import { attribute, bind, defineElementDefinition, svg } from '@pom4h/elements-core';
import { booleanValue, numberValue, stateValue, stringValue } from '../shared.js';

const views = ['pid', 'flat', 'equipment'] as const;
const details = ['auto', 'full', 'compact', 'symbol'] as const;
const statuses = ['normal', 'warning', 'alarm'] as const;
const qualities = ['unknown', 'good', 'stale', 'bad'] as const;

const geometry = Object.freeze({
  cx: 160,
  cy: 145,
  inX: 10,
  outX: 273,
  outY: 31,
  powerX: 474,
});

export const pumpDefinition = defineElementDefinition({
  tagName: 'pe-pump',
  displayName: 'End-suction centrifugal pump',
  description: 'A centrifugal pump with interchangeable P&ID, flat SCADA and equipment SVG views over one data, state and port contract.',
  viewBox: '0 0 510 290',
  template: svg`
<!-- P&ID: notation first. -->
<g data-view="pid" class="view pid-view">
  <path class="line" d="M10 145 H88"/>
  <circle class="body" data-part="housing" cx="160" cy="145" r="62"/>
  <path class="process-mark" d="M126 108 L207 145 L126 182 Z"/>
  <path class="line" d="M201 101 H273 V31"/>
  <path class="line secondary" d="M222 145 H327"/>
  <circle class="drive" data-part="motor-group" cx="376" cy="145" r="43"/>
  <text class="view-mark" x="376" y="153" text-anchor="middle">M</text>
  <path class="line secondary" d="M419 145 H474"/>
  <circle class="status-ring" data-part="status-ring" data-status-primary cx="160" cy="145" r="70"/>
  <circle class="operation-dot" data-part="operation-marker" data-operation-marker cx="202" cy="99" r="6"/>
</g>

<!-- Flat SCADA: same topology, stronger operational affordance. -->
<g data-view="flat" class="view flat-view">
  <path class="line" d="M10 145 H87"/>
  <circle class="body" data-part="housing" cx="160" cy="145" r="70"/>
  <circle class="inner" cx="160" cy="145" r="48"/>
  <g transform="translate(160 145)">
    <g data-part="rotor" class="rotor">
      <path class="process-fill" d="M0 -32 L10 -8 L32 0 L10 8 L0 32 L-10 8 L-32 0 L-10 -8 Z"/>
    </g>
  </g>
  <path class="line" d="M208 96 H273 V31"/>
  <path class="shaft" d="M230 145 H330"/>
  <rect class="drive" data-part="motor-group" x="330" y="105" width="96" height="80" rx="24"/>
  <path class="line secondary" d="M426 145 H474"/>
  <circle class="status-ring" data-part="status-ring" data-status-primary cx="160" cy="145" r="78"/>
  <circle class="operation-dot" data-part="operation-marker" data-operation-marker cx="400" cy="119" r="7"/>
</g>

<!-- Equipment: recognizable machine, still flat enough to live beside symbols. -->
<g data-view="equipment" class="view equipment-view">
  <path class="base" d="M74 224 H444 L458 244 H60 Z"/>
  <path class="fitting" d="M10 128 H88 V162 H10 Z"/>
  <circle class="body" data-part="housing" cx="160" cy="145" r="76"/>
  <path class="body" d="M186 82 H250 Q268 82 268 100 V124 H244 V105 H201 Z"/>
  <path class="fitting" d="M254 96 H286 V41 H306 V122 H268 V145 H244 V116 H254 Z"/>
  <rect class="fitting" x="263" y="22" width="56" height="18" rx="3"/>
  <circle class="inner" cx="160" cy="145" r="49"/>
  <g transform="translate(160 145)">
    <g data-part="rotor" class="rotor">
      <path class="process-fill" d="M0 -34 C12 -25 21 -13 26 0 C16 4 8 13 0 28 C-9 15 -18 7 -29 2 C-22 -12 -12 -24 0 -34 Z"/>
    </g>
  </g>
  <path class="shaft" d="M209 145 H337"/>
  <rect class="drive" data-part="motor-group" x="337" y="98" width="113" height="94" rx="20"/>
  <path class="drive-line" d="M354 111 V179 M370 106 V184 M386 104 V186 M402 104 V186 M418 106 V184 M434 111 V179"/>
  <rect class="fitting" x="372" y="72" width="48" height="26" rx="5"/>
  <path class="line secondary" d="M450 145 H474"/>
  <circle class="status-ring" data-part="status-ring" data-status-primary cx="160" cy="145" r="84"/>
  <circle class="operation-dot" data-part="operation-marker" data-operation-marker cx="422" cy="115" r="7"/>
</g>

<g class="tag-panel" data-part="tag-panel" transform="translate(118 250)" data-detail="standard">
  <rect class="panel" width="266" height="30" rx="5"/>
  <rect class="operation-strip" data-part="status-strip" data-operation-marker width="4" height="30" rx="2"/>
  <text class="tag" x="14" y="20" data-part="label">P-101</text>
  <text class="meta" x="84" y="19" data-part="meta">1450 RPM</text>
  <text class="readout" x="252" y="20" text-anchor="end" data-part="readout" data-quality-sensitive>6.2 BAR</text>
  <circle class="quality" data-part="quality-indicator" data-quality-indicator cx="258" cy="7" r="3"/>
</g>
`,
  styles: `
:host{display:inline-block;width:510px;max-width:100%;aspect-ratio:51/29;color:var(--elements-ink,#dbe7f3);container-type:inline-size;contain:layout style;--eq-body:var(--elements-equipment-body,#31485a);--eq-body-2:var(--elements-equipment-body-alt,#3d566a);--eq-stroke:var(--elements-equipment-stroke,#9aafbd);--eq-line:var(--elements-line,#8095a4);--eq-panel:var(--elements-panel,#0d1922);--eq-muted:var(--elements-muted,#7890a1);--eq-process:var(--elements-process,#43bce8)}
svg{width:100%;height:100%;overflow:visible}.view{display:none}:host(:not([view])) .equipment-view,:host([view="equipment"]) .equipment-view,:host([view="flat"]) .flat-view,:host([view="pid"]) .pid-view{display:inline}
.body{fill:var(--eq-body);stroke:var(--eq-stroke);stroke-width:2}.inner{fill:color-mix(in srgb,var(--eq-body) 72%,#000);stroke:var(--eq-line);stroke-width:1.4}.fitting,.drive{fill:var(--eq-body-2);stroke:var(--eq-stroke);stroke-width:1.6}.drive-line{fill:none;stroke:var(--eq-line);stroke-width:2}.base{fill:var(--eq-body);stroke:var(--eq-line);stroke-width:1.4}.line,.shaft{fill:none;stroke:var(--eq-line);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.line.secondary{stroke-width:2}.process-mark{fill:none;stroke:var(--eq-stroke);stroke-width:3;stroke-linejoin:round}.process-fill{fill:var(--eq-process);stroke:color-mix(in srgb,var(--eq-process) 70%,white);stroke-width:1.5}.rotor{transform-box:fill-box;transform-origin:center;opacity:.32}.view-mark{fill:currentColor;font:800 26px/1 ui-monospace,monospace}.status-ring{fill:none;stroke:transparent;stroke-width:3}.operation-dot,.operation-strip{fill:var(--eq-muted)}.panel{fill:var(--eq-panel);stroke:var(--eq-line);stroke-width:1}.tag{fill:currentColor;font:700 13px/1 ui-monospace,monospace;letter-spacing:.06em}.meta{fill:var(--eq-muted);font:650 8px/1 ui-monospace,monospace}.readout{fill:var(--eq-process);font:750 10px/1 ui-monospace,monospace}.quality{fill:var(--eq-muted)}[data-quality-sensitive]{opacity:.4}
:host([view="pid"]) .tag-panel .panel{fill:transparent;stroke:none}:host([view="pid"]) .tag-panel .operation-strip,:host([view="pid"]) .tag-panel .meta,:host([view="pid"]) .tag-panel .readout,:host([view="pid"]) .tag-panel .quality{display:none}
:host([data-state~="running"]) .rotor{opacity:1}:host([data-state~="running"]) .operation-dot,:host([data-state~="running"]) .operation-strip{fill:var(--elements-ok,#56e29a)}:host([status="warning"]) .status-ring{stroke:var(--elements-warning,#ffbe4a)}:host([status="alarm"]) .status-ring{stroke:var(--elements-alarm,#ff5c74)}:host([quality="good"]) [data-quality-sensitive]{opacity:1}:host([quality="stale"]) [data-quality-sensitive]{opacity:.62}:host([quality="bad"]) [data-quality-sensitive]{opacity:.26}:host([quality="good"]) .quality{fill:var(--elements-ok,#56e29a)}:host([quality="stale"]) .quality{fill:var(--elements-warning,#ffbe4a)}:host([quality="bad"]) .quality{fill:var(--elements-alarm,#ff5c74)}
:host([detail="compact"]) [data-detail="fine"],:host([detail="symbol"]) [data-detail]{display:none}:host([detail="symbol"]) text{display:none}@container(max-width:300px){[data-detail="standard"]{display:none}.status-ring{stroke-width:4}}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'P-101', description: 'Equipment label.' }),
    running: attribute.boolean('running', { description: 'Whether the pump is commanded to run.' }),
    speed: attribute.number('speed', { defaultValue: 0, cssVariable: '--pump-speed', description: 'Shaft speed in rpm.' }),
    value: attribute.number('value', { defaultValue: 0, description: 'Primary process value.' }),
    unit: attribute.string('unit', { defaultValue: 'bar', description: 'Primary process value unit.' }),
    status: attribute.enum('status', statuses, { defaultValue: 'normal', description: 'Severity independent from operation and data quality.' }),
    quality: attribute.enum('quality', qualities, { defaultValue: 'unknown', description: 'Telemetry quality independent from process severity.' }),
    detail: attribute.enum('detail', details, { defaultValue: 'auto', description: 'Visual level of detail.' }),
    view: attribute.enum('view', views, { defaultValue: 'equipment', description: 'SVG visual family. Does not change data, states, motions or ports.' }),
  },
  states: {
    running: (context) => booleanValue(context, 'running') && numberValue(context, 'speed') > 0,
  },
  bindings: [
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('readout', (context) => `${numberValue(context, 'value').toFixed(1)} ${stringValue(context, 'unit').toUpperCase()}`, ['value', 'unit']),
    bind.text('meta', (context) => `${Math.round(numberValue(context, 'speed'))} RPM`, ['speed']),
  ],
  motions: [
    { id: 'rotor-spin', type: 'loop', target: 'rotor', active: (context) => stateValue(context, 'running'), playbackRate: (context) => Math.max(.08, numberValue(context, 'speed') / 1450), phase: 'process-mechanical', keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], options: { duration: 1350, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze' },
    { id: 'start-status', type: 'transition', target: 'status-strip', trigger: (context) => stateValue(context, 'running'), enabled: (context) => stateValue(context, 'running'), keyframes: [{ opacity: .35 }, { opacity: 1 }], options: { duration: 260, easing: 'ease-out' }, reducedMotion: 'finish' },
    { id: 'severity-change', type: 'transition', target: 'status-ring', trigger: (context) => stringValue(context, 'status'), enabled: (context) => stringValue(context, 'status') !== 'normal', keyframes: [{ opacity: .35 }, { opacity: 1 }], options: { duration: 360, easing: 'ease-out' }, reducedMotion: 'finish' },
  ],
  ports: [
    { id: 'in', x: geometry.inX, y: geometry.cy, direction: 'left', kind: 'process', role: 'inlet' },
    { id: 'out', x: geometry.outX, y: geometry.outY, direction: 'top', kind: 'process', role: 'outlet' },
    { id: 'power', x: geometry.powerX, y: geometry.cy, direction: 'right', kind: 'electrical', role: 'inlet' },
  ],
  parts: [
    { name: 'housing', description: 'Pump body in every visual family.', detail: 'essential' },
    { name: 'rotor', description: 'Operation motion target where the selected view exposes one.', detail: 'standard' },
    { name: 'motor-group', description: 'Drive representation.', detail: 'essential' },
    { name: 'status-ring', description: 'Severity outline.', detail: 'essential' },
    { name: 'operation-marker', description: 'Running-state marker.', detail: 'essential' },
    { name: 'status-strip', description: 'Running-state marker in the tag.', detail: 'standard' },
    { name: 'quality-indicator', description: 'Telemetry quality marker.', detail: 'standard' },
    { name: 'label', detail: 'standard' },
    { name: 'readout', detail: 'standard' },
    { name: 'meta', detail: 'standard' },
  ],
});
