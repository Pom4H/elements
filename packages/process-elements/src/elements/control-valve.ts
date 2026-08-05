import {
  attribute,
  bind,
  defineElementDefinition,
  defineFragment,
  detailStyles,
  mediumIds,
  mediumStyles,
  ports,
  svg,
  type ElementContext,
  type FragmentPlacement,
  type PortDefinition,
} from '@pom4h/elements-core';
import { booleanValue, clamp, numberValue, stateValue, stringValue } from '../shared.js';

const geometry = Object.freeze({
  centerX: 180,
  /** Vertical stroke of the plug and stem, in user units. */
  stroke: 28,
  /** Travel scale: 0% sits at the bottom, 100% at the top. */
  scaleBottom: 188,
  scaleHeight: 60,
  lineY: 252,
  inletX: 8,
  outletX: 352,
  signalX: 44,
  signalY: 168,
  supplyX: 312,
  supplyY: 96,
  powerY: 70,
});

/** Flow dipping under the seat throat: the S-bend is what makes it read as a globe body. */
const flowChannel = 'M26 252 H110 C134 252 144 266 162 266 H198 C216 266 226 252 250 252 H334';

const body = defineFragment({
  name: 'valve-body',
  template: svg`
<rect class="flange" x="8" y="230" width="18" height="44" rx="3"/>
<rect class="flange" x="334" y="230" width="18" height="44" rx="3"/>
<circle class="bolt" cx="17" cy="238" r="2" data-detail="fine"/>
<circle class="bolt" cx="17" cy="266" r="2" data-detail="fine"/>
<circle class="bolt" cx="343" cy="238" r="2" data-detail="fine"/>
<circle class="bolt" cx="343" cy="266" r="2" data-detail="fine"/>
<rect class="nozzle" x="24" y="238" width="86" height="28"/>
<rect class="nozzle" x="250" y="238" width="86" height="28"/>

<path class="body-shell" data-part="body-shell" d="M104 236 C108 218 132 208 180 208 C228 208 252 218 256 236 V268 C252 286 228 296 180 296 C132 296 108 286 104 268 Z"/>
<path class="body-cavity" d="M114 238 C118 224 138 216 180 216 C222 216 242 224 246 238 V266 C242 280 222 288 180 288 C138 288 118 280 114 266 Z"/>

<g class="channel" data-part="channel">
  <path class="channel-bore" d="${flowChannel}"/>
  <path class="channel-stream" data-part="flow-stream" d="${flowChannel}"/>
</g>

<path class="seat" d="M148 240 H170 L176 264 H148 Z"/>
<path class="seat" d="M212 240 H190 L184 264 H212 Z"/>
<path class="body-web" d="M128 234 C140 248 140 262 130 274 M232 234 C220 248 220 262 230 274" data-detail="fine"/>

<g class="flow-arrows" data-part="flow-arrows" data-detail="standard">
  <path d="M56 246 L70 252 L56 258 Z"/>
  <path d="M290 246 L304 252 L290 258 Z"/>
</g>
`,
});

/**
 * Plug and stem. This whole group is the scrub target, so nothing inside it may
 * carry a competing transform — the shudder lives one level down.
 */
const trim = defineFragment({
  name: 'valve-trim',
  template: svg`
<g data-part="stem-travel">
  <g data-part="stem-shudder">
    <rect class="stem" x="173" y="118" width="14" height="110" rx="2"/>
    <path class="plug" d="M167 220 H193 V238 L184 270 H176 L167 238 Z"/>
    <rect class="plug-guide" x="163" y="224" width="34" height="6" rx="3" data-detail="fine"/>
  </g>
</g>
`,
});

