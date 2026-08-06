import {
  attribute,
  bind,
  defineElementDefinition,
  defineFragment,
  svg,
  viewBox,
  type ElementContext,
  type FragmentPlacement,
} from '@pom4h/elements-core';
import { booleanValue, clamp, numberValue, stateValue, stringValue } from '../shared.js';

function channelIndicators(): string {
  return Array.from({ length: 8 }, (_, index) => {
    const x = 16 + (index % 4) * 18;
    const y = 66 + Math.floor(index / 4) * 18;
    return `<circle class="channel-led" data-part="channel-led" data-channel="${index}" cx="${x}" cy="${y}" r="4"/><text class="channel-number" data-part="channel-number" data-channel="${index}" data-detail="standard" x="${x}" y="${y + 11}" text-anchor="middle">${index}</text>`;
  }).join('');
}

function terminalBank(): string {
  return Array.from({ length: 8 }, (_, index) => {
    const x = index % 2 === 0 ? 9 : 45;
    const y = 111 + Math.floor(index / 2) * 17;
    return `<g data-part="terminal" data-channel="${index}" data-detail="standard"><rect class="terminal" x="${x}" y="${y}" width="33" height="14" rx="2"/><circle class="terminal-hole" data-detail="fine" cx="${x + 8}" cy="${y + 7}" r="3.6"/><circle class="terminal-screw" data-detail="fine" cx="${x + 25}" cy="${y + 7}" r="3.2"/><path d="M${x + 22.5} ${y + 7} H${x + 27.5}" stroke="#32485c" stroke-width=".65" data-detail="fine"/></g>`;
  }).join('');
}

const cpu = defineFragment({
  name: 'controller-cpu',
  template: svg`<g><rect class="cpu" width="174" height="188" rx="7" data-part="cpu-body"/><path class="top-bevel" d="M7 1 H167 Q173 1 173 8 V28 H1 V8 Q1 1 7 1Z"/><text class="brand" x="14" y="18" data-detail="fine">ELEMENTS AUTOMATION</text><text class="model" x="14" y="40" data-part="label">PLC-X2</text><circle class="quality-led" cx="128" cy="36" r="4" data-part="quality-led" data-quality-indicator/><circle class="status-led" cx="143" cy="36" r="5" data-part="status-led" data-status-primary/><circle class="comm-led" cx="158" cy="36" r="5" data-part="comm-led" data-operation-marker/>
<rect class="display-frame" x="14" y="51" width="102" height="55" rx="4"/><path class="display-grid" d="M18 64 H112 M18 78 H112 M18 92 H112 M38 55 V102 M62 55 V102 M86 55 V102" data-detail="fine"/><text class="display-main" data-quality-sensitive x="65" y="79" text-anchor="middle" data-part="display">RUN</text><text class="display-sub" data-quality-sensitive x="65" y="94" text-anchor="middle" data-part="scan-readout">SCAN 10.0 ms</text>
<rect class="port" x="126" y="55" width="34" height="30" rx="3"/><g><rect class="port-pin" x="132" y="61" width="3" height="6"/><rect class="port-pin" x="138" y="61" width="3" height="6"/><rect class="port-pin" x="144" y="61" width="3" height="6"/><rect class="port-pin" x="150" y="61" width="3" height="6"/></g><text class="module-sub" x="143" y="80" text-anchor="middle" data-detail="fine">LAN</text>
<rect class="slot" x="126" y="93" width="34" height="11" rx="2"/><text class="module-sub" x="143" y="101" text-anchor="middle" data-detail="fine">µSD</text>
<path class="vent" d="M14 120 H160 M14 126 H160 M14 132 H160" data-detail="fine"/><text class="module-sub" x="14" y="147" data-detail="fine">CPU LOAD</text><rect class="load-track" x="14" y="153" width="146" height="7" rx="3.5" data-detail="standard"/><rect class="load" x="14" y="153" width="146" height="7" rx="3.5" data-part="load-bar" data-quality-sensitive data-detail="standard"/>
<path class="scan" d="M16 171 H158" data-part="scan-line" data-detail="standard"/><text class="module-sub" x="14" y="181" data-detail="fine">PWR 24VDC · ETH · RS-485</text><path class="din-clip" d="M58 187 H116 L108 199 H66 Z"/></g>`,
});

