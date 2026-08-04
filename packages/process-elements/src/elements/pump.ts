import {
  attribute,
  bind,
  defineElementDefinition,
  defineFragment,
  svg,
  type FragmentPlacement,
} from '@pom4h/elements-core';
import { booleanValue, numberValue, stateValue, stringValue } from '../shared.js';

const housing = defineFragment({
  name: 'pump-housing',
  template: svg`
    <g>
      <path data-part="housing" d="M18 52 H52 C58 30 86 24 104 38 C119 50 120 73 105 86 C87 102 58 94 52 72 H18 Z" />
      <path data-part="flow-mark" d="M28 62 H45" />
      <circle data-part="status-ring" cx="82" cy="62" r="34" />
    </g>
  `,
});

const motor = defineFragment({
  name: 'pump-motor',
  template: svg`
    <g>
      <rect data-part="motor" x="104" y="44" width="42" height="36" rx="5" />
      <path data-part="motor-fin" d="M112 48 V76 M120 48 V76 M128 48 V76 M136 48 V76" />
      <path data-part="shaft" d="M96 62 H108" />
    </g>
  `,
});

const rotor = defineFragment({
  name: 'pump-rotor',
  template: svg`
    <g>
      <circle data-part="rotor-hub" cx="82" cy="62" r="7" />
      <path data-part="rotor" d="M82 38 C89 43 91 49 88 56 C97 53 104 56 108 62 C102 69 95 71 88 68 C91 77 88 84 82 88 C75 83 73 76 76 68 C67 72 59 69 55 62 C60 55 67 53 76 56 C73 49 75 42 82 38 Z" />
    </g>
  `,
});

const assembly: readonly FragmentPlacement[] = [
  { key: 'housing', fragment: housing },
  { key: 'motor', fragment: motor },
  { key: 'rotor', fragment: rotor },
];

export const pumpDefinition = defineElementDefinition({
  tagName: 'pe-pump',
  displayName: 'Pump',
  description: 'A stateful centrifugal pump with coordinated rotor, status and flow motion.',
  viewBox: '0 0 164 124',
  template: svg`
    <g data-mount="assembly"></g>
    <text data-part="label" x="82" y="108" text-anchor="middle"></text>
    <text data-part="readout" x="82" y="120" text-anchor="middle"></text>
  `,
  styles: `
    :host {
      display: inline-block;
      width: 164px;
      aspect-ratio: 164 / 124;
      color: var(--elements-ink, #d8e2f0);
      contain: content;
    }
    svg { width: 100%; height: 100%; overflow: visible; }
    [data-part="housing"], [data-part="motor"] {
      fill: var(--elements-surface, #182231);
      stroke: currentColor;
      stroke-width: 2;
      vector-effect: non-scaling-stroke;
      transform-box: fill-box;
      transform-origin: center;
    }
    [data-part="motor-fin"], [data-part="shaft"], [data-part="flow-mark"] {
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      vector-effect: non-scaling-stroke;
    }
    [data-part="flow-mark"] { stroke-dasharray: 4 4; }
    [data-part="rotor"], [data-part="rotor-hub"] {
      fill: var(--elements-accent, #5ec8ff);
      transform-box: fill-box;
      transform-origin: center;
    }
    [data-part="status-ring"] {
      fill: none;
      stroke: color-mix(in srgb, currentColor 35%, transparent);
      stroke-width: 3;
      vector-effect: non-scaling-stroke;
    }
    [data-part="label"] { fill: currentColor; font: 600 9px/1 system-ui; }
    [data-part="readout"] { fill: color-mix(in srgb, currentColor 72%, transparent); font: 8px/1 ui-monospace, monospace; }
    :host([data-state~="warning"]) [data-part="status-ring"] { stroke: var(--elements-warning, #ffbe3d); }
    :host([data-state~="alarm"]) [data-part="status-ring"] { stroke: var(--elements-alarm, #ff5c72); }
    :host([data-state~="bad-quality"]) { opacity: .48; filter: grayscale(1); }
    :host([data-state~="stale"]) { opacity: .72; }
  `,
  attributes: {
    label: attribute.string('label', { defaultValue: 'P-101', description: 'Equipment label.' }),
    running: attribute.boolean('running', { description: 'Whether the pump is commanded to run.' }),
    speed: attribute.number('speed', { defaultValue: 0, cssVariable: '--pump-speed', description: 'Rotor speed in rpm.' }),
    value: attribute.number('value', { defaultValue: 0, description: 'Primary process value.' }),
    unit: attribute.string('unit', { defaultValue: 'bar', description: 'Primary process value unit.' }),
    status: attribute.enum('status', ['idle', 'normal', 'warning', 'alarm'] as const, {
      defaultValue: 'idle',
      description: 'Process status independent from data quality.',
    }),
    quality: attribute.enum('quality', ['good', 'stale', 'bad'] as const, {
      defaultValue: 'good',
      description: 'Telemetry quality independent from process status.',
    }),
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
    bind.text(
      'readout',
      (context) => `${numberValue(context, 'value').toFixed(1)} ${stringValue(context, 'unit')}`,
      ['value', 'unit'],
    ),
  ],
  motions: [
    {
      id: 'rotor-spin',
      type: 'loop',
      target: 'rotor',
      active: (context) => stateValue(context, 'running'),
      playbackRate: (context) => Math.max(0.1, numberValue(context, 'speed') / 1450),
      phase: 'process-mechanical',
      keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      options: { duration: 1000, iterations: Infinity, easing: 'linear' },
    },
    {
      id: 'flow-dash',
      type: 'loop',
      target: 'flow-mark',
      active: (context) => stateValue(context, 'running'),
      playbackRate: (context) => Math.max(0.2, numberValue(context, 'speed') / 1450),
      phase: 'process-flow',
      keyframes: [{ strokeDashoffset: 0 }, { strokeDashoffset: -8 }],
      options: { duration: 800, iterations: Infinity, easing: 'linear' },
    },
    {
      id: 'start-kick',
      type: 'transition',
      target: 'housing',
      trigger: (context) => stateValue(context, 'running'),
      enabled: (context) => stateValue(context, 'running'),
      keyframes: [
        { transform: 'scale(1)' },
        { transform: 'scale(1.035)', offset: 0.35 },
        { transform: 'scale(1)' },
      ],
      options: { duration: 280, easing: 'cubic-bezier(.2,.9,.3,1)' },
    },
    {
      id: 'alarm-pulse',
      type: 'loop',
      target: 'status-ring',
      active: (context) => stateValue(context, 'alarm'),
      keyframes: [{ opacity: 0.45 }, { opacity: 1 }, { opacity: 0.45 }],
      options: { duration: 900, iterations: Infinity, easing: 'ease-in-out' },
    },
  ],
  ports: [
    { id: 'in', x: 18, y: 62, direction: 'left', kind: 'process' },
    { id: 'out', x: 82, y: 28, direction: 'top', kind: 'process' },
    { id: 'power', x: 146, y: 62, direction: 'right', kind: 'electrical' },
  ],
  parts: [
    { name: 'housing', description: 'Pump body.' },
    { name: 'motor', description: 'Electric motor body.' },
    { name: 'rotor', description: 'Animated impeller.' },
    { name: 'status-ring', description: 'Status indicator independent from quality.' },
    { name: 'flow-mark', description: 'Flow direction animation.' },
    { name: 'label' },
    { name: 'readout' },
  ],
});
