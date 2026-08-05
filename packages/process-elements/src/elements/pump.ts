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
  template: svg`
<path class="base" d="M103 222 H450 L466 245 H87 Z"/>
<rect class="base-rail" x="104" y="245" width="344" height="12" rx="4"/>

<g data-part="process-body">
  <path class="suction" d="M20 137 H102 V165 H20 Z"/>
  <rect class="flange" x="8" y="128" width="18" height="46" rx="3"/>
  <circle class="bolt" cx="17" cy="136" r="2" data-detail="fine"/>
  <circle class="bolt" cx="17" cy="166" r="2" data-detail="fine"/>

  <path class="shell" data-part="housing" fill-rule="evenodd" d="M104 120 C116 76 151 53 193 55 C235 57 269 84 279 124 C287 154 279 184 258 204 C240 221 216 229 189 226 H146 C114 222 92 196 90 164 C89 145 94 131 104 120 Z M132 143 C140 116 162 98 190 98 C221 98 246 122 246 152 C246 182 222 206 191 206 C160 206 136 185 132 157 Z"/>
  <path class="shell-highlight" d="M113 117 C128 81 158 65 193 67 C231 69 257 93 267 124" data-detail="fine"/>

  <path class="discharge" d="M221 74 C248 87 268 105 279 129 L279 42 H322 V75 H300 V133 H279 C270 105 251 86 221 74 Z"/>
  <rect class="flange" x="272" y="24" width="58" height="19" rx="3"/>
  <circle class="bolt" cx="282" cy="33.5" r="2" data-detail="fine"/>
  <circle class="bolt" cx="320" cy="33.5" r="2" data-detail="fine"/>

  <circle class="cavity" cx="190" cy="152" r="55"/>
  <circle class="inspection" cx="190" cy="152" r="42"/>
  <circle class="inspection-ring" cx="190" cy="152" r="47" data-detail="fine"/>

  <path class="flow-under" d="M8 151 H145 C157 151 169 151 180 148 C199 143 215 130 224 111 C236 87 253 76 278 76 H301 V24"/>
  <path class="flow-path" data-part="flow-path" d="M8 151 H145 C157 151 169 151 180 148 C199 143 215 130 224 111 C236 87 253 76 278 76 H301 V24"/>

  <g class="status-beacon" data-part="status-beacon" transform="translate(275 104)">
    <circle class="status-halo" data-part="status-halo" r="10"/>
    <circle class="status-dot" r="3.5"/>
  </g>
</g>

<path class="foot" d="M125 222 L132 204 H164 L170 222 Z"/>
<path class="foot" d="M222 222 L228 206 H256 L264 222 Z"/>
`,
});

const impeller = defineFragment({
  name: 'pump-impeller',
  template: svg`
<g class="rotor" data-part="rotor" transform="translate(190 152)">
  <circle class="impeller-shroud" r="34"/>
  <path class="vane" d="M7 -5 C18 -13 25 -24 23 -32"/>
  <path class="vane" d="M7 -5 C18 -13 25 -24 23 -32" transform="rotate(60)"/>
  <path class="vane" d="M7 -5 C18 -13 25 -24 23 -32" transform="rotate(120)"/>
  <path class="vane" d="M7 -5 C18 -13 25 -24 23 -32" transform="rotate(180)"/>
  <path class="vane" d="M7 -5 C18 -13 25 -24 23 -32" transform="rotate(240)"/>
  <path class="vane" d="M7 -5 C18 -13 25 -24 23 -32" transform="rotate(300)"/>
  <circle class="eye" r="10"/>
</g>
`,
});