const ioModule = defineFragment({
  name: 'controller-io-module',
  template: svg`<g><rect class="module" width="88" height="188" rx="6" data-part="module-body"/><path class="top-bevel" d="M6 1 H82 Q87 1 87 7 V24 H1 V7 Q1 1 6 1Z"/><text class="module-name" x="10" y="18" data-part="module-name">DI 8×24V</text><text class="module-sub" x="10" y="32" data-part="module-sub" data-detail="fine">DIGITAL INPUT</text><rect class="label-box" x="10" y="39" width="68" height="14" rx="2" data-detail="standard"/><text class="label-dark" x="44" y="49" text-anchor="middle" data-part="module-range" data-detail="standard">I0.0 — I0.7</text><g data-part="channel-bank" data-quality-sensitive>${channelIndicators()}</g><g data-part="terminal-bank">${terminalBank()}</g><path class="din-clip" d="M23 187 H65 L59 198 H29 Z"/></g>`,
});

function channelCount(context: ElementContext, name: string): number {
  return Math.round(clamp(numberValue(context, name), 0, 32));
}

function moduleCount(context: ElementContext, name: string): number {
  return Math.ceil(channelCount(context, name) / 8);
}

function totalModules(context: ElementContext): number {
  return moduleCount(context, 'inputs') + moduleCount(context, 'outputs');
}

function controllerWidth(context: ElementContext): number {
  return 214 + totalModules(context) * 98;
}

function controllerParts(context: ElementContext): readonly FragmentPlacement[] {
  const inputs = channelCount(context, 'inputs');
  const outputs = channelCount(context, 'outputs');
  const placements: FragmentPlacement[] = [{ key: 'cpu', fragment: cpu, x: 18, y: 22 }];
  let moduleIndex = 0;

  for (const [kind, count] of [['input', inputs], ['output', outputs]] as const) {
    for (let bank = 0; bank < Math.ceil(count / 8); bank += 1) {
      placements.push({
        key: `${kind}-${bank}`,
        fragment: ioModule,
        x: 204 + moduleIndex * 98,
        y: 22,
        attributes: { 'data-kind': kind, 'data-offset': bank * 8, 'data-count': count },
      });
      moduleIndex += 1;
    }
  }
  return placements;
}

interface ChannelMetadata {
  readonly kind: 'input' | 'output';
  readonly local: number;
  readonly offset: number;
  readonly count: number;
}

function channelMetadata(target: Element): ChannelMetadata | undefined {
  const instance = target.closest<SVGElement>('[data-instance]');
  const kind = instance?.getAttribute('data-kind');
  const local = Number(target.getAttribute('data-channel'));
  const offset = Number(instance?.getAttribute('data-offset'));
  const count = Number(instance?.getAttribute('data-count'));
  if ((kind !== 'input' && kind !== 'output') || !Number.isInteger(local) || !Number.isInteger(offset) || !Number.isInteger(count)) return undefined;
  return { kind, local, offset, count };
}

function moduleMetadata(target: Element): { kind: 'input' | 'output'; offset: number } | undefined {
  const instance = target.closest<SVGElement>('[data-instance]');
  const kind = instance?.getAttribute('data-kind');
  const offset = Number(instance?.getAttribute('data-offset'));
  if ((kind !== 'input' && kind !== 'output') || !Number.isInteger(offset)) return undefined;
  return { kind, offset };
}

function bitAt(value: string, index: number): boolean {
  return value[index] === '1';
}

