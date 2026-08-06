import {
  attribute,
  bind,
  defineElementDefinition,
  defineFragment,
  detailStyles,
  mediumIds,
  ports,
  svg,
  type ElementContext,
  type FragmentPlacement,
  type PortDefinition,
} from '@pom4h/elements-core';
import { booleanValue, clamp, numberValue, stateValue, stringValue } from '../shared.js';

/**
 * A globe control valve, drawn as an operator sees it standing in front of the
 * machine: a body between two flange faces, a bonnet, a yoke with the stem
 * running up it, an actuator on top and a positioner on the side.
 *
 * What is deliberately absent: the plug and seat (you cannot see inside a valve
 * body), any pipe beyond the flange faces, and any flow — the scene owns the
 * lines and what moves through them.
 */
const geometry = Object.freeze({
  /** Process centreline. Both flange faces and both ports sit on it. */
  lineY: 190,
  inletX: 42,
  outletX: 158,
  /** Stem travel between shut and fully open, in user units. */
  stroke: 30,
  signalX: 18,
  signalY: 123,
  auxiliaryX: 174,
  supplyY: 78,
  powerY: 62,
});

const body = defineFragment({
  name: 'valve-body',
  template: svg`
<rect class="flange" x="42" y="172" width="16" height="36"/>
<rect class="flange" x="142" y="172" width="16" height="36"/>
<path class="body" data-part="body" d="M56 178 C56 168 70 162 100 162 C130 162 144 168 144 178 V202 C144 212 130 218 100 218 C70 218 56 212 56 202 Z"/>
<path class="bonnet" d="M84 146 H116 L112 164 H88 Z"/>
<rect class="packing" x="86" y="137" width="28" height="9" rx="1"/>
`,
});

const yoke = defineFragment({
  name: 'valve-yoke',
  template: svg`
<path class="yoke-leg" d="M88 144 L78 98 H88 L96 144 Z"/>
<path class="yoke-leg" d="M112 144 L122 98 H112 L104 144 Z"/>
<rect class="yoke-cap" x="74" y="89" width="52" height="10" rx="2"/>

<g class="scale" data-part="travel-scale" data-detail="standard">
  <rect class="scale-track" x="128" y="98" width="8" height="44" rx="2"/>
  <text class="scale-label" x="138" y="103" data-detail="fine">100</text>
  <text class="scale-label" x="138" y="144" data-detail="fine">0</text>
  <g data-part="command-marker">
    <path class="command-mark" d="M144 135 L151 130 V140 Z"/>
  </g>
</g>

<!-- The stem and the pointer clamped to it are the one thing that really
     moves, and the only travel reading an operator has on the machine. -->
<g data-part="stem-travel">
  <rect class="stem" x="96" y="95" width="8" height="50"/>
  <rect class="travel-pointer" data-part="travel-pointer" x="104" y="132" width="24" height="6" rx="1"/>
</g>
`,
});

const pneumaticActuator = defineFragment({
  name: 'valve-actuator-pneumatic',
  ports: [{ id: 'supply', x: geometry.auxiliaryX, y: geometry.supplyY, direction: 'right', kind: 'process', role: 'inlet', medium: 'air' }],
  template: svg`
<rect class="supply-stub" x="156" y="74" width="16" height="9"/>
<path class="actuator" d="M44 87 C44 44 156 44 156 87 Z"/>
<rect class="actuator-rim" x="40" y="85" width="120" height="12" rx="3"/>
`,
});

