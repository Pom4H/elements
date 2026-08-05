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
  centerX: 160,
  centerY: 145,
  casingRadius: 78,
  cavityRadius: 57,
  windowRadius: 48,
  statusRingRadius: 64,
  impellerRadius: 36,
  eyeRadius: 10,
  suctionPortX: 10,
  dischargePortX: 273,
  dischargePortY: 31,
  powerPortX: 474,
});

function impellerVanes(count = 5): string {
  return Array.from({ length: count }, (_, index) => (
    `<g transform="rotate(${index * (360 / count)})">
      <path class="vane" d="M8 -5 C20 -27 40 -43 62 -44 C58 -26 48 -9 31 7 C19 18 7 20 -2 12 C-7 7 -5 1 8 -5 Z"/>
      <path class="vane-highlight" d="M13 -5 C26 -22 40 -31 52 -32"/>
    </g>`
  )).join('');
}

const hydraulic = defineFragment({
  name: 'pump-hydraulic',
  template: svg`
<path class="base" d="M72 226 H458 L472 251 H58 Z"/>
<rect class="base-rail" x="74" y="250" width="392" height="10" rx="4"/>

<g data-part="process-body">
  <path class="suction-nozzle" d="M24 132 H88 V158 H24 Z"/>
  <rect class="flange" x="10" y="123" width="20" height="44" rx="3"/>
  <circle class="bolt" cx="20" cy="132" r="2" data-detail="fine"/>
  <circle class="bolt" cx="20" cy="158" r="2" data-detail="fine"/>

  <circle class="casing" data-part="housing" cx="${geometry.centerX}" cy="${geometry.centerY}" r="${geometry.casingRadius}"/>
  <path class="discharge-neck" d="M183 72 H248 Q266 72 266 90 V121 H246 V98 H198 Z"/>
  <path class="discharge-nozzle" d="M246 98 H285 V72 H304 V119 H266 V145 H246 Z"/>
  <rect class="flange" x="263" y="21" width="58" height="20" rx="3"/>
  <path class="discharge-riser" d="M273 40 H311 V98 H273 Z"/>
  <circle class="bolt" cx="273" cy="31" r="2" data-detail="fine"/>
  <circle class="bolt" cx="311" cy="31" r="2" data-detail="fine"/>

  <circle class="cavity" cx="${geometry.centerX}" cy="${geometry.centerY}" r="${geometry.cavityRadius}"/>
  <circle class="inspection-window" data-part="inspection-window" cx="${geometry.centerX}" cy="${geometry.centerY}" r="${geometry.windowRadius}"/>
  <circle class="window-ring" cx="${geometry.centerX}" cy="${geometry.centerY}" r="53" data-detail="fine"/>
  <circle class="status-ring" data-part="status-ring" cx="${geometry.centerX}" cy="${geometry.centerY}" r="${geometry.statusRingRadius}"/>

  <path class="volute-accent" d="M202 99 C229 112 241 138 237 166" data-detail="fine"/>
  <path class="cutwater" d="M210 99 C235 82 250 62 257 40" data-detail="fine"/>
</g>

<path class="foot" d="M111 226 L122 205 H153 L161 226 Z"/>
<path class="foot" d="M199 226 L210 207 H240 L249 226 Z"/>
`,
});

const impeller = defineFragment({
  name: 'pump-impeller',
  template: svg`
<g transform="translate(${geometry.centerX} ${geometry.centerY})">
  <g class="rotor" data-part="rotor">
    <circle class="impeller-shroud" r="${geometry.impellerRadius}"/>
    ${impellerVanes()}
    <circle class="eye-ring" r="19"/>
    <circle class="eye" r="${geometry.eyeRadius}"/>
  </g>
</g>
`,
});

