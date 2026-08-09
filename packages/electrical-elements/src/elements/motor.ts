import { attribute, bind, defineElementDefinition, svg } from '@pom4h/elements-core';
import {
  booleanValue,
  clamp,
  electricalBaseStyles,
  electricalDetails,
  electricalQualities,
  electricalStatuses,
  numberValue,
  stateValue,
  stringValue,
} from '../electrical-shared.js';

export const motorDefinition = defineElementDefinition({
  tagName: 'ee-motor',
  displayName: 'Three-phase motor',
  description: 'A three-phase induction motor with electrical supply, thermal feedback, running state and load telemetry.',
  viewBox: '0 0 320 220',
  template: svg`
<path class="wire" d="M8 110 H60"/>
<circle class="terminal" cx="62" cy="110" r="7"/>
<circle class="outline status-primary" data-part="status-ring" cx="154" cy="110" r="66"/>
<circle class="outline" data-part="body" cx="154" cy="110" r="54"/>
<text class="motor-mark" x="154" y="118" text-anchor="middle">M</text>
<g transform="translate(154 110)">
  <g data-part="rotor" class="rotor">
    <path d="M0 -28 L8 -8 L0 0 L-8 -8 Z"/>
    <path d="M28 0 L8 8 L0 0 L8 -8 Z"/>
    <path d="M0 28 L-8 8 L0 0 L8 8 Z"/>
    <path d="M-28 0 L-8 -8 L0 0 L-8 8 Z"/>
  </g>
</g>
<path class="outline" d="M208 110 H267" data-detail="standard"/>
<rect class="shaft" x="267" y="104" width="42" height="12" rx="4" data-detail="standard"/>
<circle class="status-dot" data-part="state-dot" cx="203" cy="61" r="6"/>
<path class="wire signal" d="M154 44 V10" data-detail="standard"/>
<circle class="terminal" cx="154" cy="10" r="5" data-detail="standard"/>
<g data-detail="standard">
  <rect class="panel" x="72" y="174" width="164" height="46" rx="6"/>
  <text class="label" data-part="label" x="84" y="193">M-101</text>
  <text class="readout" data-part="readout" data-quality-sensitive x="84" y="210">1450 RPM · 12.4 A</text>
</g>
<g data-detail="fine" data-quality-sensitive>
  <rect class="load-track" x="238" y="184" width="70" height="7" rx="3.5"/>
  <rect class="load-bar" data-part="load-bar" x="238" y="184" width="70" height="7" rx="3.5"/>
  <text class="meta" data-part="load-label" x="273" y="205" text-anchor="middle">72% LOAD</text>
</g>
`,
  styles: `
${electricalBaseStyles}
:host{width:320px;aspect-ratio:16/11}
.motor-mark{fill:currentColor;font:900 24px/1 ui-monospace,monospace}
.rotor{fill:var(--elements-electric-live,#ffd166);transform-box:fill-box;transform-origin:center;opacity:.28}
.shaft{fill:var(--elements-line,#526a7f);stroke:currentColor;stroke-width:1.2}
.signal{stroke-dasharray:4 5;opacity:.6}
.load-track{fill:var(--elements-panel,#08131d);stroke:var(--elements-line,#526a7f);stroke-width:1}
.load-bar{fill:var(--elements-electric-live,#ffd166);transform-box:view-box;transform-origin:238px 187.5px}
:host([data-state~="running"]) .rotor{opacity:1}
:host([data-state~="running"]) .state-dot{fill:var(--elements-ok,#56e29a)}
:host(:not([data-state~="running"])) .state-dot{fill:var(--elements-muted,#7890a5)}
:host([data-state~="overloaded"]) .load-bar{fill:var(--elements-warning,#ffbe4a)}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'M-101', description: 'Equipment tag.' }),
    running: attribute.boolean('running', { description: 'Whether the motor is commanded to run.' }),
    speed: attribute.number('speed', { defaultValue: 0, minimum: 0, step: 1, unit: 'rpm', description: 'Measured shaft speed.' }),
    load: attribute.number('load', { defaultValue: 0, minimum: 0, maximum: 150, step: 1, unit: '%', description: 'Mechanical load as percent of rated load.' }),
    current: attribute.number('current', { defaultValue: 0, minimum: 0, step: 0.1, unit: 'A', description: 'Measured line current.' }),
    voltage: attribute.number('voltage', { defaultValue: 400, minimum: 0, step: 1, unit: 'V', description: 'Measured line voltage.' }),
    status: attribute.enum('status', electricalStatuses, { defaultValue: 'normal', description: 'Electrical equipment severity.' }),
    quality: attribute.enum('quality', electricalQualities, { defaultValue: 'unknown', description: 'Telemetry quality.' }),
    detail: attribute.enum('detail', electricalDetails, { defaultValue: 'auto', description: 'Visual level of detail.' }),
  },
  states: {
    running: (context) => booleanValue(context, 'running') && numberValue(context, 'speed') > 0,
    overloaded: (context) => numberValue(context, 'load') > 100,
  },
  bindings: [
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('readout', (context) => `${Math.round(numberValue(context, 'speed'))} RPM · ${numberValue(context, 'current').toFixed(1)} A`, ['speed', 'current']),
    bind.text('load-label', (context) => `${Math.round(numberValue(context, 'load'))}% LOAD`, ['load']),
  ],
  motions: [
    {
      id: 'motor-rotor', type: 'loop', target: 'rotor',
      active: (context) => stateValue(context, 'running'),
      playbackRate: (context) => Math.max(.08, numberValue(context, 'speed') / 1450),
      phase: 'electrical-mechanical',
      keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      options: { duration: 1300, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze',
    },
    {
      id: 'motor-load', type: 'scrub', target: 'load-bar',
      progress: (context) => clamp(numberValue(context, 'load') / 100, 0, 1),
      keyframes: [{ transform: 'scaleX(.03)' }, { transform: 'scaleX(1)' }],
      options: { duration: 1000, fill: 'both', easing: 'linear' }, reducedMotion: 'preserve',
    },
    {
      id: 'motor-severity', type: 'transition', target: 'status-ring',
      trigger: (context) => stringValue(context, 'status'),
      enabled: (context) => stringValue(context, 'status') !== 'normal',
      keyframes: [{ opacity: .35 }, { opacity: 1 }, { opacity: .75 }, { opacity: 1 }],
      options: { duration: 420, easing: 'ease-out' }, reducedMotion: 'finish',
    },
  ],
  ports: [
    { id: 'power', x: 8, y: 110, direction: 'left', kind: 'electrical', role: 'inlet', label: 'Three-phase supply' },
    { id: 'thermal', x: 154, y: 10, direction: 'top', kind: 'signal', role: 'outlet', label: 'Thermal feedback' },
  ],
  parts: [
    { name: 'body', description: 'Motor body silhouette.', detail: 'essential' },
    { name: 'status-ring', description: 'Severity outline.', detail: 'essential' },
    { name: 'rotor', description: 'Running-state rotor.', detail: 'standard' },
    { name: 'state-dot', description: 'Operation marker.', detail: 'standard' },
    { name: 'load-bar', description: 'Rated-load scrub indicator.', detail: 'fine' },
    { name: 'load-label', detail: 'fine' },
    { name: 'label', detail: 'standard' },
    { name: 'readout', detail: 'standard' },
  ],
});
