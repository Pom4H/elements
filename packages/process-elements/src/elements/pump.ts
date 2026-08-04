import {
  attribute,
  bind,
  defineElementDefinition,
  defineFragment,
  svg,
  type FragmentPlacement,
} from '@pom4h/elements-core';
import { booleanValue, numberValue, stateValue, stringValue } from '../shared.js';

const hydraulic = defineFragment({
  name: 'pump-hydraulic',
  template: svg`<g data-part="process-body"><path class="outlet tech-stroke" d="M118 24 H161 V73 H128 V46 H118 Z"/><rect class="flange tech-stroke" x="112" y="18" width="56" height="12" rx="3"/><circle class="bolt" cx="120" cy="24" r="2" data-detail="fine"/><circle class="bolt" cx="160" cy="24" r="2" data-detail="fine"/>
<path class="inlet tech-stroke" d="M22 108 H78 V143 H22 Z"/><rect class="flange tech-stroke" x="14" y="101" width="15" height="49" rx="3"/><circle class="bolt" cx="21.5" cy="109" r="2" data-detail="fine"/><circle class="bolt" cx="21.5" cy="142" r="2" data-detail="fine"/>
<path class="body tech-stroke" d="M74 80 C95 51 139 44 172 62 C198 77 210 104 205 131 C202 148 193 162 177 175 C157 192 125 197 100 187 C72 176 56 151 58 123 C59 106 64 92 74 80 Z M179 91 C190 100 194 113 192 127 C190 140 183 151 172 160 C158 172 137 176 120 169 C101 162 91 146 92 127 C93 109 101 95 116 87 C136 76 162 78 179 91 Z" fill-rule="evenodd" data-part="housing"/>
<path class="body-highlight" d="M78 83 C98 58 136 51 166 65" data-detail="fine"/><circle class="chamber-inner" cx="139" cy="127" r="47"/>
<circle class="impeller-ring" cx="139" cy="127" r="37"/><circle class="status-halo" cx="139" cy="127" r="55" data-part="status-halo"/>
</g>

<path class="flow-path" d="M31 125 H84 C93 125 95 127 101 127 C112 127 118 119 127 114 C143 105 161 107 170 118 C177 126 175 139 166 146 C158 151 149 154 144 162 C140 169 140 178 140 185 M168 81 C159 75 151 71 145 60 C141 52 140 43 140 30" data-part="flow-path"/>

<path class="direction" d="M50 119 l10 6 -10 6 z"/>
<path class="direction" d="M134 48 l6 -10 6 10 z"/>
`,
});

const rotor = defineFragment({
  name: 'pump-rotor',
  template: svg`<g data-part="rotor" class="impeller"><path d="M139 91 C150 96 158 107 158 119 C169 112 181 114 188 123 C181 134 169 138 158 133 C162 145 158 157 148 164 C137 158 131 147 133 135 C122 143 110 142 101 133 C105 121 115 113 128 113 C121 103 124 92 139 91 Z"/><circle class="hub" cx="139" cy="127" r="9"/></g>
`,
});

const motor = defineFragment({
  name: 'pump-motor',
  template: svg`<rect class="shaft" x="184" y="119" width="48" height="16" rx="5" data-part="shaft"/>

<g class="motor-group" data-part="motor-group"><rect class="motor-shell" x="220" y="78" width="106" height="95" rx="18"/><path class="motor-end" d="M306 84 C326 94 334 111 334 126 C334 145 326 161 306 169 Z"/><g>
<rect class="fin" x="232" y="83" width="5" height="85" rx="2"/><rect class="fin" x="243" y="81" width="5" height="89" rx="2"/><rect class="fin" x="254" y="80" width="5" height="91" rx="2"/><rect class="fin" x="265" y="80" width="5" height="91" rx="2"/><rect class="fin" x="276" y="80" width="5" height="91" rx="2"/><rect class="fin" x="287" y="81" width="5" height="89" rx="2"/><rect class="fin" x="298" y="83" width="5" height="85" rx="2"/></g>
<rect class="terminal-box" x="248" y="62" width="48" height="24" rx="5"/><rect class="terminal-box" x="256" y="55" width="32" height="10" rx="3"/><path class="foot" d="M235 170 H265 L270 188 H228 Z"/><path class="foot" d="M287 170 H317 L324 188 H280 Z"/></g>
`,
});

const assembly: readonly FragmentPlacement[] = [
  { key: 'hydraulic', fragment: hydraulic },
  { key: 'rotor', fragment: rotor },
  { key: 'motor', fragment: motor },
];

