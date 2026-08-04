import {
  attribute,
  bind,
  defineElementDefinition,
  defineFragment,
  svg,
  type ElementContext,
  type FragmentPlacement,
} from '@pom4h/elements-core';
import { booleanValue, clamp, numberValue, stateValue, stringValue } from '../shared.js';

const enclosure = defineFragment({
  name: 'controller-enclosure',
  template: svg`
    <g>
      <rect data-part="enclosure" x="8" y="8" width="224" height="126" rx="8" />
      <rect data-part="display-frame" x="24" y="24" width="88" height="42" rx="4" />
      <text data-part="display" x="68" y="50" text-anchor="middle">RUN</text>
      <circle data-part="comm-led" cx="128" cy="34" r="5" />
      <circle data-part="status-led" cx="148" cy="34" r="5" />
      <rect data-part="load-track" x="124" y="50" width="88" height="8" rx="4" />
      <rect data-part="load-bar" x="124" y="50" width="88" height="8" rx="4" />
      <path data-part="scan-line" d="M22 76 H218" />
    </g>
  `,
});

const channel = defineFragment({
  name: 'controller-channel',
  template: svg`
    <g>
      <rect data-part="channel-body" x="0" y="0" width="22" height="38" rx="3" />
      <circle data-part="channel-led" cx="11" cy="10" r="4" />
      <text data-part="channel-label" x="11" y="29" text-anchor="middle"></text>
    </g>
  `,
});

function channelCount(context: ElementContext, name: string): number {
  return Math.round(clamp(numberValue(context, name), 0, 32));
}

function bitAt(value: string, index: number): boolean {
  return value[index] === '1';
}

function channelMetadata(target: Element): { kind: 'input' | 'output'; index: number } | undefined {
  const instance = target.closest<SVGElement>('[data-instance]');
  if (!instance) return undefined;
  const kind = instance.getAttribute('data-kind');
  const index = Number(instance.getAttribute('data-index'));
  if ((kind !== 'input' && kind !== 'output') || !Number.isInteger(index)) return undefined;
  return { kind, index };
}

function controllerParts(context: ElementContext): readonly FragmentPlacement[] {
  const inputs = channelCount(context, 'inputs');
  const outputs = channelCount(context, 'outputs');
  const placements: FragmentPlacement[] = [{ key: 'enclosure', fragment: enclosure }];
  const columns = 8;
  const startX = 20;
  const startY = 82;
  const gapX = 25;
  const gapY = 44;

  for (let index = 0; index < inputs; index += 1) {
    placements.push({
      key: `input-${index}`,
      fragment: channel,
      x: startX + (index % columns) * gapX,
      y: startY + Math.floor(index / columns) * gapY,
      attributes: { 'data-kind': 'input', 'data-index': index },
    });
  }

  const outputRows = Math.ceil(inputs / columns);
  const outputY = startY + outputRows * gapY;
  for (let index = 0; index < outputs; index += 1) {
    placements.push({
      key: `output-${index}`,
      fragment: channel,
      x: startX + (index % columns) * gapX,
      y: outputY + Math.floor(index / columns) * gapY,
      attributes: { 'data-kind': 'output', 'data-index': index },
    });
  }
  return placements;
}