const electricActuator = defineFragment({
  name: 'valve-actuator-electric',
  ports: [{ id: 'power', x: geometry.auxiliaryX, y: geometry.powerY, direction: 'right', kind: 'electrical', role: 'inlet' }],
  template: svg`
<rect class="power-stub" x="154" y="58" width="18" height="9"/>
<rect class="actuator" x="64" y="44" width="90" height="46" rx="4"/>
<rect class="actuator-rim" x="58" y="85" width="104" height="12" rx="3"/>
<rect class="motor" x="128" y="24" width="28" height="22" rx="3"/>

<!-- A handwheel is a control an operator actually puts a hand on. -->
<g transform="translate(46 66)">
  <g class="handwheel" data-part="handwheel">
    <circle class="handwheel-rim" r="17"/>
    <path class="handwheel-spoke" d="M-17 0 H17 M0 -17 V17 M-12 -12 L12 12 M-12 12 L12 -12"/>
    <circle class="handwheel-hub" r="4"/>
  </g>
</g>
`,
});

const positioner = defineFragment({
  name: 'valve-positioner',
  template: svg`
<rect class="bracket" x="54" y="119" width="28" height="6"/>
<rect class="positioner" x="20" y="106" width="36" height="32" rx="2"/>
<rect class="positioner-screen" x="24" y="110" width="28" height="13" rx="1"/>
<text class="positioner-readout" x="38" y="120" text-anchor="middle" data-part="positioner-readout">68</text>
<circle class="positioner-led" data-part="positioner-led" cx="27" cy="131" r="3.2"/>
<text class="positioner-mode" x="34" y="134" data-part="mode-readout" data-detail="fine">AUTO</text>
`,
});

/**
 * At symbol size the drawing stops being a machine and becomes the P&ID symbol,
 * because that is what stays readable — and what an engineer already knows.
 *
 * The two actuators are separate fragments rather than one drawing with parts
 * switched off: visibility is contested by the shared detail stylesheet, while
 * a fragment choice is not.
 */
const symbolTrim = `
<path class="symbol-body" data-part="body" d="M56 168 L100 190 L56 212 Z"/>
<path class="symbol-body" d="M144 168 L100 190 L144 212 Z"/>
<rect class="symbol-stem" x="97" y="140" width="6" height="30"/>`;

const pneumaticSymbol = defineFragment({
  name: 'valve-symbol-pneumatic',
  template: svg`${symbolTrim}
<path class="symbol-actuator" d="M64 142 A36 27 0 0 1 136 142 Z"/>
`,
});

const electricSymbol = defineFragment({
  name: 'valve-symbol-electric',
  template: svg`${symbolTrim}
<rect class="symbol-actuator" x="70" y="114" width="60" height="28" rx="3"/>
<text class="symbol-mark" x="100" y="134" text-anchor="middle">M</text>
`,
});

const actuators = { pneumatic: pneumaticActuator, electric: electricActuator } as const;
const symbols = { pneumatic: pneumaticSymbol, electric: electricSymbol } as const;

function actuatorKind(context: ElementContext): keyof typeof actuators {
  return stringValue(context, 'actuator') === 'electric' ? 'electric' : 'pneumatic';
}

function isSymbol(context: ElementContext): boolean {
  // The runtime resolves this from the declared detail and the measured width;
  // the attribute is the fallback when the context was built by hand.
  return (context.detail ?? stringValue(context, 'detail')) === 'symbol';
}

