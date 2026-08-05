import {
  attribute,
  bind,
  defineElementDefinition,
  detailStyles,
  svg,
  type ElementContext,
} from '@pom4h/elements-core';
import { booleanValue, clamp, numberValue, stateValue, stringValue } from '../shared.js';

const geometry = Object.freeze({
  inletX: 10,
  outletX: 430,
  processY: 224,
  signalX: 430,
  signalY: 81,
  travel: 54,
});

function normalizedPosition(context: ElementContext, name: string): number {
  return clamp(numberValue(context, name), 0, 100) / 100;
}

export const controlValveDefinition = defineElementDefinition({
  tagName: 'pe-control-valve',
  displayName: 'Pneumatic globe control valve',
  description: 'A modulating globe valve with diaphragm actuator, positioner, actual/setpoint travel indication and process-flow visualization.',
  viewBox: '0 0 440 370',
  template: svg`
<defs>
  <linearGradient id="valve-steel" x1="0" y1="0" x2="0" y2="1">
    <stop stop-color="#b9c7d2"/><stop offset=".34" stop-color="#657b8e"/><stop offset="1" stop-color="#25394b"/>
  </linearGradient>
  <linearGradient id="valve-body" x1="0" y1="0" x2="1" y2="1">
    <stop stop-color="#587087"/><stop offset=".48" stop-color="#2d455a"/><stop offset="1" stop-color="#162a3b"/>
  </linearGradient>
  <linearGradient id="actuator-shell" x1="0" y1="0" x2="0" y2="1">
    <stop stop-color="#526c83"/><stop offset=".5" stop-color="#2d465b"/><stop offset="1" stop-color="#172a3b"/>
  </linearGradient>
  <linearGradient id="positioner-shell" x1="0" y1="0" x2="1" y2="1">
    <stop stop-color="#273f54"/><stop offset="1" stop-color="#0f2131"/>
  </linearGradient>
  <radialGradient id="valve-bore">
    <stop stop-color="#12344a"/><stop offset=".68" stop-color="#091c2b"/><stop offset="1" stop-color="#06121d"/>
  </radialGradient>
  <filter id="valve-green-glow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="0" stdDeviation="2.3" flood-color="#55e39a" flood-opacity=".68"/></filter>
  <filter id="valve-cyan-glow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="0" stdDeviation="2.3" flood-color="#52d6ff" flood-opacity=".68"/></filter>
  <filter id="valve-amber-glow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#ffbe4a" flood-opacity=".66"/></filter>
  <filter id="valve-red-glow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="0" stdDeviation="2.7" flood-color="#ff5c74" flood-opacity=".72"/></filter>
  <clipPath id="process-window"><rect x="31" y="203" width="378" height="42" rx="20"/></clipPath>
</defs>

<path class="base" d="M124 307 H316 L327 324 H113 Z"/>
<rect class="base-rail" x="126" y="323" width="188" height="9" rx="4"/>

<g data-part="process-body">
  <rect class="nozzle" x="28" y="207" width="92" height="34" rx="8"/>
  <rect class="nozzle" x="320" y="207" width="92" height="34" rx="8"/>
  <rect class="flange" x="10" y="194" width="24" height="60" rx="4"/>
  <rect class="flange" x="406" y="194" width="24" height="60" rx="4"/>
  <g data-detail="fine" class="flange-bolts">
    <circle cx="22" cy="204" r="2.4"/><circle cx="22" cy="244" r="2.4"/>
    <circle cx="418" cy="204" r="2.4"/><circle cx="418" cy="244" r="2.4"/>
  </g>
  <path class="body" data-part="housing" d="M101 190 C130 156 170 158 220 184 C270 158 310 156 339 190 L339 258 C310 292 270 290 220 264 C170 290 130 292 101 258 Z"/>
  <ellipse class="bore" cx="220" cy="224" rx="103" ry="43"/>
  <path class="seat" d="M181 241 Q220 220 259 241 L249 255 Q220 242 191 255 Z"/>
  <path class="bonnet" d="M165 184 L179 140 H261 L275 184 Z"/>
  <rect class="bonnet-ring" x="168" y="132" width="104" height="17" rx="7"/>
  <g class="bonnet-bolts" data-detail="fine">
    <circle cx="183" cy="140" r="3"/><circle cx="205" cy="140" r="3"/><circle cx="235" cy="140" r="3"/><circle cx="257" cy="140" r="3"/>
  </g>
</g>

<g clip-path="url(#process-window)">
  <path class="flow-track" d="M31 224 H409"/>
  <path class="flow-line" data-part="flow-line" d="M31 224 H409"/>
</g>

<g class="moving-assembly" data-part="moving-assembly">
  <rect class="stem" x="215" y="76" width="10" height="148" rx="5"/>
  <path class="plug" data-part="plug" d="M193 224 Q220 204 247 224 L239 244 Q220 251 201 244 Z"/>
  <path class="stem-highlight" d="M219 84 V207" data-detail="fine"/>
  <circle class="travel-pin" cx="220" cy="112" r="6"/>
</g>

<g data-part="actuator">
  <rect class="yoke-left" x="168" y="82" width="13" height="57" rx="5"/>
  <rect class="yoke-right" x="259" y="82" width="13" height="57" rx="5"/>
  <rect class="actuator-neck" x="201" y="65" width="38" height="25" rx="8"/>
  <rect class="actuator-shell" x="136" y="25" width="168" height="59" rx="29"/>
  <path class="diaphragm" d="M147 55 H293" data-detail="fine"/>
  <rect class="spring-cap" x="201" y="13" width="38" height="18" rx="8"/>
  <circle class="actuator-glow" data-part="actuator-glow" cx="220" cy="55" r="22"/>
</g>

<g class="positioner" data-part="positioner">
  <path class="bracket" d="M278 101 H321 V112 H278 Z"/>
  <rect class="positioner-shell" x="309" y="66" width="98" height="82" rx="12"/>
  <rect class="positioner-screen" x="323" y="80" width="69" height="28" rx="5"/>
  <text class="screen-value" x="357.5" y="99" text-anchor="middle" data-part="position-readout">68%</text>
  <circle class="positioner-led" cx="328" cy="124" r="5"/>
  <circle class="positioner-button" cx="351" cy="124" r="5"/>
  <circle class="positioner-button" cx="374" cy="124" r="5"/>
  <path class="air-port" d="M407 81 H430"/>
  <circle class="air-fitting" cx="407" cy="81" r="5"/>
</g>

<g class="travel-scale" data-detail="standard">
  <rect class="scale-body" x="284" y="84" width="13" height="73" rx="5"/>
  <path class="scale-ticks" d="M284 93 H291 M284 106 H289 M284 119 H291 M284 132 H289 M284 145 H291"/>
  <path class="actual-marker" data-part="actual-marker" d="M275 147 L284 141 V153 Z"/>
  <path class="command-marker" data-part="command-marker" d="M306 147 L297 141 V153 Z"/>
</g>

<circle class="status-ring" data-part="status-ring" cx="220" cy="224" r="63"/>

<g class="tag-panel" transform="translate(104 315)" data-detail="standard">
  <rect class="tag-plate" width="232" height="38" rx="8"/>
  <rect class="status-strip" data-part="status-strip" width="5" height="38" rx="2.5"/>
  <text class="tag" x="16" y="24" data-part="label">CV-101</text>
  <text class="meta" x="85" y="16" data-part="mode">REMOTE</text>
  <text class="meta" x="85" y="28" data-part="setpoint">SP 72%</text>
  <text class="readout" x="219" y="24" text-anchor="end" data-part="flow-value">42.0 m³/h</text>
</g>
`,
  styles: `
:host{display:inline-block;width:440px;max-width:100%;aspect-ratio:44/37;color:var(--elements-ink,#dbe7f3);container-type:inline-size;contain:layout style}svg{width:100%;height:100%;overflow:visible}.base,.base-rail{fill:#132536;stroke:#60798f;stroke-width:1.3}.nozzle,.flange,.bonnet,.bonnet-ring{fill:url(#valve-steel);stroke:#b4c3cf;stroke-width:1.5}.flange{stroke-width:1.8}.flange-bolts circle,.bonnet-bolts circle{fill:#24384a;stroke:#d0d9e0;stroke-width:.8}.body{fill:url(#valve-body);stroke:#a9bac8;stroke-width:2.2}.bore{fill:url(#valve-bore);stroke:#6f8ba1;stroke-width:1.4}.seat{fill:#21394d;stroke:#9fb4c5;stroke-width:1.3}.stem{fill:url(#valve-steel);stroke:#d3dce4;stroke-width:1}.plug{fill:#3c6079;stroke:#a9c8dc;stroke-width:1.5}.stem-highlight{fill:none;stroke:#eef7fb;stroke-opacity:.62;stroke-width:1}.travel-pin{fill:#50d4ff;stroke:#dcf8ff;stroke-width:1;filter:url(#valve-cyan-glow)}.yoke-left,.yoke-right,.actuator-neck{fill:#263e52;stroke:#8ea4b6;stroke-width:1.3}.actuator-shell{fill:url(#actuator-shell);stroke:#a6b8c6;stroke-width:1.8}.diaphragm{fill:none;stroke:#9eb3c4;stroke-opacity:.48;stroke-width:1.2}.spring-cap{fill:#243b4f;stroke:#879fb3;stroke-width:1.2}.actuator-glow{fill:#52d6ff;opacity:.12;filter:url(#valve-cyan-glow)}.bracket{fill:#24394c;stroke:#758ea2;stroke-width:1.1}.positioner-shell{fill:url(#positioner-shell);stroke:#91a8ba;stroke-width:1.5}.positioner-screen{fill:#06141f;stroke:#3f657d;stroke-width:1}.screen-value{fill:#79dcff;font:700 12px/1 ui-monospace,monospace}.positioner-led{fill:#55e39a;filter:url(#valve-green-glow)}.positioner-button{fill:#263c4e;stroke:#8398a9;stroke-width:.8}.air-port{fill:none;stroke:#a9becd;stroke-width:5;stroke-linecap:round}.air-fitting{fill:#253d50;stroke:#b8c9d4;stroke-width:1}.flow-track{fill:none;stroke:#102b3d;stroke-width:17;stroke-linecap:round}.flow-line{fill:none;stroke:#55d8ff;stroke-width:4;stroke-linecap:round;stroke-dasharray:10 12;filter:url(#valve-cyan-glow)}.travel-scale .scale-body{fill:#0a1926;stroke:#546e82;stroke-width:1}.scale-ticks{fill:none;stroke:#849cad;stroke-width:1}.actual-marker{fill:#52d6ff}.command-marker{fill:#ffbe4a}.status-ring{fill:none;stroke:#55e39a;stroke-width:2.4;opacity:.72;filter:url(#valve-green-glow)}.tag-plate{fill:#07121e;stroke:#4e6579;stroke-width:1}.status-strip{fill:#55e39a;filter:url(#valve-green-glow)}.tag{fill:#edf4fa;font:700 14px/1 ui-monospace,monospace;letter-spacing:.08em}.meta{fill:#72889d;font:650 7px/1 ui-monospace,monospace;letter-spacing:.08em}.readout{fill:#71d8ff;font:700 9px/1 ui-monospace,monospace}.moving-assembly,.actual-marker,.command-marker{transform-box:fill-box;transform-origin:center}
:host([data-state~="moving"]) .status-ring{stroke:#52d6ff;filter:url(#valve-cyan-glow)}:host([data-state~="warning"]) .status-ring{stroke:var(--elements-warning,#ffbe4a);filter:url(#valve-amber-glow)}:host([data-state~="warning"]) .status-strip{fill:var(--elements-warning,#ffbe4a);filter:url(#valve-amber-glow)}:host([data-state~="alarm"]) .status-ring{stroke:var(--elements-alarm,#ff5c74);filter:url(#valve-red-glow)}:host([data-state~="alarm"]) .status-strip{fill:var(--elements-alarm,#ff5c74);filter:url(#valve-red-glow)}:host([data-state~="alarm"]) .body{stroke:var(--elements-alarm,#ff5c74)}:host(:not([data-state~="powered"])) .positioner-led{fill:#607080;filter:none}:host([data-state~="bad-quality"]) svg{opacity:.42;filter:grayscale(1)}:host([data-state~="stale"]) svg{opacity:.64;filter:saturate(.35)}
${detailStyles({ hideFineBelow: 360, hideStandardBelow: 250 })}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'CV-101', description: 'Equipment label.' }),
    position: attribute.number('position', { defaultValue: 0, description: 'Measured valve travel from 0 to 100 percent.' }),
    command: attribute.number('command', { defaultValue: 0, description: 'Commanded valve travel from 0 to 100 percent.' }),
    flow: attribute.number('flow', { defaultValue: 0, description: 'Current process flow.' }),
    flowUnit: attribute.string('flowUnit', { attribute: 'flow-unit', defaultValue: 'm³/h', description: 'Flow engineering unit.' }),
    powered: attribute.boolean('powered', { description: 'Whether the pneumatic/electrical control chain is available.' }),
    status: attribute.enum('status', ['idle', 'normal', 'warning', 'alarm'] as const, { defaultValue: 'idle', description: 'Process status independent from data quality.' }),
    quality: attribute.enum('quality', ['good', 'stale', 'bad'] as const, { defaultValue: 'good', description: 'Telemetry quality independent from process status.' }),
    detail: attribute.enum('detail', ['auto', 'full', 'compact', 'symbol'] as const, { defaultValue: 'auto', description: 'Visual level of detail.' }),
  },
  states: {
    powered: (context) => booleanValue(context, 'powered'),
    open: (context) => numberValue(context, 'position') > 2,
    moving: (context) => booleanValue(context, 'powered') && Math.abs(numberValue(context, 'command') - numberValue(context, 'position')) > .75,
    warning: (context) => stringValue(context, 'status') === 'warning',
    alarm: (context) => stringValue(context, 'status') === 'alarm',
    stale: (context) => stringValue(context, 'quality') === 'stale',
    'bad-quality': (context) => stringValue(context, 'quality') === 'bad',
  },
  bindings: [
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('position-readout', (context) => `${Math.round(clamp(numberValue(context, 'position'), 0, 100))}%`, ['position']),
    bind.text('setpoint', (context) => `SP ${Math.round(clamp(numberValue(context, 'command'), 0, 100))}%`, ['command']),
    bind.text('flow-value', (context) => `${numberValue(context, 'flow').toFixed(1)} ${stringValue(context, 'flowUnit')}`, ['flow', 'flowUnit']),
    bind.text('mode', (context) => booleanValue(context, 'powered') ? 'REMOTE' : 'AIR FAIL', ['powered']),
    bind.style('flow-line', 'opacity', (context) => String(.08 + normalizedPosition(context, 'position') * clamp(numberValue(context, 'flow') / 100, 0, 1) * .92), ['position', 'flow']),
  ],
  motions: [
    {
      id: 'valve-travel', type: 'scrub', target: 'moving-assembly',
      progress: (context) => normalizedPosition(context, 'position'),
      keyframes: [{ transform: 'translateY(0px)' }, { transform: `translateY(-${geometry.travel}px)` }],
      options: { duration: 1000, fill: 'both', easing: 'linear' }, reducedMotion: 'preserve',
    },
    {
      id: 'actual-travel-marker', type: 'scrub', target: 'actual-marker',
      progress: (context) => normalizedPosition(context, 'position'),
      keyframes: [{ transform: 'translateY(0px)' }, { transform: `translateY(-${geometry.travel}px)` }],
      options: { duration: 1000, fill: 'both', easing: 'linear' }, reducedMotion: 'preserve',
    },
    {
      id: 'command-travel-marker', type: 'scrub', target: 'command-marker',
      progress: (context) => normalizedPosition(context, 'command'),
      keyframes: [{ transform: 'translateY(0px)' }, { transform: `translateY(-${geometry.travel}px)` }],
      options: { duration: 1000, fill: 'both', easing: 'linear' }, reducedMotion: 'preserve',
    },
    {
      id: 'process-flow', type: 'loop', target: 'flow-line',
      active: (context) => stateValue(context, 'powered') && stateValue(context, 'open') && numberValue(context, 'flow') > 0,
      playbackRate: (context) => Math.max(.15, numberValue(context, 'flow') / 45),
      phase: 'process-flow',
      keyframes: [{ strokeDashoffset: '0' }, { strokeDashoffset: '-44' }],
      options: { duration: 900, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze',
    },
    {
      id: 'position-change', type: 'transition', target: 'actuator-glow',
      trigger: (context) => numberValue(context, 'position'),
      enabled: (context) => stateValue(context, 'powered'),
      keyframes: [{ opacity: .08 }, { opacity: .5 }, { opacity: .12 }],
      options: { duration: 320, easing: 'ease-out' }, reducedMotion: 'finish',
    },
    {
      id: 'moving-pulse', type: 'loop', target: 'status-ring',
      active: (context) => stateValue(context, 'moving'),
      keyframes: [{ opacity: .3 }, { opacity: 1 }, { opacity: .3 }],
      options: { duration: 760, iterations: Infinity, easing: 'ease-in-out' }, reducedMotion: 'finish',
    },
    {
      id: 'alarm-pulse', type: 'loop', target: 'status-strip',
      active: (context) => stateValue(context, 'alarm'),
      keyframes: [{ opacity: .25 }, { opacity: 1 }, { opacity: .25 }],
      options: { duration: 680, iterations: Infinity, easing: 'ease-in-out' }, reducedMotion: 'finish',
    },
  ],
  ports: [
    { id: 'in', x: geometry.inletX, y: geometry.processY, direction: 'left', kind: 'process' },
    { id: 'out', x: geometry.outletX, y: geometry.processY, direction: 'right', kind: 'process' },
    { id: 'signal', x: geometry.signalX, y: geometry.signalY, direction: 'right', kind: 'pneumatic' },
  ],
  parts: [
    { name: 'housing', description: 'Globe-style pressure body.', detail: 'essential' },
    { name: 'moving-assembly', description: 'Stem and plug travel assembly.', detail: 'essential' },
    { name: 'plug', description: 'Modulating plug seated in the process bore.', detail: 'essential' },
    { name: 'actuator', description: 'Pneumatic diaphragm actuator.', detail: 'essential' },
    { name: 'positioner', description: 'Digital valve positioner.', detail: 'essential' },
    { name: 'flow-line', description: 'Internal process-flow indication.', detail: 'essential' },
    { name: 'status-ring', description: 'Travel and process status ring.', detail: 'essential' },
    { name: 'actual-marker', description: 'Measured stem travel marker.', detail: 'standard' },
    { name: 'command-marker', description: 'Commanded stem travel marker.', detail: 'standard' },
    { name: 'position-readout', detail: 'standard' },
    { name: 'status-strip', detail: 'standard' },
    { name: 'label', detail: 'standard' },
    { name: 'mode', detail: 'standard' },
    { name: 'setpoint', detail: 'standard' },
    { name: 'flow-value', detail: 'standard' },
  ],
});