const drive = defineFragment({
  name: 'pump-drive',
  template: svg`
<path class="bearing" d="M232 129 H283 V161 H232 C240 151 240 139 232 129 Z"/>
<rect class="shaft" x="273" y="139" width="44" height="12" rx="4" data-part="shaft"/>

<g transform="translate(319 145)">
  <g class="coupling" data-part="coupling">
    <circle class="coupling-rim" r="13"/>
    <circle class="coupling-hub" r="6"/>
    <path class="coupling-mark" d="M-9 0 H9 M0 -9 V9"/>
  </g>
</g>

<path class="guard" d="M302 119 H355 Q368 119 368 133 V157 Q368 171 355 171 H302 Z"/>
<g class="guard-vents" data-detail="fine">
  <circle cx="320" cy="132" r="2.4"/><circle cx="337" cy="132" r="2.4"/><circle cx="354" cy="132" r="2.4"/>
  <circle cx="320" cy="145" r="2.4"/><circle cx="337" cy="145" r="2.4"/><circle cx="354" cy="145" r="2.4"/>
  <circle cx="320" cy="158" r="2.4"/><circle cx="337" cy="158" r="2.4"/><circle cx="354" cy="158" r="2.4"/>
</g>

<g class="motor-group" data-part="motor-group">
  <rect class="motor-shell" x="357" y="94" width="110" height="102" rx="20"/>
  <path class="motor-end" d="M452 102 C478 117 488 132 488 145 C488 164 478 184 452 191 Z"/>
  <g class="motor-fins">
    <rect x="370" y="100" width="5" height="90" rx="2"/>
    <rect x="383" y="98" width="5" height="94" rx="2"/>
    <rect x="396" y="97" width="5" height="96" rx="2"/>
    <rect x="409" y="97" width="5" height="96" rx="2"/>
    <rect x="422" y="98" width="5" height="94" rx="2"/>
    <rect x="435" y="100" width="5" height="90" rx="2"/>
  </g>
  <rect class="terminal-box" x="386" y="68" width="52" height="27" rx="5"/>
  <rect class="terminal-lid" x="397" y="58" width="30" height="12" rx="3" data-detail="fine"/>
  <path class="foot" d="M370 196 H400 L408 226 H362 Z"/>
  <path class="foot" d="M428 196 H457 L466 226 H419 Z"/>
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
  description: 'A horizontal end-suction pump with short equipment nozzles. The scene owns all external process piping and flow animation.',
  viewBox: '0 0 510 290',
  template: svg`<defs>
<linearGradient id="pump-shell" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#506b82"/><stop offset=".5" stop-color="#2c4357"/><stop offset="1" stop-color="#172a3a"/></linearGradient>
<radialGradient id="pump-cavity"><stop stop-color="#15364d"/><stop offset=".72" stop-color="#0a1c2b"/><stop offset="1" stop-color="#06121d"/></radialGradient>
<linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8196a8"/><stop offset=".42" stop-color="#41586c"/><stop offset="1" stop-color="#1d3042"/></linearGradient>
<linearGradient id="motor" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#405c75"/><stop offset=".52" stop-color="#263e53"/><stop offset="1" stop-color="#152a3b"/></linearGradient>
<linearGradient id="guard" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#42596d"/><stop offset="1" stop-color="#1c2e3e"/></linearGradient>
<linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#eef6fb"/><stop offset=".42" stop-color="#879bad"/><stop offset="1" stop-color="#304659"/></linearGradient>
<radialGradient id="eye"><stop stop-color="#e5fbff"/><stop offset=".28" stop-color="#72d8ff"/><stop offset="1" stop-color="#166f9b"/></radialGradient>
<filter id="cyan-glow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="0" stdDeviation="2.1" flood-color="#42caff" flood-opacity=".62"/></filter>
<filter id="green-glow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#56e29a" flood-opacity=".66"/></filter>
<filter id="amber-glow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#ffbe4a" flood-opacity=".62"/></filter>
<filter id="red-glow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="0" stdDeviation="2.8" flood-color="#ff5c74" flood-opacity=".7"/></filter>
</defs>

<g data-mount="assembly"/>
<g class="tag-panel" transform="translate(118 238)" data-part="tag-panel">
  <rect class="tag-plate" width="266" height="35" rx="7" data-detail="standard"/>
  <rect class="status-strip" data-part="status-strip" width="5" height="35" rx="2.5" data-detail="standard"/>
  <text class="tag" x="16" y="22" data-detail="standard" data-part="label">P-101</text>
  <text class="meta" x="86" y="21" data-detail="standard" data-part="meta">END-SUCTION · 1450 RPM</text>
  <text class="readout" x="253" y="22" text-anchor="end" data-detail="standard" data-part="readout">6.2 BAR</text>
</g>
`,
  styles: `
:host{display:inline-block;width:510px;max-width:100%;aspect-ratio:51/29;color:var(--elements-ink,#dbe7f3);container-type:inline-size;contain:layout style}svg{width:100%;height:100%;overflow:visible}
.base,.base-rail,.foot{fill:#152637;stroke:#627b90;stroke-width:1.3}.suction-nozzle,.discharge-neck,.discharge-nozzle,.discharge-riser,.bearing{fill:url(#steel);stroke:#a9bbc9;stroke-width:1.5}.flange{fill:url(#steel);stroke:#c0ccd6;stroke-width:1.7}.bolt{fill:#263a4d;stroke:#bbc9d4;stroke-width:.7}.casing{fill:url(#pump-shell);stroke:#a7bac9;stroke-width:2.2}.cavity{fill:url(#pump-cavity);stroke:#708ba1;stroke-width:1.5}.inspection-window{fill:#071521;stroke:#6d8aa1;stroke-width:1.5}.window-ring{fill:none;stroke:#9db4c6;stroke-opacity:.42;stroke-width:1}.status-ring{fill:none;stroke:#56e29a;stroke-width:2.5;opacity:.76;filter:url(#green-glow)}.volute-accent{fill:none;stroke:#5ed2ff;stroke-opacity:.2;stroke-width:7;stroke-linecap:round}.cutwater{fill:none;stroke:#8adfff;stroke-opacity:.45;stroke-width:3;stroke-linecap:round}.rotor{transform-box:fill-box;transform-origin:center;opacity:.72}.impeller-shroud{fill:#102d43;stroke:#45a8ce;stroke-width:1.2}.vane{fill:#42c9f2;fill-opacity:.24;stroke:#5ed2ff;stroke-width:1.8}.vane-highlight{fill:none;stroke:#b8f3ff;stroke-opacity:.74;stroke-width:1.2}.eye-ring{fill:none;stroke:#50d2ff;stroke-opacity:.4;stroke-width:2}.eye{fill:url(#eye);stroke:#d1f4ff;stroke-width:1.1}.shaft{fill:url(#shaft);stroke:#c8d4dd;stroke-width:1}.coupling{transform-box:fill-box;transform-origin:center;opacity:.75}.coupling-rim{fill:url(#steel);stroke:#c0ced9;stroke-width:1.2}.coupling-hub{fill:#071521;stroke:#7390a5;stroke-width:1}.coupling-mark{fill:none;stroke:#8edfff;stroke-width:1.3}.guard{fill:url(#guard);stroke:#8ca2b5;stroke-width:1.4}.guard-vents circle{fill:#091622}.motor-group{transform-box:fill-box;transform-origin:center}.motor-shell{fill:url(#motor);stroke:#93a9bc;stroke-width:1.8}.motor-end{fill:#203449;stroke:#7890a5;stroke-width:1.3}.motor-fins rect{fill:#2a4054;stroke:#6f879a;stroke-width:.75}.terminal-box,.terminal-lid{fill:#142638;stroke:#748da3;stroke-width:1.2}.tag-plate{fill:#07121e;stroke:#4e6579;stroke-width:1}.status-strip{fill:#56e29a;filter:url(#green-glow)}.tag{fill:#edf4fa;font:700 14px/1 ui-monospace,monospace;letter-spacing:.08em}.meta{fill:#72889d;font:600 7px/1 ui-monospace,monospace;letter-spacing:.09em}.readout{fill:#71d8ff;font:700 10px/1 ui-monospace,monospace}
:host([data-state~="running"]) .rotor,:host([data-state~="running"]) .coupling{opacity:1}:host([data-state~="warning"]) .status-ring{stroke:var(--elements-warning,#ffbe4a);filter:url(#amber-glow)}:host([data-state~="warning"]) .status-strip{fill:var(--elements-warning,#ffbe4a);filter:url(#amber-glow)}:host([data-state~="alarm"]) .status-ring{stroke:var(--elements-alarm,#ff5c74);filter:url(#red-glow)}:host([data-state~="alarm"]) .status-strip{fill:var(--elements-alarm,#ff5c74);filter:url(#red-glow)}:host([data-state~="alarm"]) .casing{stroke:var(--elements-alarm,#ff5c74)}:host([data-state~="bad-quality"]) svg{opacity:.42;filter:grayscale(1)}:host([data-state~="stale"]) svg{opacity:.64;filter:saturate(.35)}:host([detail="compact"]) [data-detail="fine"],:host([detail="symbol"]) [data-detail]{display:none}:host([detail="symbol"]) text{display:none}@container(max-width:460px){[data-detail="fine"]{display:none}}@container(max-width:300px){[data-detail="standard"]{display:none}.status-ring{stroke-width:3.5}.casing{stroke-width:2.8}}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'P-101', description: 'Equipment label.' }),
    running: attribute.boolean('running', { description: 'Whether the pump is commanded to run.' }),
    speed: attribute.number('speed', { defaultValue: 0, cssVariable: '--pump-speed', description: 'Shaft speed in rpm.' }),
    value: attribute.number('value', { defaultValue: 0, description: 'Primary process value.' }),
    unit: attribute.string('unit', { defaultValue: 'bar', description: 'Primary process value unit.' }),
    status: attribute.enum('status', ['idle', 'normal', 'warning', 'alarm'] as const, { defaultValue: 'idle', description: 'Process status independent from data quality.' }),
    quality: attribute.enum('quality', ['good', 'stale', 'bad'] as const, { defaultValue: 'good', description: 'Telemetry quality independent from process status.' }),
    detail: attribute.enum('detail', ['auto', 'full', 'compact', 'symbol'] as const, { defaultValue: 'auto', description: 'Visual level of detail.' }),
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
      id: 'rotor-spin', type: 'loop', target: 'rotor',
      active: (context) => stateValue(context, 'running'),
      playbackRate: (context) => Math.max(.08, numberValue(context, 'speed') / 1450),
      phase: 'process-mechanical',
      keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      options: { duration: 1350, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze',
    },
    {
      id: 'coupling-spin', type: 'loop', target: 'coupling',
      active: (context) => stateValue(context, 'running'),
      playbackRate: (context) => Math.max(.08, numberValue(context, 'speed') / 1450),
      phase: 'process-mechanical',
      keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      options: { duration: 1350, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze',
    },
    {
      id: 'motor-hum', type: 'loop', target: 'motor-group',
      active: (context) => stateValue(context, 'running'),
      playbackRate: (context) => Math.max(.2, numberValue(context, 'speed') / 1450),
      keyframes: [{ transform: 'translateY(-0.12px)' }, { transform: 'translateY(0.12px)' }],
      options: { duration: 120, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }, reducedMotion: 'freeze',
    },
    {
      id: 'start-status', type: 'transition', target: 'status-strip',
      trigger: (context) => stateValue(context, 'running'), enabled: (context) => stateValue(context, 'running'),
      keyframes: [{ opacity: .25 }, { opacity: 1 }, { opacity: .72 }, { opacity: 1 }],
      options: { duration: 360, easing: 'ease-out' }, reducedMotion: 'finish',
    },
    {
      id: 'alarm-pulse', type: 'loop', target: 'status-ring',
      active: (context) => stateValue(context, 'alarm'),
      keyframes: [{ opacity: .28 }, { opacity: 1 }, { opacity: .28 }],
      options: { duration: 760, iterations: Infinity, easing: 'ease-in-out' }, reducedMotion: 'finish',
    },
  ],
  ports: [
    { id: 'in', x: geometry.suctionPortX, y: geometry.centerY, direction: 'left', kind: 'process' },
    { id: 'out', x: geometry.dischargePortX, y: geometry.dischargePortY, direction: 'top', kind: 'process' },
    { id: 'power', x: geometry.powerPortX, y: geometry.centerY, direction: 'right', kind: 'electrical' },
  ],
  parts: [
    { name: 'housing', description: 'Pump casing. External pipes are scene-owned.', detail: 'essential' },
    { name: 'inspection-window', description: 'Circular impeller inspection window.', detail: 'essential' },
    { name: 'rotor', description: 'Shrouded impeller with curved vanes.', detail: 'essential' },
    { name: 'coupling', description: 'Shaft coupling aligned with the impeller timeline.', detail: 'essential' },
    { name: 'motor-group', description: 'Electric motor assembly.', detail: 'essential' },
    { name: 'status-ring', description: 'Concentric process-state ring.', detail: 'essential' },
    { name: 'status-strip', description: 'Equipment-tag status indicator.', detail: 'standard' },
    { name: 'label', detail: 'standard' },
    { name: 'readout', detail: 'standard' },
    { name: 'meta', detail: 'standard' },
  ],
});