function valveAssembly(context: ElementContext): readonly FragmentPlacement[] {
  // A symbol is a different drawing, not a smaller one, so it replaces the
  // machine outright rather than hiding parts of it.
  if (isSymbol(context)) return [{ key: 'symbol', fragment: symbols[actuatorKind(context)] }];
  return [
    { key: 'body', fragment: body },
    { key: 'yoke', fragment: yoke },
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

function valvePorts(context: ElementContext): readonly PortDefinition[] {
  const medium = stringValue(context, 'medium', 'water');
  return [
    { id: 'in', x: geometry.inletX, y: geometry.lineY, direction: 'left', kind: 'process', role: 'inlet', medium, label: 'Inlet flange' },
    { id: 'out', x: geometry.outletX, y: geometry.lineY, direction: 'right', kind: 'process', role: 'outlet', medium, label: 'Outlet flange' },
    { id: 'signal', x: geometry.signalX, y: geometry.signalY, direction: 'left', kind: 'signal', role: 'inlet', label: 'Positioner signal' },
    ...(actuators[actuatorKind(context)].ports ?? []),
  ];
}

const defaultPorts: readonly PortDefinition[] = valvePorts({
  host: undefined as unknown as HTMLElement,
  attributes: { actuator: 'pneumatic', medium: 'water' },
  states: {},
});

export const controlValveDefinition = defineElementDefinition({
  tagName: 'pe-control-valve',
  displayName: 'Control valve',
  description: 'A globe control valve drawn as an operator sees it: body, yoke, stem travel, actuator and positioner. Piping and flow belong to the scene.',
  viewBox: '0 0 200 250',
  // Below this the machine drawing stops being readable and the symbol is the
  // honest rendering; measured at 96, 128 and 160 px.
  detailBreakpoints: { symbol: 132, compact: 200 },
  template: svg`<g data-mount="assembly"/>
<g class="tag" data-part="tag" transform="translate(20 224)" data-detail="standard">
  <rect class="tag-strip" data-part="status-strip" width="4" height="22" rx="1"/>
  <text class="tag-label" x="12" y="16" data-part="label">FV-101</text>
  <text class="tag-meta" x="72" y="15" data-part="meta" data-detail="fine">FC · AIR</text>
  <text class="tag-readout" x="160" y="16" text-anchor="end" data-part="readout">68 / 75</text>
</g>
`,
  styles: `
:host{display:inline-block;width:200px;max-width:100%;aspect-ratio:4/5;color:var(--elements-ink,#dbe7f3);container-type:inline-size;contain:layout style}
svg{width:100%;height:100%;overflow:visible}

/* Flat fills only: no gradients, no glows. Form is carried by silhouette and
   one tone step between the machine and its metal fittings. */
.body,.bonnet{fill:#2b4155;stroke:#93a9bc;stroke-width:2}
.flange,.packing,.yoke-cap,.bracket,.supply-stub,.power-stub{fill:#3d566d;stroke:#93a9bc;stroke-width:1.6}
.yoke-leg{fill:#35506a;stroke:#93a9bc;stroke-width:1.6}
.actuator{fill:#35506a;stroke:#a3b8c9;stroke-width:2}
.actuator-rim,.motor{fill:#3d566d;stroke:#a3b8c9;stroke-width:1.6}
.stem{fill:#c9d8e4;stroke:#eef5fa;stroke-width:1}
.travel-pointer{fill:#59d8ff;stroke:#d5f0ff;stroke-width:1}
.scale-track{fill:#132434;stroke:#6d8399;stroke-width:1.4}
.scale-label{fill:#7d93a8;font:600 7px/1 ui-monospace,monospace}
.command-mark{fill:none;stroke:#ffbe4a;stroke-width:2}
.handwheel-rim{fill:none;stroke:#9fb6c8;stroke-width:3}
.handwheel-spoke{stroke:#7f97aa;stroke-width:1.6}
.handwheel-hub{fill:#2b4155;stroke:#9fb6c8;stroke-width:1.4}
.handwheel{transform-box:fill-box;transform-origin:center}
.positioner{fill:#35506a;stroke:#a3b8c9;stroke-width:1.6}
.positioner-screen{fill:#08160f;stroke:#3f6c5b;stroke-width:1.2}
.positioner-readout{fill:#8df7c4;font:700 10px/1 ui-monospace,monospace}
.positioner-led{fill:#2a3d4f;stroke:#7d93a8;stroke-width:1}
.positioner-mode{fill:#7d93a8;font:600 6px/1 ui-monospace,monospace;letter-spacing:.1em}
.tag-strip{fill:#56e29a}
.tag-label{fill:#edf4fa;font:700 13px/1 ui-monospace,monospace;letter-spacing:.06em}
.tag-meta{fill:#72889d;font:600 7px/1 ui-monospace,monospace;letter-spacing:.1em}
.tag-readout{fill:#71d8ff;font:700 10px/1 ui-monospace,monospace}

.symbol-body{fill:#2b4155;stroke:#a3b8c9;stroke-width:3}
.symbol-stem{fill:#a3b8c9}
.symbol-actuator{fill:#35506a;stroke:#a3b8c9;stroke-width:3}
.symbol-mark{fill:#dbe7f3;font:700 16px/1 ui-monospace,monospace}

:host([data-state~="open"]) .body,:host([data-state~="open"]) .symbol-body{fill:#1d3346}
:host([data-state~="fail-open"]) .scale-track{stroke:#7fe0b4}
:host([data-state~="powered"]) .positioner-led{fill:#56e29a;stroke:#b6ffd6}
:host([data-state~="manual"]) .positioner-mode{fill:#ffbe4a}
:host([data-state~="manual"]) .handwheel-rim{stroke:#ffbe4a}
:host([data-state~="stuck"]) .travel-pointer{fill:var(--elements-alarm,#ff5c74);stroke:#ffd4dc}
:host([data-state~="stuck"]) .stem{fill:var(--elements-alarm,#ff5c74)}
:host([data-state~="warning"]) .tag-strip{fill:var(--elements-warning,#ffbe4a)}
:host([data-state~="alarm"]) .tag-strip{fill:var(--elements-alarm,#ff5c74)}
:host([data-state~="alarm"]) .body,:host([data-state~="alarm"]) .symbol-body{stroke:var(--elements-alarm,#ff5c74)}
:host([data-state~="bad-quality"]) svg{opacity:.42;filter:grayscale(1)}
:host([data-state~="stale"]) svg{opacity:.64}
${detailStyles({ hideFineBelow: 190, hideStandardBelow: 130 })}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'FV-101', description: 'Equipment tag.' }),
    position: attribute.number('position', { defaultValue: 0, minimum: 0, maximum: 100, step: 1, unit: '%', cssVariable: '--valve-position', description: 'Actual travel from 0 (shut) to 100 (open).' }),
    command: attribute.number('command', { defaultValue: 0, minimum: 0, maximum: 100, step: 1, unit: '%', description: 'Commanded travel from 0 (shut) to 100 (open).' }),
    actuator: attribute.enum('actuator', ['pneumatic', 'electric'] as const, { defaultValue: 'pneumatic', description: 'Actuator type. Swaps the actuator and its auxiliary port.' }),
    action: attribute.enum('action', ['normally-closed', 'normally-open'] as const, { defaultValue: 'normally-closed', description: 'Fail position on loss of signal or motive power.' }),
    medium: attribute.enum('medium', mediumIds, { defaultValue: 'water', description: 'Process substance. Propagates to the inlet and outlet ports.' }),
    mode: attribute.enum('mode', ['auto', 'manual'] as const, { defaultValue: 'auto', description: 'Auto follows the command, manual follows the handwheel.' }),
    deadband: attribute.number('deadband', { defaultValue: 0.5, minimum: 0, step: 0.1, unit: '%', description: 'Travel difference below which the valve counts as settled.' }),
    stuck: attribute.boolean('stuck', { description: 'Whether the trim has stopped following the command.' }),
    powered: attribute.boolean('powered', { description: 'Whether actuator power or instrument air is available.' }),
    status: attribute.enum('status', ['idle', 'normal', 'warning', 'alarm'] as const, { defaultValue: 'idle', description: 'Process status independent from data quality.' }),
    quality: attribute.enum('quality', ['good', 'stale', 'bad'] as const, { defaultValue: 'good', description: 'Telemetry quality independent from process status.' }),
    detail: attribute.enum('detail', ['auto', 'full', 'compact', 'symbol'] as const, { defaultValue: 'auto', description: 'Visual level of detail. Symbol swaps to the P&ID symbol.' }),
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
    warning: (context) => stringValue(context, 'status') === 'warning' || booleanValue(context, 'stuck'),
    alarm: (context) => stringValue(context, 'status') === 'alarm',
    stale: (context) => stringValue(context, 'quality') === 'stale',
    'bad-quality': (context) => stringValue(context, 'quality') === 'bad',
  },
  collections: [{ mount: 'assembly', items: valveAssembly }],
  bindings: [
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('meta', (context) => `${failOpen(context) ? 'FO' : 'FC'} · ${stringValue(context, 'actuator') === 'electric' ? 'MOV' : 'AIR'}`, ['action', 'actuator']),
    bind.text('readout', (context) => `${Math.round(position(context))} / ${Math.round(command(context))}`, ['position', 'command']),
    bind.text('positioner-readout', (context) => String(Math.round(position(context))), ['position']),
    bind.text('mode-readout', (context) => stringValue(context, 'mode').toUpperCase(), ['mode']),
  ],
  motions: [
    {
      // The stem and its pointer are one physical movement, so they share one
      // motion and travel the same distance.
      id: 'stem-travel', type: 'scrub', target: 'stem-travel',
      progress: (context) => position(context) / 100,
      settle: 420,
      keyframes: [{ transform: 'translateY(0px)' }, { transform: `translateY(-${geometry.stroke}px)` }],
      options: { duration: 1000, fill: 'both' }, reducedMotion: 'preserve',
    },
    {
      // A setpoint is a step, not a movement: the marker does not settle.
      id: 'command-marker', type: 'scrub', target: 'command-marker',
      progress: (context) => command(context) / 100,
      keyframes: [{ transform: 'translateY(0px)' }, { transform: `translateY(-${geometry.stroke}px)` }],
      options: { duration: 1000, fill: 'both' }, reducedMotion: 'preserve',
    },
    {
      // Only turns when somebody is turning it.
      id: 'handwheel-turn', type: 'loop', target: 'handwheel',
      active: (context) => stateValue(context, 'manual') && stateValue(context, 'travelling'),
      playbackRate: (context) => (stateValue(context, 'closing') ? -1 : 1),
      keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      options: { duration: 2400, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze',
    },
    {
      id: 'command-received', type: 'transition', target: 'positioner-led',
      trigger: (context) => Math.round(command(context)),
      enabled: (context) => stateValue(context, 'powered'),
      keyframes: [{ opacity: 0.3 }, { opacity: 1 }],
      options: { duration: 240, easing: 'ease-out' }, reducedMotion: 'finish',
    },
    {
      id: 'alarm-pulse', type: 'loop', target: 'status-strip',
      active: (context) => stateValue(context, 'alarm'),
      keyframes: [{ opacity: 0.3 }, { opacity: 1 }, { opacity: 0.3 }],
      options: { duration: 760, iterations: Infinity, easing: 'ease-in-out' }, reducedMotion: 'finish',
    },
  ],
  ports: ports(defaultPorts, valvePorts),
  parts: [
    { name: 'body', description: 'Valve body silhouette.', detail: 'essential' },
    { name: 'stem-travel', description: 'Stem and the travel pointer clamped to it.', detail: 'essential' },
    { name: 'travel-pointer', description: 'Actual travel read against the scale.', detail: 'essential' },
    { name: 'command-marker', description: 'Commanded travel on the same scale.', detail: 'standard' },
    { name: 'travel-scale', description: 'Travel scale on the yoke.', detail: 'standard' },
    { name: 'positioner-led', description: 'Positioner power and command indicator.', detail: 'essential' },
    { name: 'positioner-readout', detail: 'standard' },
    { name: 'handwheel', description: 'Manual override on the electric actuator.', detail: 'standard' },
    { name: 'status-strip', detail: 'standard' },
    { name: 'label', detail: 'standard' },
    { name: 'readout', detail: 'standard' },
    { name: 'meta', detail: 'fine' },
  ],
});