export const controllerDefinition = defineElementDefinition({
  tagName: 'pe-controller',
  displayName: 'Programmable controller',
  description: 'A composable controller with generated I/O channels, scan motion and live channel state.',
  viewBox: '0 0 240 220',
  template: svg`
    <g data-mount="controller"></g>
    <text data-part="label" x="120" y="210" text-anchor="middle"></text>
  `,
  styles: `
    :host {
      display: inline-block;
      width: 320px;
      aspect-ratio: 240 / 220;
      color: var(--elements-ink, #d8e2f0);
      contain: content;
    }
    svg { width: 100%; height: 100%; overflow: visible; }
    [data-part="enclosure"] {
      fill: var(--elements-surface, #151f2d);
      stroke: currentColor;
      stroke-width: 2;
      vector-effect: non-scaling-stroke;
    }
    [data-part="display-frame"] { fill: #08120f; stroke: #45675d; }
    [data-part="display"] { fill: #85f3bf; font: 700 12px/1 ui-monospace, monospace; }
    [data-part="comm-led"], [data-part="status-led"], [data-part="channel-led"] {
      fill: #334155;
      stroke: color-mix(in srgb, currentColor 35%, transparent);
      stroke-width: 1;
      transform-box: fill-box;
      transform-origin: center;
    }
    [data-part="comm-led"] { fill: #48b8ff; opacity: .35; }
    [data-part="status-led"] { fill: #53df8d; }
    [data-part="load-track"] { fill: #263445; }
    [data-part="load-bar"] {
      fill: #5ec8ff;
      transform-box: fill-box;
      transform-origin: left center;
    }
    [data-part="scan-line"] {
      stroke: #5ec8ff;
      stroke-width: 1;
      opacity: .25;
      transform-box: fill-box;
      transform-origin: center;
    }
    [data-part="channel-body"] { fill: #1b2939; stroke: #53657a; }
    [data-part="channel-label"] { fill: currentColor; font: 600 7px/1 ui-monospace, monospace; }
    [data-part="channel-led"][data-active] { fill: #53df8d; filter: drop-shadow(0 0 3px #53df8d); }
    [data-instance^="output-"] [data-part="channel-led"][data-active] { fill: #ffbe3d; filter: drop-shadow(0 0 3px #ffbe3d); }
    [data-part="label"] { fill: currentColor; font: 600 10px/1 system-ui; }
    :host([data-state~="alarm"]) [data-part="status-led"] { fill: #ff5c72; }
    :host([data-state~="warning"]) [data-part="status-led"] { fill: #ffbe3d; }
    :host([data-state~="stale"]) { opacity: .72; }
    :host([data-state~="bad-quality"]) { opacity: .48; filter: grayscale(1); }
  `,
  attributes: {
    label: attribute.string('label', { defaultValue: 'PLC-01', description: 'Controller label.' }),
    running: attribute.boolean('running', { description: 'Whether the controller scan cycle is running.' }),
    inputs: attribute.number('inputs', { defaultValue: 8, description: 'Number of generated digital input channels.' }),
    outputs: attribute.number('outputs', { defaultValue: 4, description: 'Number of generated digital output channels.' }),
    inputState: attribute.string('inputState', { attribute: 'input-state', defaultValue: '', description: 'Input bit string.' }),
    outputState: attribute.string('outputState', { attribute: 'output-state', defaultValue: '', description: 'Output bit string.' }),
    scanRate: attribute.number('scanRate', { attribute: 'scan-rate', defaultValue: 10, description: 'Scan cycles per second.' }),
    load: attribute.number('load', { defaultValue: 0, description: 'Controller load from 0 to 100.' }),
    activity: attribute.number('activity', { defaultValue: 0, description: 'Monotonic communication activity sequence.' }),
    status: attribute.enum('status', ['idle', 'normal', 'warning', 'alarm'] as const, {
      defaultValue: 'idle',
      description: 'Controller process status.',
    }),
    quality: attribute.enum('quality', ['good', 'stale', 'bad'] as const, {
      defaultValue: 'good',
      description: 'Controller data quality.',
    }),
  },
  states: {
    running: (context) => booleanValue(context, 'running'),
    warning: (context) => stringValue(context, 'status') === 'warning',
    alarm: (context) => stringValue(context, 'status') === 'alarm',
    stale: (context) => stringValue(context, 'quality') === 'stale',
    'bad-quality': (context) => stringValue(context, 'quality') === 'bad',
  },
  collections: [{ mount: 'controller', items: controllerParts }],
  bindings: [
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text(
      'display',
      (context) => stateValue(context, 'alarm') ? 'FAULT' : stateValue(context, 'running') ? 'RUN' : 'STOP',
      ['running', 'alarm'],
    ),
    bind.booleanAttribute(
      'channel-led',
      'data-active',
      (context, target) => {
        const metadata = channelMetadata(target);
        if (!metadata) return false;
        const bits = stringValue(context, metadata.kind === 'input' ? 'inputState' : 'outputState');
        return bitAt(bits, metadata.index);
      },
      ['inputState', 'outputState', 'inputs', 'outputs'],
    ),
    bind.text(
      'channel-label',
      (_context, target) => {
        const metadata = channelMetadata(target);
        return metadata ? `${metadata.kind === 'input' ? 'I' : 'Q'}${metadata.index}` : '';
      },
      ['inputs', 'outputs'],
    ),
  ],
  motions: [
    {
      id: 'scan-cycle',
      type: 'loop',
      target: 'scan-line',
      active: (context) => stateValue(context, 'running'),
      playbackRate: (context) => Math.max(0.1, numberValue(context, 'scanRate') / 10),
      phase: 'controller-scan',
      keyframes: [{ transform: 'translateY(0px)', opacity: 0.15 }, { transform: 'translateY(46px)', opacity: 0.5 }],
      options: { duration: 1000, iterations: Infinity, easing: 'linear', direction: 'alternate' },
    },
    {
      id: 'communication-flash',
      type: 'transition',
      target: 'comm-led',
      trigger: (context) => numberValue(context, 'activity'),
      keyframes: [{ opacity: 0.35, transform: 'scale(1)' }, { opacity: 1, transform: 'scale(1.35)' }, { opacity: 0.35, transform: 'scale(1)' }],
      options: { duration: 180, easing: 'ease-out' },
    },
    {
      id: 'load-progress',
      type: 'scrub',
      target: 'load-bar',
      progress: (context) => clamp(numberValue(context, 'load') / 100, 0, 1),
      keyframes: [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
      options: { duration: 1000, fill: 'both' },
    },
    {
      id: 'alarm-pulse',
      type: 'loop',
      target: 'status-led',
      active: (context) => stateValue(context, 'alarm'),
      keyframes: [{ opacity: 0.35 }, { opacity: 1 }, { opacity: 0.35 }],
      options: { duration: 700, iterations: Infinity, easing: 'ease-in-out' },
    },
  ],
  ports: [
    { id: 'power', x: 8, y: 34, direction: 'left', kind: 'electrical' },
    { id: 'network', x: 232, y: 34, direction: 'right', kind: 'network' },
    { id: 'inputs', x: 44, y: 134, direction: 'bottom', kind: 'signal' },
    { id: 'outputs', x: 196, y: 134, direction: 'bottom', kind: 'signal' },
  ],
  parts: [
    { name: 'enclosure' },
    { name: 'display' },
    { name: 'comm-led' },
    { name: 'status-led' },
    { name: 'scan-line' },
    { name: 'load-bar' },
    { name: 'channel-body' },
    { name: 'channel-led' },
    { name: 'channel-label' },
    { name: 'label' },
  ],
});
