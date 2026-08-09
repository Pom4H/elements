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

export const transformerDefinition = defineElementDefinition({
  tagName: 'ee-transformer',
  displayName: 'Power transformer',
  description: 'A two-winding transformer with primary/secondary electrical ports, live ratio telemetry and load indication.',
  viewBox: '0 0 340 240',
  template: svg`
<path class="wire" d="M8 120 H73 M267 120 H332"/>
<circle class="terminal" cx="8" cy="120" r="5"/>
<circle class="terminal" cx="332" cy="120" r="5"/>
<g data-part="windings" data-quality-sensitive>
  <path class="winding" d="M84 80 q-22 10 0 20 q22 10 0 20 q-22 10 0 20 q22 10 0 20"/>
  <path class="winding" d="M256 80 q22 10 0 20 q-22 10 0 20 q22 10 0 20 q-22 10 0 20"/>
</g>
<g data-part="core" class="core status-primary">
  <rect x="124" y="54" width="92" height="132" rx="8"/>
  <rect class="core-cutout" x="146" y="76" width="48" height="88" rx="5"/>
</g>
<circle class="status-dot" data-part="state-dot" cx="215" cy="64" r="6"/>
<path class="wire" d="M170 186 V232" data-detail="standard"/>
<path class="ground" d="M153 232 H187 M159 238 H181 M166 244 H174" data-detail="standard"/>
<g data-detail="standard">
  <rect class="panel" x="70" y="12" width="200" height="31" rx="6"/>
  <text class="label" data-part="label" x="82" y="32">TR-101</text>
  <text class="readout" data-part="readout" data-quality-sensitive x="258" y="32" text-anchor="end">10.0 kV → 400 V</text>
</g>
<g data-detail="fine" data-quality-sensitive>
  <rect class="load-track" x="109" y="205" width="122" height="8" rx="4"/>
  <rect class="load-bar" data-part="load-bar" x="109" y="205" width="122" height="8" rx="4"/>
  <text class="meta" data-part="load-label" x="170" y="228" text-anchor="middle">68% LOAD</text>
</g>
`,
  styles: `
${electricalBaseStyles}
:host{width:340px;aspect-ratio:17/12}
.winding{fill:none;stroke:var(--elements-electric-live,#ffd166);stroke-width:3;stroke-linecap:round}
.core rect:first-child{fill:var(--elements-surface,#0b1721);stroke-width:2.4}
.core-cutout{fill:var(--elements-panel,#08131d);stroke:none}
.ground{fill:none;stroke:currentColor;stroke-width:2}
.load-track{fill:var(--elements-panel,#08131d);stroke:var(--elements-line,#526a7f);stroke-width:1}
.load-bar{fill:var(--elements-electric-live,#ffd166);transform-box:view-box;transform-origin:109px 209px}
:host([data-state~="energized"]) .windings{opacity:1}
:host(:not([data-state~="energized"])) .windings{opacity:.28}
:host(:not([data-state~="energized"])) .state-dot{fill:var(--elements-muted,#7890a5)}
:host([data-state~="overloaded"]) .load-bar{fill:var(--elements-warning,#ffbe4a)}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'TR-101', description: 'Transformer tag.' }),
    energized: attribute.boolean('energized', { description: 'Whether the primary winding is energized.' }),
    primaryVoltage: attribute.number('primaryVoltage', { attribute: 'primary-voltage', defaultValue: 10000, minimum: 0, step: 1, unit: 'V', description: 'Primary RMS voltage.' }),
    secondaryVoltage: attribute.number('secondaryVoltage', { attribute: 'secondary-voltage', defaultValue: 400, minimum: 0, step: 1, unit: 'V', description: 'Secondary RMS voltage.' }),
    load: attribute.number('load', { defaultValue: 0, minimum: 0, maximum: 150, step: 1, unit: '%', description: 'Transformer loading versus rated apparent power.' }),
    status: attribute.enum('status', electricalStatuses, { defaultValue: 'normal', description: 'Transformer severity.' }),
    quality: attribute.enum('quality', electricalQualities, { defaultValue: 'unknown', description: 'Telemetry quality.' }),
    detail: attribute.enum('detail', electricalDetails, { defaultValue: 'auto', description: 'Visual level of detail.' }),
  },
  states: {
    energized: (context) => booleanValue(context, 'energized') && numberValue(context, 'primaryVoltage') > 0,
    overloaded: (context) => numberValue(context, 'load') > 100,
  },
  bindings: [
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('readout', (context) => `${(numberValue(context, 'primaryVoltage') / 1000).toFixed(1)} kV → ${Math.round(numberValue(context, 'secondaryVoltage'))} V`, ['primaryVoltage', 'secondaryVoltage']),
    bind.text('load-label', (context) => `${Math.round(numberValue(context, 'load'))}% LOAD`, ['load']),
  ],
  motions: [
    {
      id: 'transformer-flux', type: 'loop', target: 'core',
      active: (context) => stateValue(context, 'energized'),
      phase: 'electrical-field',
      keyframes: [{ opacity: .62 }, { opacity: 1 }, { opacity: .62 }],
      options: { duration: 1200, iterations: Infinity, easing: 'ease-in-out' }, reducedMotion: 'freeze',
    },
    {
      id: 'transformer-load', type: 'scrub', target: 'load-bar',
      progress: (context) => clamp(numberValue(context, 'load') / 100, 0, 1),
      keyframes: [{ transform: 'scaleX(.03)' }, { transform: 'scaleX(1)' }],
      options: { duration: 1000, fill: 'both', easing: 'linear' }, reducedMotion: 'preserve',
    },
  ],
  ports: [
    { id: 'primary', x: 8, y: 120, direction: 'left', kind: 'electrical', role: 'inlet', label: 'Primary winding' },
    { id: 'secondary', x: 332, y: 120, direction: 'right', kind: 'electrical', role: 'outlet', label: 'Secondary winding' },
    { id: 'ground', x: 170, y: 232, direction: 'bottom', kind: 'electrical', role: 'bidirectional', label: 'Protective earth' },
  ],
  parts: [
    { name: 'core', description: 'Magnetic core and severity outline.', detail: 'essential' },
    { name: 'windings', description: 'Primary and secondary windings.', detail: 'essential' },
    { name: 'state-dot', description: 'Energized-state marker.', detail: 'standard' },
    { name: 'load-bar', description: 'Loading scrub indicator.', detail: 'fine' },
    { name: 'load-label', detail: 'fine' },
    { name: 'label', detail: 'standard' },
    { name: 'readout', detail: 'standard' },
  ],
});