const yoke = defineFragment({
  name: 'valve-yoke',
  template: svg`
<path class="bonnet" d="M146 190 H214 L208 216 H152 Z"/>
<rect class="packing" x="152" y="180" width="56" height="14" rx="3"/>
<rect class="packing-nut" x="160" y="172" width="40" height="10" rx="3" data-detail="fine"/>
<path class="yoke-leg" d="M150 182 L136 124 H150 L162 182 Z"/>
<path class="yoke-leg" d="M210 182 L224 124 H210 L198 182 Z"/>
<rect class="yoke-cap" x="130" y="116" width="100" height="12" rx="4"/>

<g class="scale" data-part="scale" data-detail="standard">
  <rect class="scale-track" x="238" y="126" width="9" height="62" rx="4.5"/>
  <path class="scale-tick" d="M249 128 H258 M249 143 H255 M249 158 H258 M249 173 H255 M249 187 H258" data-detail="fine"/>
  <text class="scale-label" x="262" y="131" data-detail="fine">100</text>
  <text class="scale-label" x="262" y="190" data-detail="fine">0</text>
  <path class="fail-mark" data-part="fail-mark" d="M232 188 L224 183 L224 193 Z"/>
  <g data-part="command-marker">
    <path class="command-mark" d="M236 188 L227 182 V194 Z"/>
  </g>
  <g data-part="position-marker">
    <path class="position-mark" d="M250 188 H268 L262 182 H250 Z"/>
  </g>
</g>

<g class="travel-arrow" data-part="travel-arrow" transform="translate(242 206)">
  <path class="travel-glyph" d="M0 -8 L6 2 H-6 Z"/>
</g>
`,
});

const pneumaticActuator = defineFragment({
  name: 'valve-actuator-pneumatic',
  ports: [{ id: 'supply', x: geometry.supplyX, y: geometry.supplyY, direction: 'right', kind: 'process', role: 'inlet', medium: 'air' }],
  template: svg`
<rect class="supply-tube" x="264" y="91" width="42" height="11" rx="4"/>
<rect class="supply-gland" x="298" y="86" width="14" height="21" rx="3"/>
<path class="diaphragm-dome" d="M92 100 C92 34 268 34 268 100 Z"/>
<path class="dome-highlight" d="M112 88 C118 54 158 44 186 46" data-detail="fine"/>
<rect class="diaphragm-rim" x="86" y="98" width="188" height="14" rx="5"/>
<rect class="diaphragm-case" x="94" y="110" width="172" height="16" rx="5"/>
<g class="case-bolts" data-detail="fine">
  <circle cx="104" cy="105" r="2.6"/><circle cx="134" cy="105" r="2.6"/><circle cx="164" cy="105" r="2.6"/>
  <circle cx="196" cy="105" r="2.6"/><circle cx="226" cy="105" r="2.6"/><circle cx="256" cy="105" r="2.6"/>
</g>
<g data-part="actuator-breath">
  <path class="spring-coil" data-part="spring" d="M158 54 H202 M156 64 H204 M158 74 H202 M156 84 H204" data-detail="fine"/>
</g>
<text class="actuator-mark" x="180" y="95" text-anchor="middle" data-detail="fine">AIR TO MOVE</text>
`,
});

const electricActuator = defineFragment({
  name: 'valve-actuator-electric',
  ports: [{ id: 'power', x: geometry.supplyX, y: geometry.powerY, direction: 'right', kind: 'electrical', role: 'inlet' }],
  template: svg`
<rect class="power-conduit" x="242" y="65" width="58" height="11" rx="4"/>
<rect class="power-gland" x="294" y="60" width="18" height="21" rx="3"/>
<rect class="actuator-case" x="116" y="46" width="128" height="80" rx="10"/>
<rect class="actuator-lid" x="126" y="38" width="108" height="12" rx="5"/>
<rect class="motor-can" x="184" y="14" width="36" height="32" rx="9"/>
<path class="motor-fin" d="M188 18 V42 M196 16 V44 M204 16 V44 M212 18 V42" data-detail="fine"/>
<g transform="translate(202 30)">
  <g class="fan" data-part="actuator-fan">
    <path class="fan-blade" d="M0 -9 C5 -6 5 -2 0 0 Z M9 0 C6 5 2 5 0 0 Z M0 9 C-5 6 -5 2 0 0 Z M-9 0 C-6 -5 -2 -5 0 0 Z"/>
  </g>
</g>
<rect class="gear-window" x="130" y="60" width="54" height="36" rx="4"/>
<circle class="gear" data-part="gear" cx="149" cy="78" r="12"/>
<circle class="gear-small" data-part="gear-small" cx="172" cy="83" r="7"/>
<rect class="handwheel-shaft" x="94" y="83" width="26" height="8" rx="3"/>
<g data-part="handwheel" transform="translate(92 87)">
  <circle class="handwheel-rim" r="19"/>
  <circle class="handwheel-hub" r="5"/>
  <path class="handwheel-spoke" d="M-19 0 H19 M0 -19 V19 M-13 -13 L13 13 M-13 13 L13 -13"/>
</g>
<text class="actuator-mark" x="196" y="114" text-anchor="middle" data-detail="fine">MOV</text>
`,
});

