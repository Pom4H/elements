import {
  attribute,
  bind,
  defineElementDefinition,
  defineFragment,
  svg,
  type FragmentPlacement,
} from '@pom4h/elements-core';
import { booleanValue, numberValue, stateValue, stringValue } from '../shared.js';

const geometry = Object.freeze({
  centerX: 174,
  centerY: 150,
  casingRadius: 82,
  cavityRadius: 58,
  windowRadius: 49,
  windowRingRadius: 54,
  statusRingRadius: 64,
  impellerRadius: 38,
  eyeRadius: 10,
  suctionPortX: 8,
  dischargePortX: 302,
  dischargePortY: 42,
  powerPortX: 488,
  flowCycle: 26,
});

function impellerVanes(count = 6): string {
  return Array.from({ length: count }, (_, index) => (
    `<path class="vane" d="M8 -4 C20 -10 29 -20 31 -31" transform="rotate(${index * (360 / count)})"/>`
  )).join('');
}

const hydraulic = defineFragment({
  name: 'pump-hydraulic',
  template: svg`
<path class="base" d="M78 231 H482 L494 252 H64 Z"/>
<rect class="base-rail" x="79" y="252" width="400" height="10" rx="4"/>

<g data-part="process-body">
  <path class="suction" d="M20 136 H92 V164 H20 Z"/>
  <rect class="flange" x="8" y="127" width="18" height="46" rx="3"/>
  <circle class="bolt" cx="17" cy="136" r="2" data-detail="fine"/>
  <circle class="bolt" cx="17" cy="164" r="2" data-detail="fine"/>

  <circle
    class="volute"
    data-part="housing"
    cx="${geometry.centerX}"
    cy="${geometry.centerY}"
    r="${geometry.casingRadius}"
  />
  <path
    class="outlet-neck"
    d="M219 81 C250 91 273 114 282 144 H302 V61 H338 V99 H322 V163 H280 C273 191 251 216 221 228 L212 210 C239 199 256 178 259 153 C262 126 245 99 219 81 Z"
  />
  <rect class="flange" x="294" y="42" width="52" height="20" rx="3"/>
  <circle class="bolt" cx="303" cy="52" r="2" data-detail="fine"/>
  <circle class="bolt" cx="337" cy="52" r="2" data-detail="fine"/>

  <circle
    class="cavity"
    cx="${geometry.centerX}"
    cy="${geometry.centerY}"
    r="${geometry.cavityRadius}"
  />
  <circle
    class="window"
    data-part="inspection-window"
    cx="${geometry.centerX}"
    cy="${geometry.centerY}"
    r="${geometry.windowRadius}"
  />
  <circle
    class="window-ring"
    cx="${geometry.centerX}"
    cy="${geometry.centerY}"
    r="${geometry.windowRingRadius}"
    data-detail="fine"
  />
  <circle
    class="status-ring"
    data-part="status-ring"
    cx="${geometry.centerX}"
    cy="${geometry.centerY}"
    r="${geometry.statusRingRadius}"
  />

  <path
    class="flow-under"
    d="M8 150 H139 C157 150 166 150 174 150 C205 149 226 132 239 108 C251 87 271 78 302 78 V42"
  />
  <path
    class="flow-path"
    data-part="flow-path"
    d="M8 150 H139 C157 150 166 150 174 150 C205 149 226 132 239 108 C251 87 271 78 302 78 V42"
  />
</g>

<path class="foot" d="M126 232 L134 213 H166 L173 232 Z"/>
<path class="foot" d="M218 232 L226 214 H258 L265 232 Z"/>
`,
});

const impeller = defineFragment({
  name: 'pump-impeller',
  template: svg`
<g transform="translate(${geometry.centerX} ${geometry.centerY})">
  <g class="rotor" data-part="rotor">
    <circle class="impeller-shroud" r="${geometry.impellerRadius}"/>
    ${impellerVanes()}
    <circle class="eye" r="${geometry.eyeRadius}"/>
  </g>
</g>
`,
});

