import { attribute, bind, defineElementDefinition, svg } from '@pom4h/elements-core';
import {
  clamp,
  electricalBaseStyles,
  electricalDetails,
  electricalQualities,
  electricalStatuses,
  numberValue,
  stringValue,
} from '../electrical-shared.js';

export const meterDefinition = defineElementDefinition({
  tagName: 'ee-meter',
  displayName: 'Power meter',
  description: 'An inline electrical meter exposing voltage, current, active power, frequency and a telemetry output port.',
  viewBox: '0 0 300 220',
  template: svg`
<path class="wire" d="M8 110 H54 M246 110 H292"/>
<circle class="terminal" cx="8" cy="110" r="5"/>
<circle class="terminal" cx="292" cy="110" r="5"/>
<rect class="case status-primary" data-part="case" x="54" y="34" width="192" height="152" rx="16"/>
<rect class="display" data-part="display" data-quality-sensitive x="73" y="57" width="154" height="69" rx="8"/>
<text class="main-value" data-part="voltage-readout" data-quality-sensitive x="150" y="87" text-anchor="middle">400 V</text>
<text class="secondary-value" data-part="current-readout" data-quality-sensitive x="150" y="111" text-anchor="middle">24.8 A · 16.4 kW</text>
<g data-detail="standard">
  <text class="label" data-part="label" x="72" y="151">EM-101</text>
  <text class="meta" data-part="frequency-readout" data-quality-sensitive x="228" y="151" text-anchor="end">50.00 Hz</text>
</g>
<g data-detail="fine" data-quality-sensitive>
  <rect class="load-track" x="75" y="162" width="150" height="8" rx="4"/>
  <rect class="load-bar" data-part="current-bar" x="75" y="162" width="150" height="8" rx="4"/>
</g>
<path class="wire signal" d="M150 186 V212" data-detail="standard"/>
<circle class="terminal" cx="150" cy="212" r="5" data-detail="standard"/>
<circle class="status-dot" data-part="quality-dot" cx="226" cy="48" r="6"/>
`,
  styles: `
${electricalBaseStyles}
:host{width:300px;aspect-ratio:15/11}
.case{fill:var(--elements-surface,#0b1721);stroke-width:2.4}
.display{fill:#061018;stroke:var(--elements-line,#526a7f);stroke-width:1.2}
.main-value,.secondary-value{fill:var(--elements-electric-live,#ffd166);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:800}
.main-value{font-size:20px}.secondary-value{font-size:10px}
.signal{stroke-dasharray:4 5;opacity:.6}
.load-track{fill:var(--elements-panel,#08131d);stroke:var(--elements-line,#526a7f);stroke-width:1}
.load-bar{fill:var(--elements-electric-live,#ffd166);transform-box:view-box;transform-origin:75px 166px}
:host([quality="unknown"]) .quality-dot{fill:var(--elements-muted,#7890a5)}
:host([quality="stale"]) .quality-dot{fill:var(--elements-warning,#ffbe4a)}
:host([quality="bad"]) .quality-dot{fill:var(--elements-alarm,#ff5c74)}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'EM-101', description: 'Meter tag.' }),
    voltage: attribute.number('voltage', { defaultValue: 0, minimum: 0, step: 0.1, unit: 'V', description: 'RMS line voltage.' }),
    current: attribute.number('current', { defaultValue: 0, minimum: 0, step: 0.1, unit: 'A', description: 'RMS line current.' }),
    power: attribute.number('power', { defaultValue: 0, step: 0.1, unit: 'kW', description: 'Active power.' }),
    frequency: attribute.number('frequency', { defaultValue: 50, minimum: 0, step: 0.01, unit: 'Hz', description: 'Measured line frequency.' }),
    currentRange: attribute.number('currentRange', { attribute: 'current-range', defaultValue: 100, minimum: 1, step: 1, unit: 'A', description: 'Full-scale current used by the visual load bar.' }),
    status: attribute.enum('status', electricalStatuses, { defaultValue: 'normal', description: 'Meter severity.' }),
    quality: attribute.enum('quality', electricalQualities, { defaultValue: 'unknown', description: 'Measurement quality.' }),
    detail: attribute.enum('detail', electricalDetails, { defaultValue: 'auto', description: 'Visual level of detail.' }),
  },
  bindings: [
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('voltage-readout', (context) => `${numberValue(context, 'voltage').toFixed(1)} V`, ['voltage']),
    bind.text('current-readout', (context) => `${numberValue(context, 'current').toFixed(1)} A · ${numberValue(context, 'power').toFixed(1)} kW`, ['current', 'power']),
    bind.text('frequency-readout', (context) => `${numberValue(context, 'frequency', 50).toFixed(2)} Hz`, ['frequency']),
  ],
  motions: [
    {
      id: 'meter-current', type: 'scrub', target: 'current-bar',
      progress: (context) => clamp(numberValue(context, 'current') / Math.max(1, numberValue(context, 'currentRange', 100)), 0, 1),
      keyframes: [{ transform: 'scaleX(.02)' }, { transform: 'scaleX(1)' }],
      options: { duration: 1000, fill: 'both', easing: 'linear' }, reducedMotion: 'preserve',
    },
  ],
  ports: [
    { id: 'line-in', x: 8, y: 110, direction: 'left', kind: 'electrical', role: 'inlet', label: 'Measured line in' },
    { id: 'line-out', x: 292, y: 110, direction: 'right', kind: 'electrical', role: 'outlet', label: 'Measured line out' },
    { id: 'telemetry', x: 150, y: 212, direction: 'bottom', kind: 'signal', role: 'outlet', label: 'Telemetry' },
  ],
  parts: [
    { name: 'case', description: 'Meter enclosure and severity outline.', detail: 'essential' },
    { name: 'display', description: 'Primary electrical readout.', detail: 'essential' },
    { name: 'voltage-readout', detail: 'essential' },
    { name: 'current-readout', detail: 'standard' },
    { name: 'frequency-readout', detail: 'standard' },
    { name: 'current-bar', detail: 'fine' },
    { name: 'quality-dot', description: 'Measurement quality marker.', detail: 'standard' },
    { name: 'label', detail: 'standard' },
  ],
});