const positioner = defineFragment({
  name: 'valve-positioner',
  template: svg`
<rect class="bracket" x="98" y="160" width="44" height="10" rx="3"/>
<rect class="positioner-case" x="44" y="140" width="58" height="50" rx="6"/>
<rect class="positioner-screen" x="51" y="147" width="44" height="20" rx="3"/>
<text class="positioner-readout" x="73" y="162" text-anchor="middle" data-part="positioner-readout">68%</text>
<circle class="positioner-led" data-part="positioner-led" cx="56" cy="180" r="4"/>
<text class="positioner-mode" x="66" y="184" data-part="mode-readout" data-detail="fine">AUTO</text>
<rect class="signal-gland" x="34" y="160" width="12" height="16" rx="3"/>
`,
});

const actuators = { pneumatic: pneumaticActuator, electric: electricActuator } as const;

function actuatorKind(context: ElementContext): keyof typeof actuators {
  return stringValue(context, 'actuator') === 'electric' ? 'electric' : 'pneumatic';
}

function valveAssembly(context: ElementContext): readonly FragmentPlacement[] {
  return [
    { key: 'body', fragment: body },
    { key: 'trim', fragment: trim },
    { key: 'yoke', fragment: yoke },
    // Keyed by role rather than by kind, so swapping the actuator replaces the
    // fragment in place instead of stacking a second one beside it.
    { key: 'actuator', fragment: actuators[actuatorKind(context)] },
    { key: 'positioner', fragment: positioner },
  ];
}

function position(context: ElementContext): number {
  return clamp(numberValue(context, 'position'), 0, 100);
}

function command(context: ElementContext): number {
  return clamp(numberValue(context, 'command'), 0, 100);
}

function deviation(context: ElementContext): number {
  return command(context) - position(context);
}

function failOpen(context: ElementContext): boolean {
  return stringValue(context, 'action') === 'normally-open';
}

const processPorts = (context: ElementContext): readonly PortDefinition[] => {
  const medium = stringValue(context, 'medium', 'water');
  return [
    { id: 'in', x: geometry.inletX, y: geometry.lineY, direction: 'left', kind: 'process', role: 'inlet', medium, label: 'Inlet' },
    { id: 'out', x: geometry.outletX, y: geometry.lineY, direction: 'right', kind: 'process', role: 'outlet', medium, label: 'Outlet' },
    { id: 'signal', x: geometry.signalX, y: geometry.signalY, direction: 'left', kind: 'signal', role: 'inlet', label: 'Control signal' },
  ];
};

const initialPortList: readonly PortDefinition[] = [
  { id: 'in', x: geometry.inletX, y: geometry.lineY, direction: 'left', kind: 'process', role: 'inlet', medium: 'water', label: 'Inlet' },
  { id: 'out', x: geometry.outletX, y: geometry.lineY, direction: 'right', kind: 'process', role: 'outlet', medium: 'water', label: 'Outlet' },
  { id: 'signal', x: geometry.signalX, y: geometry.signalY, direction: 'left', kind: 'signal', role: 'inlet', label: 'Control signal' },
  ...(pneumaticActuator.ports ?? []),
];