const drive = defineFragment({
  name: 'pump-drive',
  template: svg`
<path class="bearing" d="M250 133 H294 V167 H250 C258 157 258 143 250 133 Z"/>
<rect class="shaft" x="286" y="144" width="40" height="12" rx="4" data-part="shaft"/>

<g transform="translate(326 150)">
  <g class="coupling" data-part="coupling">
    <circle class="coupling-rim" r="13"/>
    <circle class="coupling-hub" r="6"/>
    <path class="coupling-mark" d="M-9 0 H9 M0 -9 V9"/>
  </g>
</g>

<path class="guard" d="M310 125 H356 Q367 125 367 138 V162 Q367 175 356 175 H310 Z"/>
<g class="guard-vents" data-detail="fine">
  <circle cx="326" cy="138" r="2.4"/><circle cx="341" cy="138" r="2.4"/><circle cx="356" cy="138" r="2.4"/>
  <circle cx="326" cy="150" r="2.4"/><circle cx="341" cy="150" r="2.4"/><circle cx="356" cy="150" r="2.4"/>
  <circle cx="326" cy="162" r="2.4"/><circle cx="341" cy="162" r="2.4"/><circle cx="356" cy="162" r="2.4"/>
</g>

<g class="motor-group" data-part="motor-group">
  <rect class="motor-shell" x="357" y="99" width="111" height="102" rx="20"/>
  <path class="motor-end" d="M453 107 C478 121 488 137 488 150 C488 169 478 188 453 196 Z"/>
  <g class="motor-fins">
    <rect x="370" y="105" width="5" height="90" rx="2"/>
    <rect x="382" y="103" width="5" height="94" rx="2"/>
    <rect x="394" y="102" width="5" height="96" rx="2"/>
    <rect x="406" y="102" width="5" height="96" rx="2"/>
    <rect x="418" y="102" width="5" height="96" rx="2"/>
    <rect x="430" y="103" width="5" height="94" rx="2"/>
    <rect x="442" y="105" width="5" height="90" rx="2"/>
  </g>
  <rect class="terminal-box" x="386" y="73" width="51" height="27" rx="5"/>
  <rect class="terminal-lid" x="396" y="63" width="31" height="12" rx="3" data-detail="fine"/>
  <path class="foot" d="M371 202 H401 L408 232 H363 Z"/>
  <path class="foot" d="M429 202 H458 L467 232 H420 Z"/>
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
  description: 'A horizontal end-suction pump with concentric inspection geometry, a tangential discharge, a shrouded impeller, coupling and motor.',
  viewBox: '0 0 520 300',
  template: svg`<defs>
<linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8196a8"/><stop offset=".4" stop-color="#41586c"/><stop offset="1" stop-color="#1d3042"/></linearGradient>
<linearGradient id="flange" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#758ba0"/><stop offset=".5" stop-color="#364c60"/><stop offset="1" stop-color="#17293a"/></linearGradient>
<linearGradient id="motor" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#405c75"/><stop offset=".52" stop-color="#263e53"/><stop offset="1" stop-color="#152a3b"/></linearGradient>
<linearGradient id="guard" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#42596d"/><stop offset="1" stop-color="#1c2e3e"/></linearGradient>
<linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#eef6fb"/><stop offset=".42" stop-color="#879bad"/><stop offset="1" stop-color="#304659"/></linearGradient>
<radialGradient id="cavity"><stop stop-color="#173548"/><stop offset=".7" stop-color="#0c1b28"/><stop offset="1" stop-color="#06111b"/></radialGradient>
<radialGradient id="eye"><stop stop-color="#e5fbff"/><stop offset=".28" stop-color="#72d8ff"/><stop offset="1" stop-color="#166f9b"/></radialGradient>
<filter id="cyan-glow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="0" stdDeviation="1.7" flood-color="#42caff" flood-opacity=".55"/></filter>
<filter id="green-glow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="0" stdDeviation="2.4" flood-color="#56e29a" flood-opacity=".55"/></filter>
<filter id="amber-glow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="0" stdDeviation="2.4" flood-color="#ffbe4a" flood-opacity=".55"/></filter>
<filter id="red-glow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="0" stdDeviation="2.4" flood-color="#ff5c74" flood-opacity=".62"/></filter>
</defs>

<g data-mount="assembly"/>
<g class="tag-panel" transform="translate(85 266)" data-part="tag-panel">
  <rect class="tag-plate" width="350" height="30" rx="7" data-detail="standard"/>
  <rect class="status-strip" data-part="status-strip" width="5" height="30" rx="2" data-detail="standard"/>
  <text class="tag" x="15" y="20" data-detail="standard" data-part="label">P-101</text>
  <text class="meta" x="92" y="19" data-detail="standard" data-part="meta">END-SUCTION · 1450 RPM</text>
  <text class="readout" x="335" y="20" text-anchor="end" data-detail="standard" data-part="readout">6.2 BAR</text>
</g>
`,
  styles: `
:host {
  display: inline-block;
  width: 520px;
  max-width: 100%;
  aspect-ratio: var(--elements-aspect-ratio, 26 / 15);
  color: var(--elements-ink, #dbe7f3);
  container-type: inline-size;
  contain: layout style;
}
svg { width: 100%; height: 100%; overflow: visible; }

.base,.base-rail,.foot{fill:#152637;stroke:#627b90;stroke-width:1.3}.suction,.outlet-neck,.bearing{fill:url(#steel);stroke:#a9bbc9;stroke-width:1.7}.flange{fill:url(#flange);stroke:#c7d4de;stroke-width:1.7}.bolt{fill:#263a4d;stroke:#bbc9d4;stroke-width:.7}.volute{fill:url(#steel);stroke:#a9bbc9;stroke-width:2}.cavity{fill:url(#cavity);stroke:#7893a8;stroke-width:1.6}.window{fill:#071521;stroke:#b7cad8;stroke-width:2}.window-ring{fill:none;stroke:#5e7d94;stroke-width:1.2}.status-ring{fill:none;stroke:#58e39a;stroke-width:2.2;opacity:.78;filter:url(#green-glow)}.flow-under{fill:none;stroke:#072331;stroke-width:8;stroke-linecap:round;stroke-linejoin:round}.flow-path{fill:none;stroke:var(--elements-process-flow,#58d9ff);stroke-width:3.6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:14 12;opacity:.12;filter:url(#cyan-glow);transition:opacity 180ms ease}.rotor{transform-box:fill-box;transform-origin:center;opacity:.7}.impeller-shroud{fill:#11354a;stroke:#54bfe6;stroke-width:1.2}.vane{fill:none;stroke:#62d4ff;stroke-width:5;stroke-linecap:round;filter:url(#cyan-glow);opacity:.92}.eye{fill:url(#eye);stroke:#d8f7ff;stroke-width:1.1}.shaft{fill:url(#shaft);stroke:#d0dae2;stroke-width:1}.coupling{transform-box:fill-box;transform-origin:center;opacity:.75}.coupling-rim{fill:url(#steel);stroke:#c7d4de;stroke-width:1.1}.coupling-hub{fill:#071521;stroke:#7893a8;stroke-width:1}.coupling-mark{fill:none;stroke:#a6bac8;stroke-width:1.1}.guard{fill:url(#guard);stroke:#8ca2b5;stroke-width:1.4}.guard-vents circle{fill:#091622}.motor-group{transform-box:fill-box;transform-origin:center}.motor-shell{fill:url(#motor);stroke:#93a9bc;stroke-width:1.8}.motor-end{fill:#203449;stroke:#7890a5;stroke-width:1.3}.motor-fins rect{fill:#2a4054;stroke:#6f879a;stroke-width:.75}.terminal-box,.terminal-lid{fill:#142638;stroke:#748da3;stroke-width:1.2}.tag-plate{fill:#07121e;stroke:#4e6579;stroke-width:1}.status-strip{fill:#58e39a;filter:url(#green-glow)}.tag{fill:#edf4fa;font:700 16px/1 ui-monospace,monospace;letter-spacing:.07em}.meta{fill:#72889d;font:600 8px/1 ui-monospace,monospace;letter-spacing:.1em}.readout{fill:#71d8ff;font:700 12px/1 ui-monospace,monospace}

:host([data-state~="running"]) .flow-path{opacity:.96}:host([data-state~="running"]) .rotor,:host([data-state~="running"]) .coupling{opacity:1}
:host([data-state~="warning"]) .status-ring{stroke:var(--elements-warning,#ffbe4a);filter:url(#amber-glow)}:host([data-state~="warning"]) .status-strip{fill:var(--elements-warning,#ffbe4a);filter:url(#amber-glow)}
:host([data-state~="alarm"]) .status-ring{stroke:var(--elements-alarm,#ff5c74);filter:url(#red-glow)}:host([data-state~="alarm"]) .status-strip{fill:var(--elements-alarm,#ff5c74);filter:url(#red-glow)}:host([data-state~="alarm"]) .volute{stroke:var(--elements-alarm,#ff5c74)}
:host([data-state~="bad-quality"]) svg{opacity:.42;filter:grayscale(1)}:host([data-state~="stale"]) svg{opacity:.64;filter:saturate(.35)}
:host([detail="compact"]) [data-detail="fine"],:host([detail="symbol"]) [data-detail]{display:none}:host([detail="symbol"]) text{display:none}
@container (max-width: 460px){[data-detail="fine"]{display:none}}
@container (max-width: 300px){[data-detail="standard"]{display:none}.flow-path{stroke-width:4.5}.status-ring{stroke-width:3}.volute{stroke-width:2.6}}
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
      keyframes: [{ strokeDashoffset: 0 }, { strokeDashoffset: -geometry.flowCycle }],
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
      id: 'start-status',
      type: 'transition',
      target: 'status-strip',
      trigger: (context) => stateValue(context, 'running'),
      enabled: (context) => stateValue(context, 'running'),
      keyframes: [{ opacity: .25 }, { opacity: 1 }, { opacity: .72 }, { opacity: 1 }],
      options: { duration: 360, easing: 'ease-out' },
      reducedMotion: 'finish',
    },
    {
      id: 'alarm-pulse',
      type: 'loop',
      target: 'status-ring',
      active: (context) => stateValue(context, 'alarm'),
      keyframes: [{ opacity: .28 }, { opacity: 1 }, { opacity: .28 }],
      options: { duration: 760, iterations: Infinity, easing: 'ease-in-out' },
      reducedMotion: 'finish',
    },
  ],
  ports: [
    { id: 'in', x: geometry.suctionPortX, y: geometry.centerY, direction: 'left', kind: 'process' },
    { id: 'out', x: geometry.dischargePortX, y: geometry.dischargePortY, direction: 'top', kind: 'process' },
    { id: 'power', x: geometry.powerPortX, y: geometry.centerY, direction: 'right', kind: 'electrical' },
  ],
  parts: [
    { name: 'housing', description: 'Circular volute casing body.', detail: 'essential' },
    { name: 'inspection-window', description: 'True circular inspection window concentric with the impeller.', detail: 'essential' },
    { name: 'rotor', description: 'Shrouded impeller with six curved vanes.', detail: 'essential' },
    { name: 'coupling', description: 'Shaft coupling aligned to the impeller timeline.', detail: 'essential' },
    { name: 'motor-group', description: 'Electric motor assembly.', detail: 'essential' },
    { name: 'flow-path', description: 'Animated internal process path from suction to discharge.', detail: 'essential' },
    { name: 'status-ring', description: 'Concentric process-state ring.', detail: 'essential' },
    { name: 'status-strip', description: 'Status indicator in the equipment tag.', detail: 'standard' },
    { name: 'label', detail: 'standard' },
    { name: 'readout', detail: 'standard' },
    { name: 'meta', detail: 'standard' },
  ],
});