export const pumpDefinition = defineElementDefinition({
  tagName: 'pe-pump',
  displayName: 'Centrifugal pump',
  description: 'A high-detail centrifugal pump with semantic level of detail and coordinated mechanical and process motion.',
  viewBox: '0 0 360 240',
  template: svg`<defs>
<linearGradient id="pump-shell" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#42586f"/><stop offset=".44" stop-color="#24364a"/><stop offset="1" stop-color="#132130"/></linearGradient>
<radialGradient id="pump-cavity"><stop stop-color="#1b3448"/><stop offset=".72" stop-color="#0d1a27"/><stop offset="1" stop-color="#07111b"/></radialGradient>
<linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#70869a"/><stop offset=".4" stop-color="#2f4357"/><stop offset="1" stop-color="#182736"/></linearGradient>
<linearGradient id="flange" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#60778d"/><stop offset=".5" stop-color="#293b4e"/><stop offset="1" stop-color="#142333"/></linearGradient>
<linearGradient id="motor" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#39516a"/><stop offset=".48" stop-color="#22364a"/><stop offset="1" stop-color="#132435"/></linearGradient>
<linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#eef6fb"/><stop offset=".42" stop-color="#7d92a5"/><stop offset="1" stop-color="#25384b"/></linearGradient>
<linearGradient id="impeller" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8be5ff"/><stop offset=".45" stop-color="#35bdf5"/><stop offset="1" stop-color="#197db1"/></linearGradient>
<radialGradient id="hub"><stop stop-color="#e8fbff"/><stop offset=".35" stop-color="#6bcfff"/><stop offset="1" stop-color="#1a79a7"/></radialGradient>
<filter id="shadow" x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="#000" flood-opacity=".42"/></filter>
<filter id="soft-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="cyan-glow" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="0" stdDeviation="2.1" flood-color="#52c8ff" flood-opacity=".6"/></filter>
<filter id="green-glow" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#58e39a" flood-opacity=".55"/></filter>
<filter id="red-glow" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#ff5c74" flood-opacity=".62"/></filter><filter id="amber-glow" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#ffbe4a" flood-opacity=".58"/></filter></defs>

<g data-mount="assembly"/>
<g transform="translate(78 196)" data-part="tag-panel"><rect class="tag-plate" width="205" height="30" rx="6" data-detail="standard"/><text class="tag" x="12" y="19" data-detail="standard" data-part="label">P-101</text><text class="readout" x="193" y="18" text-anchor="end" data-detail="standard" data-part="readout">6.2 BAR</text><text class="micro" x="12" y="27" data-detail="fine" data-part="meta">CENTRIFUGAL · 1450 RPM</text></g>
`,
  styles: `
:host {
  display: inline-block;
  width: 360px;
  max-width: 100%;
  aspect-ratio: var(--elements-aspect-ratio, 3 / 2);
  color: var(--elements-ink, #dbe7f3);
  container-type: inline-size;
  contain: layout style;
}
svg { width: 100%; height: 100%; overflow: visible; }

.body{fill:url(#pump-shell);stroke:#9cb0c5;stroke-width:2.2;transform-box:fill-box;transform-origin:center}.body-highlight{fill:none;stroke:rgba(255,255,255,.16);stroke-width:1}.chamber-inner{fill:url(#pump-cavity);stroke:#6f879f;stroke-width:1.5}.inlet,.outlet{fill:url(#steel);stroke:#a4b8ca;stroke-width:1.7}.flange{fill:url(#flange);stroke:#b5c4d1;stroke-width:1.6}.bolt{fill:#314257;stroke:#aebdca;stroke-width:.7}.shaft{fill:url(#shaft);stroke:#c6d2dd;stroke-width:1}.motor-shell{fill:url(#motor);stroke:#92a7ba;stroke-width:1.8}.motor-end{fill:#243449;stroke:#8095aa;stroke-width:1.4}.fin{fill:#2a3b50;stroke:#7890a8;stroke-width:.8}.terminal-box{fill:#1b2a3c;stroke:#748aa0;stroke-width:1.2}.foot{fill:#243449;stroke:#70879c;stroke-width:1.1}.impeller-ring{fill:none;stroke:rgba(82,200,255,.28);stroke-width:10}.impeller{fill:url(#impeller);stroke:#8fe0ff;stroke-width:.9;filter:url(#cyan-glow);transform-box:fill-box;transform-origin:center}.hub{fill:url(#hub);stroke:#d9f4ff;stroke-width:1}.flow-path{fill:none;stroke:#55d8ff;stroke-width:3.4;stroke-linecap:round;stroke-dasharray:2 10;filter:url(#soft-glow)}.status-halo{fill:none;stroke:#58e39a;stroke-width:2.4;opacity:.78;filter:url(#green-glow);}.tag-plate{fill:#0c1622;stroke:#50657b;stroke-width:1}.tag{fill:#e4edf6;font:700 12px/1 ui-monospace,monospace;letter-spacing:.07em}.readout{fill:#79d8ff;font:700 10px/1 ui-monospace,monospace}.micro{fill:#60768c;font:600 6.7px/1 ui-monospace,monospace;letter-spacing:.08em}.direction{fill:#52c8ff}.motor-group{transform-box:fill-box;transform-origin:center}

:host([data-state~="warning"]) .status-halo { stroke: var(--elements-warning, #ffbe4a); filter: url(#amber-glow); }
:host([data-state~="alarm"]) .status-halo { stroke: var(--elements-alarm, #ff5c74); filter: url(#red-glow); }
:host([data-state~="bad-quality"]) svg { opacity: .42; filter: grayscale(1); }
:host([data-state~="stale"]) svg { opacity: .64; filter: saturate(.35); }
:host([detail="compact"]) [data-detail="fine"],
:host([detail="symbol"]) [data-detail] { display: none; }
:host([detail="symbol"]) text { display: none; }
@container (max-width: 460px) { [data-detail="fine"] { display: none; } }
@container (max-width: 300px) {
  [data-detail="standard"] { display: none; }
  .status-halo { stroke-width: 4; }
  .flow-path { stroke-width: 5; }
}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'P-101', description: 'Equipment label.' }),
    running: attribute.boolean('running', { description: 'Whether the pump is commanded to run.' }),
    speed: attribute.number('speed', { defaultValue: 0, cssVariable: '--pump-speed', description: 'Rotor speed in rpm.' }),
    value: attribute.number('value', { defaultValue: 0, description: 'Primary process value.' }),
    unit: attribute.string('unit', { defaultValue: 'bar', description: 'Primary process value unit.' }),
    status: attribute.enum('status', ['idle', 'normal', 'warning', 'alarm'] as const, { defaultValue: 'idle', description: 'Process status independent from data quality.' }),
    quality: attribute.enum('quality', ['good', 'stale', 'bad'] as const, { defaultValue: 'good', description: 'Telemetry quality independent from process status.' }),
    detail: attribute.enum('detail', ['auto', 'full', 'compact', 'symbol'] as const, { defaultValue: 'auto', description: 'Visual level of detail. Auto uses container queries.' }),
  },
  states: {
    running: (context) => booleanValue(context, 'running') && numberValue(context, 'speed') > 0,
    warning: (context) => stringValue(context, 'status') === 'warning',
    alarm: (context) => stringValue(context, 'status') === 'alarm',
    stale: (context) => stringValue(context, 'quality') === 'stale',
    'bad-quality': (context) => stringValue(context, 'quality') === 'bad',
  },
  collections: [{ mount: 'assembly', items: () => assembly }],
  bindings: [
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('readout', (context) => `${numberValue(context, 'value').toFixed(1)} ${stringValue(context, 'unit').toUpperCase()}`, ['value', 'unit']),
    bind.text('meta', (context) => `CENTRIFUGAL · ${Math.round(numberValue(context, 'speed'))} RPM`, ['speed']),
  ],
  motions: [
    { id: 'rotor-spin', type: 'loop', target: 'rotor', active: (context) => stateValue(context, 'running'), playbackRate: (context) => Math.max(.08, numberValue(context, 'speed') / 1450), phase: 'process-mechanical', keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], options: { duration: 1350, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze' },
    { id: 'process-flow', type: 'loop', target: 'flow-path', active: (context) => stateValue(context, 'running'), playbackRate: (context) => Math.max(.12, numberValue(context, 'speed') / 1450), phase: 'process-flow', keyframes: [{ strokeDashoffset: 0 }, { strokeDashoffset: -48 }], options: { duration: 1050, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze' },
    { id: 'motor-hum', type: 'loop', target: 'motor-group', active: (context) => stateValue(context, 'running'), playbackRate: (context) => Math.max(.2, numberValue(context, 'speed') / 1450), keyframes: [{ transform: 'translateY(-0.18px)' }, { transform: 'translateY(0.18px)' }], options: { duration: 110, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }, reducedMotion: 'freeze' },
    { id: 'start-kick', type: 'transition', target: 'housing', trigger: (context) => stateValue(context, 'running'), enabled: (context) => stateValue(context, 'running'), keyframes: [{ transform: 'scale(1)' }, { transform: 'scale(1.018)' }, { transform: 'scale(1)' }], options: { duration: 260, easing: 'cubic-bezier(.2,.9,.3,1)' }, reducedMotion: 'finish' },
    { id: 'alarm-pulse', type: 'loop', target: 'status-halo', active: (context) => stateValue(context, 'alarm'), keyframes: [{ opacity: .34 }, { opacity: 1 }, { opacity: .34 }], options: { duration: 760, iterations: Infinity, easing: 'ease-in-out' }, reducedMotion: 'finish' },
  ],
  ports: [
    { id: 'in', x: 14, y: 125, direction: 'left', kind: 'process' },
    { id: 'out', x: 140, y: 18, direction: 'top', kind: 'process' },
    { id: 'power', x: 334, y: 126, direction: 'right', kind: 'electrical' },
  ],
  parts: [
    { name: 'housing', description: 'Volute housing.', detail: 'essential' },
    { name: 'rotor', description: 'Animated impeller.', detail: 'essential' },
    { name: 'motor-group', description: 'Motor assembly.', detail: 'essential' },
    { name: 'flow-path', description: 'Animated process path.', detail: 'essential' },
    { name: 'status-halo', description: 'Process status halo.', detail: 'essential' },
    { name: 'label', detail: 'standard' },
    { name: 'readout', detail: 'standard' },
    { name: 'meta', detail: 'fine' },
  ],
});