export const controlValveDefinition = defineElementDefinition({
  tagName: 'pe-control-valve',
  displayName: 'Control valve',
  description: 'A globe control valve with a swappable pneumatic or electric actuator, separate actual and commanded travel, and an actuator-dependent port set.',
  viewBox: '0 0 360 344',
  template: svg`<defs>
<linearGradient id="valve-shell" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4d6880"/><stop offset=".5" stop-color="#2a4155"/><stop offset="1" stop-color="#152838"/></linearGradient>
<linearGradient id="valve-steel" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8196a8"/><stop offset=".42" stop-color="#41586c"/><stop offset="1" stop-color="#1d3042"/></linearGradient>
<radialGradient id="valve-cavity"><stop stop-color="#14344a"/><stop offset=".74" stop-color="#0a1c2b"/><stop offset="1" stop-color="#06121d"/></radialGradient>
<linearGradient id="valve-stem" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#eef6fb"/><stop offset=".44" stop-color="#8fa3b5"/><stop offset="1" stop-color="#304659"/></linearGradient>
<filter id="valve-green" x="-150%" y="-150%" width="400%" height="400%"><feDropShadow dx="0" dy="0" stdDeviation="2.4" flood-color="#56e29a" flood-opacity=".7"/></filter>
<filter id="valve-amber" x="-150%" y="-150%" width="400%" height="400%"><feDropShadow dx="0" dy="0" stdDeviation="2.4" flood-color="#ffbe4a" flood-opacity=".68"/></filter>
<filter id="valve-red" x="-150%" y="-150%" width="400%" height="400%"><feDropShadow dx="0" dy="0" stdDeviation="2.6" flood-color="#ff5c74" flood-opacity=".74"/></filter>
<filter id="valve-cyan" x="-150%" y="-150%" width="400%" height="400%"><feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#52c8ff" flood-opacity=".66"/></filter>
</defs>

<g data-mount="assembly"/>

<g class="tag-panel" transform="translate(50 304)" data-part="tag-panel">
  <rect class="tag-plate" width="260" height="34" rx="7" data-detail="standard"/>
  <rect class="status-strip" data-part="status-strip" width="5" height="34" rx="2.5" data-detail="standard"/>
  <text class="tag" x="16" y="22" data-detail="standard" data-part="label">FV-101</text>
  <text class="meta" x="88" y="21" data-detail="standard" data-part="meta">FC · PNEUMATIC</text>
  <text class="readout" x="248" y="22" text-anchor="end" data-detail="standard" data-part="readout">68 / 75 %</text>
</g>
`,
  styles: `
:host{display:inline-block;width:360px;max-width:100%;aspect-ratio:90/86;color:var(--elements-ink,#dbe7f3);container-type:inline-size;contain:layout style}
svg{width:100%;height:100%;overflow:visible}

.nozzle,.bonnet,.packing,.packing-nut,.yoke-leg,.yoke-cap,.supply-tube,.power-conduit,.bracket,.handwheel-shaft{fill:url(#valve-steel);stroke:#a3b6c5;stroke-width:1.4}
.flange{fill:url(#valve-steel);stroke:#c0ccd6;stroke-width:1.7}
.bolt{fill:#263a4d;stroke:#bbc9d4;stroke-width:.7}
.body-shell{fill:url(#valve-shell);stroke:#a7bac9;stroke-width:2.2}
.body-cavity{fill:url(#valve-cavity);stroke:#6f8aa0;stroke-width:1.3}
.body-web{fill:none;stroke:#54728a;stroke-width:1.4;stroke-opacity:.55}
.seat{fill:#24425a;stroke:#9fd2ea;stroke-width:1.2}
.channel-bore{fill:none;stroke:#071521;stroke-width:13;stroke-linecap:round}
.channel-stream{fill:none;stroke:${'var(--elements-medium-water, #59d8ff)'};stroke-width:7;stroke-linecap:round;stroke-dasharray:11 9;opacity:.14;transition:opacity 200ms ease}
.flow-arrows path{fill:#7fd6ff;fill-opacity:.5}
.stem{fill:url(#valve-stem);stroke:#c8d4dd;stroke-width:1}
.plug{fill:url(#valve-steel);stroke:#cfe4f0;stroke-width:1.4}
.plug-guide{fill:#0d2030;stroke:#7d95a8;stroke-width:.8}
.diaphragm-dome{fill:url(#valve-shell);stroke:#a7bac9;stroke-width:2}
.dome-highlight{fill:none;stroke:#cfe9f8;stroke-opacity:.34;stroke-width:4;stroke-linecap:round}
.diaphragm-rim,.diaphragm-case{fill:url(#valve-steel);stroke:#b3c4d1;stroke-width:1.5}
.case-bolts circle{fill:#132435;stroke:#9fb2c2;stroke-width:.7}
.spring-coil{fill:none;stroke:#8fb3cc;stroke-opacity:.6;stroke-width:2.4;stroke-linecap:round}
.supply-gland,.power-gland,.signal-gland{fill:#16283a;stroke:#8ba0b3;stroke-width:1.2}
.actuator-case,.actuator-lid,.motor-can,.gear-window{fill:url(#valve-shell);stroke:#a3b6c5;stroke-width:1.5}
.gear-window{fill:#08151f}
.motor-fin{stroke:#8ba0b3;stroke-width:1}
.fan,.gear,.gear-small{transform-box:fill-box;transform-origin:center}
.fan-blade{fill:#7fb6d4;fill-opacity:.62;stroke:#cbe6f5;stroke-width:.7}
.gear,.gear-small{fill:none;stroke:#6fd0f2;stroke-width:2.6;stroke-dasharray:4 3.4;opacity:.72}
.handwheel-rim{fill:none;stroke:#9fb6c8;stroke-width:3.4}
.handwheel-hub{fill:#16283a;stroke:#9fb6c8;stroke-width:1.2}
.handwheel-spoke{stroke:#7f97aa;stroke-width:1.4}
.positioner-case{fill:url(#valve-shell);stroke:#a3b6c5;stroke-width:1.4}
.positioner-screen{fill:#06120f;stroke:#3f6c5b;stroke-width:1.1}
.positioner-readout{fill:#8df7c4;font:800 12px/1 ui-monospace,monospace}
.positioner-led{fill:#25374b;stroke:#71879d;stroke-width:.8}
.positioner-mode{fill:#7d93a8;font:700 7px/1 ui-monospace,monospace;letter-spacing:.08em}
.actuator-mark{fill:#8ba0b4;font:700 6.4px/1 ui-monospace,monospace;letter-spacing:.12em}
.scale-track{fill:#0d1e2c;stroke:#5c748a;stroke-width:1}
.scale-tick{stroke:#7d93a8;stroke-width:1}
.scale-label{fill:#7d93a8;font:700 6px/1 ui-monospace,monospace}
.position-mark{fill:#6fe0ff;stroke:#d5f4ff;stroke-width:.8;filter:url(#valve-cyan)}
.command-mark{fill:none;stroke:#ffd77a;stroke-width:1.6}
.fail-mark{fill:#7d93a8;fill-opacity:.75}
.travel-arrow{opacity:0}
.travel-glyph{fill:#6fe0ff;filter:url(#valve-cyan)}
.tag-plate{fill:#07121e;stroke:#4e6579;stroke-width:1}
.status-strip{fill:#56e29a;filter:url(#valve-green)}
.tag{fill:#edf4fa;font:700 14px/1 ui-monospace,monospace;letter-spacing:.08em}
.meta{fill:#72889d;font:600 7px/1 ui-monospace,monospace;letter-spacing:.09em}
.readout{fill:#71d8ff;font:700 10px/1 ui-monospace,monospace}

${mediumStyles((id) => `:host([medium="${id}"]) .channel-stream`, (color) => `stroke:${color}`)}

:host([data-state~="flowing"]) .channel-stream{opacity:.95}
:host([data-state~="closed"]) .seat{stroke:#ff9db0}
:host([data-state~="closed"]) .flow-arrows path{fill-opacity:.14}
:host([data-state~="reverse"]) .flow-arrows{transform:rotate(180deg);transform-box:fill-box;transform-origin:center}
:host([data-state~="no-flow"]) .flow-arrows{opacity:.16}
:host([data-state~="travelling"]) .travel-arrow{opacity:1}
:host([data-state~="closing"]) .travel-glyph{transform:rotate(180deg);transform-box:fill-box;transform-origin:center}
:host([data-state~="fail-open"]) .fail-mark{fill:#7fe0b4;fill-opacity:1}
:host([data-state~="fail-open"]) .body-shell{stroke-dasharray:none;stroke:#8fd7b4}
:host([data-state~="powered"]) .positioner-led{fill:#56e29a;stroke:#b6ffd6;filter:url(#valve-green)}
:host([data-state~="manual"]) .positioner-mode{fill:#ffbe4a}
:host([data-state~="manual"]) .command-mark{stroke:#8ba0b4;stroke-dasharray:3 2}
:host([data-state~="manual"]) .handwheel-rim{stroke:#ffbe4a}
:host([data-state~="stuck"]) .stem{stroke:var(--elements-alarm,#ff5c74)}
:host([data-state~="stuck"]) .position-mark{fill:var(--elements-alarm,#ff5c74);filter:url(#valve-red)}
:host([data-state~="warning"]) .status-strip{fill:var(--elements-warning,#ffbe4a);filter:url(#valve-amber)}
:host([data-state~="alarm"]) .status-strip{fill:var(--elements-alarm,#ff5c74);filter:url(#valve-red)}
:host([data-state~="alarm"]) .body-shell{stroke:var(--elements-alarm,#ff5c74)}
:host([data-state~="bad-quality"]) svg{opacity:.42;filter:grayscale(1)}
:host([data-state~="stale"]) svg{opacity:.64;filter:saturate(.35)}
${detailStyles({ hideFineBelow: 320, hideStandardBelow: 220 })}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'FV-101', description: 'Equipment label.' }),
    position: attribute.number('position', { defaultValue: 0, minimum: 0, maximum: 100, step: 1, unit: '%', cssVariable: '--valve-position', description: 'Actual travel from 0 (closed) to 100 (open).' }),
    command: attribute.number('command', { defaultValue: 0, minimum: 0, maximum: 100, step: 1, unit: '%', description: 'Commanded travel from 0 (closed) to 100 (open).' }),
    actuator: attribute.enum('actuator', ['pneumatic', 'electric'] as const, { defaultValue: 'pneumatic', description: 'Actuator type. Swaps the actuator fragment and the auxiliary port.' }),
    action: attribute.enum('action', ['normally-closed', 'normally-open'] as const, { defaultValue: 'normally-closed', description: 'Fail position on loss of signal or motive power.' }),
    flow: attribute.enum('flow', ['forward', 'reverse', 'none'] as const, { defaultValue: 'forward', description: 'Direction of process flow through the body.' }),
    medium: attribute.enum('medium', mediumIds, { defaultValue: 'water', description: 'Process substance. Propagates to the inlet and outlet ports.' }),
    mode: attribute.enum('mode', ['auto', 'manual'] as const, { defaultValue: 'auto', description: 'Auto follows the command, manual follows local intervention.' }),
    deadband: attribute.number('deadband', { defaultValue: 0.5, minimum: 0, step: 0.1, unit: '%', description: 'Travel difference below which the valve counts as settled.' }),
    stuck: attribute.boolean('stuck', { description: 'Whether the trim has stopped responding to the command.' }),
    powered: attribute.boolean('powered', { description: 'Whether actuator power or instrument air is available.' }),
    status: attribute.enum('status', ['idle', 'normal', 'warning', 'alarm'] as const, { defaultValue: 'idle', description: 'Process status independent from data quality.' }),
    quality: attribute.enum('quality', ['good', 'stale', 'bad'] as const, { defaultValue: 'good', description: 'Telemetry quality independent from process status.' }),
    detail: attribute.enum('detail', ['auto', 'full', 'compact', 'symbol'] as const, { defaultValue: 'auto', description: 'Visual level of detail.' }),
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
    electric: (context) => stringValue(context, 'actuator') === 'electric',
    'fail-open': failOpen,
    flowing: (context) => stringValue(context, 'flow') !== 'none' && position(context) > numberValue(context, 'deadband'),
    reverse: (context) => stringValue(context, 'flow') === 'reverse',
    'no-flow': (context) => stringValue(context, 'flow') === 'none',
    warning: (context) => stringValue(context, 'status') === 'warning' || booleanValue(context, 'stuck'),
    alarm: (context) => stringValue(context, 'status') === 'alarm',
    stale: (context) => stringValue(context, 'quality') === 'stale',
    'bad-quality': (context) => stringValue(context, 'quality') === 'bad',
  },
  collections: [{ mount: 'assembly', items: valveAssembly }],
  bindings: [
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('meta', (context) => [
      failOpen(context) ? 'FO' : 'FC',
      stringValue(context, 'actuator').toUpperCase(),
    ].join(' · '), ['action', 'actuator']),
    bind.text('readout', (context) => `${Math.round(position(context))} / ${Math.round(command(context))} %`, ['position', 'command']),
    bind.text('positioner-readout', (context) => `${Math.round(position(context))}%`, ['position']),
    bind.text('mode-readout', (context) => stringValue(context, 'mode').toUpperCase(), ['mode']),
    // The fail mark sits at the travel the valve springs to without power.
    bind.attribute('fail-mark', 'transform', (context) => `translate(0 ${failOpen(context) ? -geometry.scaleHeight : 0})`, ['action']),
  ],
  motions: [
    {
      id: 'stem-travel', type: 'scrub', target: 'stem-travel',
      progress: (context) => position(context) / 100,
      settle: 420,
      keyframes: [{ transform: 'translateY(0px)' }, { transform: `translateY(-${geometry.stroke}px)` }],
      options: { duration: 1000, fill: 'both' }, reducedMotion: 'preserve',
    },
    {
      id: 'position-marker', type: 'scrub', target: 'position-marker',
      progress: (context) => position(context) / 100,
      settle: 420,
      keyframes: [{ transform: 'translateY(0px)' }, { transform: `translateY(-${geometry.scaleHeight}px)` }],
      options: { duration: 1000, fill: 'both' }, reducedMotion: 'preserve',
    },
    {
      // The setpoint marker snaps: a command is a step, not a movement.
      id: 'command-marker', type: 'scrub', target: 'command-marker',
      progress: (context) => command(context) / 100,
      keyframes: [{ transform: 'translateY(0px)' }, { transform: `translateY(-${geometry.scaleHeight}px)` }],
      options: { duration: 1000, fill: 'both' }, reducedMotion: 'preserve',
    },
    {
      id: 'seat-flow', type: 'loop', target: 'flow-stream',
      active: (context) => stateValue(context, 'flowing'),
      playbackRate: (context) => {
        const rate = Math.max(0.12, position(context) / 100);
        return stateValue(context, 'reverse') ? -rate : rate;
      },
      phase: 'process-flow',
      keyframes: [{ strokeDashoffset: 0 }, { strokeDashoffset: -20 }],
      options: { duration: 620, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze',
    },
    {
      id: 'travel-pulse', type: 'loop', target: 'travel-arrow',
      active: (context) => stateValue(context, 'travelling'),
      keyframes: [{ opacity: 0.25 }, { opacity: 1 }, { opacity: 0.25 }],
      options: { duration: 700, iterations: Infinity, easing: 'ease-in-out' }, reducedMotion: 'finish',
    },
    {
      // Nested inside the scrub target so the shudder adds to the travel
      // instead of overwriting it.
      id: 'stuck-shudder', type: 'loop', target: 'stem-shudder',
      active: (context) => stateValue(context, 'stuck'),
      keyframes: [{ transform: 'translateX(-0.7px)' }, { transform: 'translateX(0.7px)' }],
      options: { duration: 90, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }, reducedMotion: 'freeze',
    },
    {
      id: 'actuator-breath', type: 'loop', target: 'actuator-breath',
      active: (context) => stateValue(context, 'travelling') && !stateValue(context, 'electric'),
      keyframes: [{ transform: 'translateY(-0.9px)' }, { transform: 'translateY(0.9px)' }],
      options: { duration: 340, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }, reducedMotion: 'freeze',
    },
    {
      id: 'actuator-fan', type: 'loop', target: 'actuator-fan',
      active: (context) => stateValue(context, 'travelling') && stateValue(context, 'electric'),
      keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      options: { duration: 260, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze',
    },
    {
      id: 'gear-turn', type: 'loop', target: 'gear',
      active: (context) => stateValue(context, 'travelling') && stateValue(context, 'electric'),
      playbackRate: (context) => (stateValue(context, 'closing') ? -1 : 1),
      keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      options: { duration: 2600, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze',
    },
    {
      id: 'gear-small-turn', type: 'loop', target: 'gear-small',
      active: (context) => stateValue(context, 'travelling') && stateValue(context, 'electric'),
      playbackRate: (context) => (stateValue(context, 'closing') ? 1.7 : -1.7),
      keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      options: { duration: 2600, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze',
    },
    {
      id: 'command-step', type: 'transition', target: 'positioner-led',
      trigger: (context) => Math.round(command(context)),
      enabled: (context) => stateValue(context, 'powered'),
      keyframes: [{ opacity: 0.3, transform: 'scale(1)' }, { opacity: 1, transform: 'scale(1.5)' }, { opacity: 1, transform: 'scale(1)' }],
      options: { duration: 260, easing: 'ease-out' }, reducedMotion: 'finish',
    },
    {
      id: 'alarm-pulse', type: 'loop', target: 'status-strip',
      active: (context) => stateValue(context, 'alarm'),
      keyframes: [{ opacity: 0.3 }, { opacity: 1 }, { opacity: 0.3 }],
      options: { duration: 720, iterations: Infinity, easing: 'ease-in-out' }, reducedMotion: 'finish',
    },
  ],
  // The auxiliary port belongs to whichever actuator is mounted, and the
  // process ports carry the configured medium out to the connected pipes.
  ports: ports(initialPortList, (context) => [
    ...processPorts(context),
    ...(actuators[actuatorKind(context)].ports ?? []),
  ]),
  parts: [
    { name: 'body-shell', description: 'Globe valve body.', detail: 'essential' },
    { name: 'stem-travel', description: 'Plug and stem assembly driven by actual travel.', detail: 'essential' },
    { name: 'stem-shudder', description: 'Nested carrier for stuck-trim vibration.', detail: 'essential' },
    { name: 'flow-stream', description: 'Animated process stream through the seat.', detail: 'essential' },
    { name: 'position-marker', description: 'Actual travel marker on the travel scale.', detail: 'standard' },
    { name: 'command-marker', description: 'Commanded travel marker on the travel scale.', detail: 'standard' },
    { name: 'fail-mark', description: 'Travel the valve springs to without power.', detail: 'standard' },
    { name: 'travel-arrow', description: 'Direction indicator while the valve strokes.', detail: 'standard' },
    { name: 'positioner-led', description: 'Positioner power and command indicator.', detail: 'essential' },
    { name: 'positioner-readout', detail: 'standard' },
    { name: 'handwheel', description: 'Manual override handwheel on the electric actuator.', detail: 'standard' },
    { name: 'status-strip', detail: 'standard' },
    { name: 'label', detail: 'standard' },
    { name: 'readout', detail: 'standard' },
    { name: 'meta', detail: 'standard' },
  ],
});