export const controllerDefinition = defineElementDefinition({
  tagName: 'pe-controller',
  displayName: 'Programmable controller',
  description: 'A modular programmable controller with generated I/O modules, dynamic viewport and semantic level of detail.',
  viewBox: viewBox('0 0 606 260', (context) => `0 0 ${controllerWidth(context)} 260`),
  template: svg`<defs>
<linearGradient id="rail" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8191a0"/><stop offset=".42" stop-color="#354758"/><stop offset=".58" stop-color="#1d2d3d"/><stop offset="1" stop-color="#6f8191"/></linearGradient>
<linearGradient id="case" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#354b61"/><stop offset=".22" stop-color="#25394d"/><stop offset=".7" stop-color="#172739"/><stop offset="1" stop-color="#102030"/></linearGradient>
<linearGradient id="bevel" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#698097" stop-opacity=".55"/><stop offset="1" stop-color="#1a2b3d" stop-opacity="0"/></linearGradient>
<linearGradient id="screw" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e6eef4"/><stop offset=".5" stop-color="#778c9f"/><stop offset="1" stop-color="#273b4d"/></linearGradient>
<linearGradient id="load" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#48c8ff"/><stop offset=".68" stop-color="#5ce2c2"/><stop offset="1" stop-color="#ffbd4a"/></linearGradient>
<filter id="plc-shadow" x="-20%" y="-20%" width="150%" height="170%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#000" flood-opacity=".38"/></filter>
<filter id="screen-glow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#8df7c4" flood-opacity=".32"/></filter>
<filter id="io-green" x="-150%" y="-150%" width="400%" height="400%"><feDropShadow dx="0" dy="0" stdDeviation="2.2" flood-color="#58e39a" flood-opacity=".75"/></filter>
<filter id="io-amber" x="-150%" y="-150%" width="400%" height="400%"><feDropShadow dx="0" dy="0" stdDeviation="2.2" flood-color="#ffbd4a" flood-opacity=".7"/></filter>
<filter id="cyan-glow" x="-120%" y="-120%" width="340%" height="340%"><feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#52c8ff" flood-opacity=".72"/></filter>
<filter id="red-glow" x="-120%" y="-120%" width="340%" height="340%"><feDropShadow dx="0" dy="0" stdDeviation="2.4" flood-color="#ff5c74" flood-opacity=".74"/></filter>
<pattern id="rail-pattern" width="74" height="12" patternUnits="userSpaceOnUse"><rect x="10" y="2" width="52" height="8" rx="2" fill="#132031" stroke="#74879b" stroke-width=".7"/></pattern></defs>
<g class="plc"><rect data-part="rail-body" class="rail" x="12" y="211" height="23" rx="3"/><rect data-part="rail-slots" x="12" y="216" height="13" fill="url(#rail-pattern)" opacity=".72"/><g data-mount="controller"/></g>`,
  styles: `
:host{display:inline-block;width:var(--controller-intrinsic-width,606px);max-width:100%;aspect-ratio:var(--elements-aspect-ratio,606 / 260);color:var(--elements-ink,#dbe7f3);container-type:inline-size;contain:layout style}svg{width:100%;height:100%;overflow:visible}
.plc .rail{fill:url(#rail);stroke:#7f90a2;stroke-width:1.2}.plc .cpu,.plc .module{fill:url(#case);stroke:#8ca0b5;stroke-width:1.4;filter:url(#plc-shadow)}.plc .top-bevel{fill:url(#bevel);opacity:.78}.plc .brand{fill:#91a7bd;font:700 8px/1 ui-monospace,monospace;letter-spacing:.12em}.plc .model{fill:#e3edf6;font:800 13px/1 ui-monospace,monospace}.plc .display-frame{fill:#06120f;stroke:#406c5b;stroke-width:1.2}.plc .display-grid{stroke:rgba(74,160,122,.12);stroke-width:.6}.plc .display-main{fill:#8df7c4;font:800 15px/1 ui-monospace,monospace;filter:url(#screen-glow)}.plc .display-sub{fill:#4da87d;font:600 6.5px/1 ui-monospace,monospace}.plc .port{fill:#0a1119;stroke:#52677a;stroke-width:1}.plc .port-pin{fill:#c89e4e}.plc .slot{fill:#0b131d;stroke:#586d82;stroke-width:.9}.plc .vent{stroke:#4c6075;stroke-width:1}.plc .label-box{fill:#dce5ea;stroke:#8ba0b3;stroke-width:.7}.plc .label-dark{fill:#172434;font:800 7px/1 ui-monospace,monospace}.plc .channel-led{fill:#25374b;stroke:#71879d;stroke-width:.8}.plc .channel-number{fill:#8ba0b4;font:700 5.5px/1 ui-monospace,monospace}.plc .terminal{fill:#26384c;stroke:#72879c;stroke-width:.75}.plc .terminal-hole{fill:#081019;stroke:#637a90;stroke-width:.55}.plc .terminal-screw{fill:url(#screw);stroke:#c4d1dc;stroke-width:.45}.plc .module-name{fill:#dfe8f1;font:800 8px/1 ui-monospace,monospace}.plc .module-sub{fill:#6f8499;font:650 5.7px/1 ui-monospace,monospace}.plc .quality-led{fill:#72869a;stroke:#a8b7c5;stroke-width:.7}.plc .status-led{fill:#58e39a;stroke:#baffd8;stroke-width:.8;filter:url(#io-green)}.plc .comm-led{fill:#52c8ff;stroke:#bceeff;stroke-width:.7;filter:url(#cyan-glow)}.plc .scan{fill:none;stroke:#52c8ff;stroke-width:1.2;opacity:.45;stroke-dasharray:4 4}.plc .load-track{fill:#203247}.plc .load{fill:url(#load);transform-box:fill-box;transform-origin:left center}.plc .din-clip{fill:#1c2a3a;stroke:#667a8f;stroke-width:1}[data-quality-sensitive]{opacity:.42}
[data-kind="output"] .channel-led[data-active]{fill:#ffbd4a;stroke:#ffe1a4;filter:url(#io-amber)}.channel-led[data-active]{fill:#58e39a;stroke:#a7ffd0;filter:url(#io-green)}[data-disabled]{opacity:.18}:host([status="warning"]) .status-led{fill:var(--elements-warning,#ffbe4a);stroke:#ffe1a4;filter:url(#io-amber)}:host([status="alarm"]) .status-led{fill:var(--elements-alarm,#ff5c74);stroke:#ffc0ca;filter:url(#red-glow)}:host([quality="good"]) [data-quality-sensitive]{opacity:1}:host([quality="stale"]) [data-quality-sensitive]{opacity:.62}:host([quality="bad"]) [data-quality-sensitive]{opacity:.26}:host([quality="good"]) .quality-led{fill:var(--elements-ok,#56e29a);stroke:#baffd8}:host([quality="stale"]) .quality-led{fill:var(--elements-warning,#ffbe4a);stroke:#ffe1a4}:host([quality="bad"]) .quality-led{fill:var(--elements-alarm,#ff5c74);stroke:#ffc0ca}:host([detail="compact"]) [data-detail="fine"],:host([detail="symbol"]) [data-detail]{display:none}:host([detail="symbol"]) text{display:none}@container (max-width:520px){[data-detail="fine"]{display:none}}@container (max-width:390px){[data-detail="standard"]{display:none}.channel-led{r:5px}.module-name{font-size:10px}}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'PLC-X2', description: 'Controller label.' }),
    running: attribute.boolean('running', { description: 'Whether the controller scan cycle is running.' }),
    inputs: attribute.number('inputs', { defaultValue: 16, description: 'Digital input channel count from 0 to 32.' }),
    outputs: attribute.number('outputs', { defaultValue: 16, description: 'Digital output channel count from 0 to 32.' }),
    inputState: attribute.string('inputState', { attribute: 'input-state', defaultValue: '', description: 'Input bit string.' }),
    outputState: attribute.string('outputState', { attribute: 'output-state', defaultValue: '', description: 'Output bit string.' }),
    scanRate: attribute.number('scanRate', { attribute: 'scan-rate', defaultValue: 10, description: 'Scan cycles per second.' }),
    load: attribute.number('load', { defaultValue: 0, description: 'Controller load from 0 to 100.' }),
    activity: attribute.number('activity', { defaultValue: 0, description: 'Monotonic communication activity sequence.' }),
    status: attribute.enum('status', ['normal', 'warning', 'alarm'] as const, { defaultValue: 'normal', description: 'Controller severity independent from operation and data quality.' }),
    quality: attribute.enum('quality', ['unknown', 'good', 'stale', 'bad'] as const, { defaultValue: 'unknown', description: 'Controller telemetry quality.' }),
    detail: attribute.enum('detail', ['auto', 'full', 'compact', 'symbol'] as const, { defaultValue: 'auto', description: 'Visual level of detail. Auto uses container queries.' }),
  },
  states: {
    running: (context) => booleanValue(context, 'running'),
  },
  collections: [{ mount: 'controller', items: controllerParts }],
  bindings: [
    bind.style('host', '--controller-intrinsic-width', (context) => `${controllerWidth(context)}px`, ['inputs', 'outputs']),
    bind.attribute('rail-body', 'width', (context) => controllerWidth(context) - 24, ['inputs', 'outputs']),
    bind.attribute('rail-slots', 'width', (context) => controllerWidth(context) - 24, ['inputs', 'outputs']),
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('display', (context) => stringValue(context, 'status') === 'alarm' ? 'FAULT' : stateValue(context, 'running') ? 'RUN' : 'STOP', ['running', 'status']),
    bind.text('scan-readout', (context) => `SCAN ${(1000 / Math.max(.1, numberValue(context, 'scanRate'))).toFixed(1)} ms`, ['scanRate']),
    bind.text('module-name', (_context, target) => moduleMetadata(target)?.kind === 'output' ? 'DO 8×0.5A' : 'DI 8×24V', ['inputs', 'outputs']),
    bind.text('module-sub', (_context, target) => moduleMetadata(target)?.kind === 'output' ? 'DIGITAL OUTPUT' : 'DIGITAL INPUT', ['inputs', 'outputs']),
    bind.text('module-range', (_context, target) => {
      const metadata = moduleMetadata(target);
      if (!metadata) return '';
      const prefix = metadata.kind === 'output' ? 'Q' : 'I';
      const bank = Math.floor(metadata.offset / 8);
      return `${prefix}${bank}.0 — ${prefix}${bank}.7`;
    }, ['inputs', 'outputs']),
    bind.booleanAttribute('channel-led', 'data-active', (context, target) => {
      const metadata = channelMetadata(target);
      if (!metadata) return false;
      const index = metadata.offset + metadata.local;
      const bits = stringValue(context, metadata.kind === 'input' ? 'inputState' : 'outputState');
      return index < metadata.count && bitAt(bits, index);
    }, ['inputState', 'outputState', 'inputs', 'outputs']),
    bind.booleanAttribute('channel-led', 'data-disabled', (_context, target) => {
      const metadata = channelMetadata(target);
      return metadata === undefined || metadata.offset + metadata.local >= metadata.count;
    }, ['inputs', 'outputs']),
    bind.booleanAttribute('terminal', 'data-disabled', (_context, target) => {
      const metadata = channelMetadata(target);
      return metadata === undefined || metadata.offset + metadata.local >= metadata.count;
    }, ['inputs', 'outputs']),
  ],
  motions: [
    { id: 'scan-cycle', type: 'loop', target: 'scan-line', active: (context) => stateValue(context, 'running'), playbackRate: (context) => Math.max(.1, numberValue(context, 'scanRate') / 10), phase: 'controller-scan', keyframes: [{ strokeDashoffset: 0 }, { strokeDashoffset: -24 }], options: { duration: 1000, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze' },
    { id: 'communication-flash', type: 'transition', target: 'comm-led', trigger: (context) => numberValue(context, 'activity'), keyframes: [{ opacity: .28, transform: 'scale(1)' }, { opacity: 1, transform: 'scale(1.35)' }, { opacity: .28, transform: 'scale(1)' }], options: { duration: 180, easing: 'ease-out' }, reducedMotion: 'finish' },
    { id: 'load-progress', type: 'scrub', target: 'load-bar', progress: (context) => clamp(numberValue(context, 'load') / 100, 0, 1), keyframes: [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], options: { duration: 1000, fill: 'both' }, reducedMotion: 'preserve' },
    { id: 'severity-change', type: 'transition', target: 'status-led', trigger: (context) => stringValue(context, 'status'), enabled: (context) => stringValue(context, 'status') !== 'normal', keyframes: [{ opacity: .35 }, { opacity: 1 }, { opacity: .72 }, { opacity: 1 }], options: { duration: 380, easing: 'ease-out' }, reducedMotion: 'finish' },
  ],
  ports: [
    { id: 'power', x: 18, y: 58, direction: 'left', kind: 'electrical' },
    { id: 'network', x: 192, y: 85, direction: 'right', kind: 'network' },
    { id: 'io-bus', x: 120, y: 210, direction: 'bottom', kind: 'signal' },
  ],
  parts: [
    { name: 'cpu-body', detail: 'essential' },
    { name: 'display', detail: 'essential' },
    { name: 'status-led', description: 'Primary severity indicator.', detail: 'essential' },
    { name: 'quality-led', description: 'Telemetry quality indicator.', detail: 'essential' },
    { name: 'comm-led', detail: 'essential' },
    { name: 'module-body', detail: 'essential' },
    { name: 'channel-led', detail: 'essential' },
    { name: 'module-name', detail: 'essential' },
    { name: 'module-range', detail: 'standard' },
    { name: 'terminal', detail: 'standard' },
    { name: 'load-bar', detail: 'standard' },
    { name: 'scan-line', detail: 'standard' },
    { name: 'module-sub', detail: 'fine' },
  ],
});