const drive = defineFragment({
  name: 'pump-drive',
  template: svg`
<path class="bearing" d="M244 135 H285 V169 H244 C250 159 251 146 244 135 Z"/>
<rect class="shaft" x="274" y="145" width="43" height="14" rx="4" data-part="shaft"/>

<g class="coupling" data-part="coupling" transform="translate(312 152)">
  <circle class="coupling-rim" r="14"/>
  <circle class="coupling-hub" r="7"/>
  <path class="coupling-mark" d="M-10 0 H10 M0 -10 V10"/>
</g>

<path class="guard" d="M298 126 H344 C354 126 361 134 361 144 V166 C361 176 354 184 344 184 H298 Z"/>
<g class="guard-vents" data-detail="fine">
  <circle cx="315" cy="141" r="2.5"/><circle cx="330" cy="141" r="2.5"/><circle cx="345" cy="141" r="2.5"/>
  <circle cx="315" cy="155" r="2.5"/><circle cx="330" cy="155" r="2.5"/><circle cx="345" cy="155" r="2.5"/>
  <circle cx="315" cy="169" r="2.5"/><circle cx="330" cy="169" r="2.5"/><circle cx="345" cy="169" r="2.5"/>
</g>

<g class="motor-group" data-part="motor-group">
  <rect class="motor-shell" x="350" y="103" width="104" height="98" rx="18"/>
  <path class="motor-end" d="M440 110 C462 122 472 137 472 151 C472 170 462 188 440 196 Z"/>
  <g class="motor-fins">
    <rect x="363" y="109" width="5" height="86" rx="2"/>
    <rect x="374" y="106" width="5" height="92" rx="2"/>
    <rect x="385" y="105" width="5" height="94" rx="2"/>
    <rect x="396" y="105" width="5" height="94" rx="2"/>
    <rect x="407" y="105" width="5" height="94" rx="2"/>
    <rect x="418" y="106" width="5" height="92" rx="2"/>
    <rect x="429" y="109" width="5" height="86" rx="2"/>
  </g>
  <rect class="terminal-box" x="377" y="78" width="50" height="28" rx="5"/>
  <rect class="terminal-lid" x="387" y="68" width="30" height="12" rx="3" data-detail="fine"/>
  <path class="foot" d="M365 201 H393 L399 222 H359 Z"/>
  <path class="foot" d="M420 201 H447 L455 222 H413 Z"/>
</g>
`,
});

const assembly: readonly FragmentPlacement[] = [
  { key: 'hydraulic', fragment: hydraulic },
  { key: 'impeller', fragment: impeller },
  { key: 'drive', fragment: drive },
];

