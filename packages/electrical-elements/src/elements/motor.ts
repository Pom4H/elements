import { attribute, bind, defineElementDefinition, svg } from '@pom4h/elements-core';
import {
  booleanValue,
  clamp,
  electricalBaseStyles,
  electricalDetails,
  electricalQualities,
  electricalStatuses,
  numberValue,
  stateValue,
  stringValue,
} from '../electrical-shared.js';

const views = ['pid', 'flat', 'equipment'] as const;

export const motorDefinition = defineElementDefinition({
  tagName: 'ee-motor',
  displayName: 'Three-phase motor',
  description: 'A motor with P&ID/electrical, flat SCADA and equipment SVG views over one electrical and telemetry contract.',
  viewBox: '0 0 320 220',
  template: svg`
<g class="view pid-view">
  <path class="wire" d="M8 110 H80"/>
  <circle class="body" data-part="body" cx="154" cy="110" r="55"/>
  <text class="mark" x="154" y="120" text-anchor="middle">M</text>
  <path class="wire" d="M209 110 H309"/>
  <circle class="status-ring status-primary" data-part="status-ring" cx="154" cy="110" r="66"/>
  <circle class="state-dot" data-part="state-dot" cx="195" cy="69" r="6"/>
</g>

<g class="view flat-view">
  <path class="wire" d="M8 110 H74"/>
  <circle class="body" data-part="body" cx="148" cy="110" r="58"/>
  <g transform="translate(148 110)"><g class="rotor" data-part="rotor"><path d="M0 -26 L8 -8 L26 0 L8 8 L0 26 L-8 8 L-26 0 L-8 -8 Z"/></g></g>
  <path class="shaft" d="M206 110 H270"/>
  <rect class="shaft" x="270" y="104" width="39" height="12" rx="4"/>
  <circle class="status-ring status-primary" data-part="status-ring" cx="148" cy="110" r="66"/>
  <circle class="state-dot" data-part="state-dot" cx="192" cy="67" r="6"/>
</g>

<g class="view equipment-view">
  <path class="wire" d="M8 110 H62"/>
  <rect class="body" data-part="body" x="62" y="62" width="156" height="96" rx="42"/>
  <path class="case-line" d="M84 72 V148 M106 66 V154 M128 64 V156 M150 64 V156 M172 66 V154 M194 72 V148"/>
  <circle class="end-cap" cx="205" cy="110" r="40"/>
  <g transform="translate(110 110)"><g class="rotor" data-part="rotor"><path d="M0 -22 L8 -7 L22 0 L8 7 L0 22 L-8 7 L-22 0 L-8 -7 Z"/></g></g>
  <path class="shaft" d="M218 110 H270"/>
  <rect class="shaft" x="270" y="104" width="39" height="12" rx="4"/>
  <rect class="fitting" x="112" y="42" width="54" height="24" rx="5"/>
  <path class="foot" d="M84 158 H116 L124 184 H76 Z M164 158 H196 L204 184 H156 Z"/>
  <circle class="status-ring status-primary" data-part="status-ring" cx="140" cy="110" r="82"/>
  <circle class="state-dot" data-part="state-dot" cx="205" cy="64" r="6"/>
</g>

<g class="tag-panel" data-detail="standard">
  <rect class="panel" x="72" y="184" width="164" height="34" rx="5"/>
  <text class="label" data-part="label" x="84" y="199">M-101</text>
  <text class="readout" data-part="readout" data-quality-sensitive x="84" y="213">1450 RPM · 12.4 A</text>
</g>
<g class="load-panel" data-detail="fine" data-quality-sensitive>
  <rect class="load-track" x="238" y="190" width="70" height="6" rx="3"/>
  <rect class="load-bar" data-part="load-bar" x="238" y="190" width="70" height="6" rx="3"/>
  <text class="meta" data-part="load-label" x="273" y="211" text-anchor="middle">72% LOAD</text>
</g>
`,
  styles: `
${electricalBaseStyles}
:host{width:320px;aspect-ratio:16/11;--eq-body:var(--elements-equipment-body,#31485a);--eq-body-2:var(--elements-equipment-body-alt,#3d566a);--eq-stroke:var(--elements-equipment-stroke,#9aafbd);--eq-line:var(--elements-line,#8095a4);--eq-panel:var(--elements-panel,#0d1922);--eq-muted:var(--elements-muted,#7890a1);--eq-process:var(--elements-process,#43bce8)}.view{display:none}:host(:not([view])) .equipment-view,:host([view="equipment"]) .equipment-view,:host([view="flat"]) .flat-view,:host([view="pid"]) .pid-view{display:inline}.body{fill:var(--eq-body);stroke:var(--eq-stroke);stroke-width:2}.end-cap,.fitting{fill:var(--eq-body-2);stroke:var(--eq-stroke);stroke-width:1.5}.case-line{fill:none;stroke:var(--eq-line);stroke-width:2}.foot{fill:var(--eq-body);stroke:var(--eq-line);stroke-width:1.2}.mark{fill:currentColor;font:900 28px/1 ui-monospace,monospace}.rotor{fill:var(--eq-line);transform-box:fill-box;transform-origin:center;opacity:.32}.shaft{fill:none;stroke:var(--eq-line);stroke-width:4;stroke-linecap:round}.status-ring{fill:none;stroke:transparent;stroke-width:3}.state-dot{fill:var(--eq-muted)}.panel{fill:var(--eq-panel);stroke:var(--eq-line);stroke-width:1}.label{fill:currentColor}.readout{fill:var(--eq-process)}.meta{fill:var(--eq-muted)}.load-track{fill:var(--eq-panel);stroke:var(--eq-line);stroke-width:1}.load-bar{fill:var(--eq-line);transform-box:view-box;transform-origin:238px 193px}:host([view="pid"]) .tag-panel .panel{fill:transparent;stroke:none}:host([view="pid"]) .tag-panel .readout,:host([view="pid"]) .load-panel{display:none}
:host([data-state~="running"]) .rotor{opacity:.82}:host([data-state~="running"]) .state-dot{fill:var(--elements-ok,#56e29a)}:host([data-state~="overloaded"]) .load-bar{fill:var(--elements-warning,#ffbe4a)}:host([status="warning"]) .status-ring{stroke:var(--elements-warning,#ffbe4a)}:host([status="alarm"]) .status-ring{stroke:var(--elements-alarm,#ff5c74)}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'M-101', description: 'Equipment tag.' }),
    running: attribute.boolean('running', { description: 'Whether the motor is commanded to run.' }),
    speed: attribute.number('speed', { defaultValue: 0, minimum: 0, step: 1, unit: 'rpm', description: 'Measured shaft speed.' }),
    load: attribute.number('load', { defaultValue: 0, minimum: 0, maximum: 150, step: 1, unit: '%', description: 'Mechanical load as percent of rated load.' }),
    current: attribute.number('current', { defaultValue: 0, minimum: 0, step: .1, unit: 'A', description: 'Measured line current.' }),
    voltage: attribute.number('voltage', { defaultValue: 400, minimum: 0, step: 1, unit: 'V', description: 'Measured line voltage.' }),
    status: attribute.enum('status', electricalStatuses, { defaultValue: 'normal', description: 'Electrical equipment severity.' }),
    quality: attribute.enum('quality', electricalQualities, { defaultValue: 'unknown', description: 'Telemetry quality.' }),
    detail: attribute.enum('detail', electricalDetails, { defaultValue: 'auto', description: 'Visual level of detail.' }),
    view: attribute.enum('view', views, { defaultValue: 'equipment', description: 'SVG visual family. Does not change motor data, states or ports.' }),
  },
  states: {
    running: (context) => booleanValue(context, 'running') && numberValue(context, 'speed') > 0,
    overloaded: (context) => numberValue(context, 'load') > 100,
  },
  bindings: [
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('readout', (context) => `${Math.round(numberValue(context, 'speed'))} RPM · ${numberValue(context, 'current').toFixed(1)} A`, ['speed', 'current']),
    bind.text('load-label', (context) => `${Math.round(numberValue(context, 'load'))}% LOAD`, ['load']),
  ],
  motions: [
    { id: 'motor-rotor', type: 'loop', target: 'rotor', active: (context) => stateValue(context, 'running'), playbackRate: (context) => Math.max(.08, numberValue(context, 'speed') / 1450), phase: 'electrical-mechanical', keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], options: { duration: 1300, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze' },
    { id: 'motor-load', type: 'scrub', target: 'load-bar', progress: (context) => clamp(numberValue(context, 'load') / 100, 0, 1), keyframes: [{ transform: 'scaleX(.03)' }, { transform: 'scaleX(1)' }], options: { duration: 1000, fill: 'both', easing: 'linear' }, reducedMotion: 'preserve' },
    { id: 'motor-severity', type: 'transition', target: 'status-ring', trigger: (context) => stringValue(context, 'status'), enabled: (context) => stringValue(context, 'status') !== 'normal', keyframes: [{ opacity: .35 }, { opacity: 1 }], options: { duration: 360, easing: 'ease-out' }, reducedMotion: 'finish' },
  ],
  ports: [
    { id: 'power', x: 8, y: 110, direction: 'left', kind: 'electrical', role: 'inlet', label: 'Three-phase supply' },
    { id: 'thermal', x: 154, y: 10, direction: 'top', kind: 'signal', role: 'outlet', label: 'Thermal feedback' },
  ],
  parts: [
    { name: 'body', description: 'Motor silhouette in every visual family.', detail: 'essential' },
    { name: 'status-ring', description: 'Severity outline.', detail: 'essential' },
    { name: 'rotor', description: 'Running-state rotor.', detail: 'standard' },
    { name: 'state-dot', description: 'Operation marker.', detail: 'standard' },
    { name: 'load-bar', description: 'Rated-load scrub indicator.', detail: 'fine' },
    { name: 'load-label', detail: 'fine' },
    { name: 'label', detail: 'standard' },
    { name: 'readout', detail: 'standard' },
  ],
});