export const pumpDefinition = defineElementDefinition({
  tagName: 'pe-pump',
  displayName: 'End-suction centrifugal pump',
  description: 'A horizontal end-suction pump with a volute casing, tangential discharge, rotating shrouded impeller, coupling and motor.',
  viewBox: '0 0 480 280',
  template: svg`<defs>
<linearGradient id="pump-shell" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#48647c"/><stop offset=".5" stop-color="#273f54"/><stop offset="1" stop-color="#132534"/></linearGradient>
<radialGradient id="pump-cavity"><stop stop-color="#173548"/><stop offset=".7" stop-color="#0c1b28"/><stop offset="1" stop-color="#06111b"/></radialGradient>
<linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8196a8"/><stop offset=".4" stop-color="#41586c"/><stop offset="1" stop-color="#1d3042"/></linearGradient>
<linearGradient id="flange" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#758ba0"/><stop offset=".5" stop-color="#364c60"/><stop offset="1" stop-color="#17293a"/></linearGradient>
<linearGradient id="motor" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#405c75"/><stop offset=".52" stop-color="#263e53"/><stop offset="1" stop-color="#152a3b"/></linearGradient>
<linearGradient id="guard" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#42596d"/><stop offset="1" stop-color="#1c2e3e"/></linearGradient>
<linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#eef6fb"/><stop offset=".42" stop-color="#879bad"/><stop offset="1" stop-color="#304659"/></linearGradient>
<radialGradient id="eye"><stop stop-color="#e5fbff"/><stop offset=".28" stop-color="#72d8ff"/><stop offset="1" stop-color="#166f9b"/></radialGradient>
<filter id="cyan-glow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="0" stdDeviation="2.1" flood-color="#42caff" flood-opacity=".65"/></filter>
<filter id="green-glow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#56e29a" flood-opacity=".7"/></filter>
<filter id="amber-glow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#ffbe4a" flood-opacity=".65"/></filter>
<filter id="red-glow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#ff5c74" flood-opacity=".72"/></filter>
</defs>

<g data-mount="assembly"/>
<g class="tag-panel" transform="translate(122 234)" data-part="tag-panel">
  <rect class="tag-plate" width="253" height="34" rx="7" data-detail="standard"/>
  <rect class="status-strip" width="4" height="34" rx="2" data-detail="standard"/>
  <text class="tag" x="12" y="21" data-detail="standard" data-part="label">P-101</text>
  <text class="meta" x="77" y="20" data-detail="standard" data-part="meta">END-SUCTION · 1450 RPM</text>
  <text class="readout" x="240" y="21" text-anchor="end" data-detail="standard" data-part="readout">6.2 BAR</text>
  <text class="micro" x="77" y="29" data-detail="fine">MECHANICAL / PROCESS PHASE ALIGNED</text>
</g>
`,
  styles: `
:host {
  display: inline-block;
  width: 480px;
  max-width: 100%;
  aspect-ratio: var(--elements-aspect-ratio, 12 / 7);
  color: var(--elements-ink, #dbe7f3);
  container-type: inline-size;
  contain: layout style;
}
svg { width: 100%; height: 100%; overflow: visible; }

.base,.base-rail,.foot{fill:#152637;stroke:#627b90;stroke-width:1.3}.suction,.discharge,.bearing{fill:url(#steel);stroke:#a9bbc9;stroke-width:1.5}.flange{fill:url(#flange);stroke:#c0ccd6;stroke-width:1.7}.bolt{fill:#263a4d;stroke:#bbc9d4;stroke-width:.7}.shell{fill:url(#pump-shell);stroke:#9fb4c6;stroke-width:2;transform-box:fill-box;transform-origin:center}.shell-highlight{fill:none;stroke:#fff;stroke-opacity:.13;stroke-width:1.1}.cavity{fill:url(#pump-cavity);stroke:#6f8aa1;stroke-width:1.6}.inspection{fill:#071521;stroke:#65839a;stroke-width:1.5}.inspection-ring{fill:none;stroke:#9db4c6;stroke-opacity:.45;stroke-width:1}.flow-under{fill:none;stroke:#082332;stroke-width:7;stroke-linecap:round;stroke-linejoin:round}.flow-path{fill:none;stroke:var(--elements-process-flow,#58d9ff);stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:14 12;opacity:.12;filter:url(#cyan-glow);transition:opacity 180ms ease}.rotor{transform-box:fill-box;transform-origin:center;opacity:.68}.impeller-shroud{fill:#15374c;stroke:#4daed2;stroke-width:1.2}.vane{fill:none;stroke:#5ed2ff;stroke-width:5.1;stroke-linecap:round;filter:url(#cyan-glow);opacity:.9}.eye{fill:url(#eye);stroke:#d1f4ff;stroke-width:1.1}.shaft{fill:url(#shaft);stroke:#c8d4dd;stroke-width:1}.coupling{transform-box:fill-box;transform-origin:center;opacity:.72}.coupling-rim{fill:url(#steel);stroke:#c0ced9;stroke-width:1.2}.coupling-hub{fill:#071521;stroke:#7390a5;stroke-width:1}.coupling-mark{fill:none;stroke:#9db3c4;stroke-width:1.2}.guard{fill:url(#guard);stroke:#8ca2b5;stroke-width:1.4}.guard-vents circle{fill:#091622}.motor-group{transform-box:fill-box;transform-origin:center}.motor-shell{fill:url(#motor);stroke:#93a9bc;stroke-width:1.8}.motor-end{fill:#203449;stroke:#7890a5;stroke-width:1.3}.motor-fins rect{fill:#2a4054;stroke:#6f879a;stroke-width:.75}.terminal-box,.terminal-lid{fill:#142638;stroke:#748da3;stroke-width:1.2}.status-beacon{transform-box:fill-box;transform-origin:center}.status-halo{fill:none;stroke:#56e29a;stroke-width:2;opacity:.76;filter:url(#green-glow)}.status-dot,.status-strip{fill:#56e29a;filter:url(#green-glow)}.tag-plate{fill:#07121e;stroke:#4e6579;stroke-width:1}.tag{fill:#edf4fa;font:700 15px/1 ui-monospace,monospace;letter-spacing:.08em}.meta{fill:#72889d;font:600 8px/1 ui-monospace,monospace;letter-spacing:.11em}.readout{fill:#71d8ff;font:700 11px/1 ui-monospace,monospace}.micro{fill:#6d8397;font:600 7px/1 ui-monospace,monospace;letter-spacing:.08em}

:host([data-state~="running"]) .flow-path{opacity:.96}:host([data-state~="running"]) .rotor,:host([data-state~="running"]) .coupling{opacity:1}
:host([data-state~="warning"]) .status-halo{stroke:var(--elements-warning,#ffbe4a);filter:url(#amber-glow)}:host([data-state~="warning"]) .status-dot,:host([data-state~="warning"]) .status-strip{fill:var(--elements-warning,#ffbe4a);filter:url(#amber-glow)}
:host([data-state~="alarm"]) .status-halo{stroke:var(--elements-alarm,#ff5c74);filter:url(#red-glow)}:host([data-state~="alarm"]) .status-dot,:host([data-state~="alarm"]) .status-strip{fill:var(--elements-alarm,#ff5c74);filter:url(#red-glow)}:host([data-state~="alarm"]) .shell{stroke:var(--elements-alarm,#ff5c74)}
:host([data-state~="bad-quality"]) svg{opacity:.42;filter:grayscale(1)}:host([data-state~="stale"]) svg{opacity:.64;filter:saturate(.35)}
:host([detail="compact"]) [data-detail="fine"],:host([detail="symbol"]) [data-detail]{display:none}:host([detail="symbol"]) text{display:none}
@container (max-width: 460px){[data-detail="fine"]{display:none}}
@container (max-width: 300px){[data-detail="standard"]{display:none}.flow-path{stroke-width:4.5}.status-halo{stroke-width:3}.shell{stroke-width:2.6}}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'P-101', description: 'Equipment label.' }),
    running: attribute.boolean('running', { description: 'Whether the pump is commanded to run.' }),
    speed: attribute.number('speed', { defaultValue: 0, cssVariable: '--pump-speed', description: 'Shaft speed in rpm.' }),
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
    bind.text('meta', (context) => `END-SUCTION · ${Math.round(numberValue(context, 'speed'))} RPM`, ['speed']),
  ],
  motions: [
    {
      id: 'rotor-spin',
      type: 'loop',
      target: 'rotor',
      active: (context) => stateValue(context, 'running'),
      playbackRate: (context) => Math.max(.08, numberValue(context, 'speed') / 1450),
      phase: 'process-mechanical',
      keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      options: { duration: 1350, iterations: Infinity, easing: 'linear' },
      reducedMotion: 'freeze',
    },
    {
      id: 'coupling-spin',
      type: 'loop',
      target: 'coupling',
      active: (context) => stateValue(context, 'running'),
      playbackRate: (context) => Math.max(.08, numberValue(context, 'speed') / 1450),
      phase: 'process-mechanical',
      keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      options: { duration: 1350, iterations: Infinity, easing: 'linear' },
      reducedMotion: 'freeze',
    },
    {
      id: 'process-flow',
      type: 'loop',
      target: 'flow-path',
      active: (context) => stateValue(context, 'running'),
      playbackRate: (context) => Math.max(.12, numberValue(context, 'speed') / 1450),
      phase: 'process-flow',
      keyframes: [{ strokeDashoffset: 0 }, { strokeDashoffset: -26 }],
      options: { duration: 1050, iterations: Infinity, easing: 'linear' },
      reducedMotion: 'freeze',
    },
    {
      id: 'motor-hum',
      type: 'loop',
      target: 'motor-group',
      active: (context) => stateValue(context, 'running'),
      playbackRate: (context) => Math.max(.2, numberValue(context, 'speed') / 1450),
      keyframes: [{ transform: 'translateY(-0.12px)' }, { transform: 'translateY(0.12px)' }],
      options: { duration: 120, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' },
      reducedMotion: 'freeze',
    },
    {
      id: 'start-beacon',
      type: 'transition',
      target: 'status-beacon',
      trigger: (context) => stateValue(context, 'running'),
      enabled: (context) => stateValue(context, 'running'),
      keyframes: [{ transform: 'scale(.82)', opacity: .35 }, { transform: 'scale(1.28)', opacity: 1 }, { transform: 'scale(1)', opacity: 1 }],
      options: { duration: 360, easing: 'cubic-bezier(.2,.9,.25,1)' },
      reducedMotion: 'finish',
    },
    {
      id: 'alarm-pulse',
      type: 'loop',
      target: 'status-halo',
      active: (context) => stateValue(context, 'alarm'),
      keyframes: [{ opacity: .3 }, { opacity: 1 }, { opacity: .3 }],
      options: { duration: 760, iterations: Infinity, easing: 'ease-in-out' },
      reducedMotion: 'finish',
    },
  ],
  ports: [
    { id: 'in', x: 8, y: 151, direction: 'left', kind: 'process' },
    { id: 'out', x: 301, y: 24, direction: 'top', kind: 'process' },
    { id: 'power', x: 472, y: 151, direction: 'right', kind: 'electrical' },
  ],
  parts: [
    { name: 'housing', description: 'Volute casing.', detail: 'essential' },
    { name: 'rotor', description: 'Shrouded impeller with backward-curved vanes.', detail: 'essential' },
    { name: 'coupling', description: 'Shaft coupling aligned to the impeller timeline.', detail: 'essential' },
    { name: 'motor-group', description: 'Electric motor assembly.', detail: 'essential' },
    { name: 'flow-path', description: 'Animated internal process path from suction to discharge.', detail: 'essential' },
    { name: 'status-beacon', description: 'Compact process-state beacon.', detail: 'essential' },
    { name: 'status-halo', description: 'Alarm and warning pulse ring.', detail: 'essential' },
    { name: 'label', detail: 'standard' },
    { name: 'readout', detail: 'standard' },
    { name: 'meta', detail: 'standard' },
  ],
});
