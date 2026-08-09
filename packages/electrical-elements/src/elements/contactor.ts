import { attribute, bind, defineElementDefinition, svg } from '@pom4h/elements-core';
import {
  booleanValue,
  electricalBaseStyles,
  electricalDetails,
  electricalQualities,
  electricalStatuses,
  numberValue,
  stateValue,
  stringValue,
} from '../electrical-shared.js';

export const contactorDefinition = defineElementDefinition({
  tagName: 'ee-contactor',
  displayName: 'Power contactor',
  description: 'An electrically actuated contactor with power path, coil input, auxiliary feedback and welded-contact fault state.',
  viewBox: '0 0 300 240',
  template: svg`
<rect class="case status-primary" data-part="case" x="48" y="28" width="204" height="184" rx="16"/>
<path class="wire" d="M150 8 V60 M150 180 V232"/>
<circle class="terminal" cx="150" cy="8" r="5"/>
<circle class="terminal" cx="150" cy="232" r="5"/>
<circle class="contact" cx="150" cy="82" r="6"/>
<circle class="contact" cx="150" cy="158" r="6"/>
<path class="armature symbol-line" data-part="armature" d="M150 82 L177 145"/>
<rect class="coil" data-part="coil" x="74" y="91" width="46" height="58" rx="8"/>
<path class="coil-line" d="M80 103 q17 -12 34 0 q-17 12 -34 0 q17 12 34 24 q-17 12 -34 0"/>
<path class="wire" d="M8 120 H74" data-detail="standard"/>
<circle class="terminal" cx="8" cy="120" r="5" data-detail="standard"/>
<path class="wire signal" d="M226 120 H292" data-detail="standard"/>
<circle class="terminal" cx="292" cy="120" r="5" data-detail="standard"/>
<circle class="status-dot" data-part="coil-dot" cx="104" cy="75" r="6"/>
<g data-detail="standard">
  <rect class="panel" x="67" y="183" width="166" height="25" rx="6"/>
  <text class="label" data-part="label" x="78" y="200">KM-101</text>
  <text class="readout" data-part="readout" data-quality-sensitive x="222" y="200" text-anchor="end">24 V · 31.2 A</text>
</g>
`,
  styles: `
${electricalBaseStyles}
:host{width:300px;aspect-ratio:5/4}
.case{fill:var(--elements-surface,#0b1721);stroke-width:2.4}
.contact{fill:var(--elements-surface,#0b1721);stroke:currentColor;stroke-width:2}
.armature{transform-box:fill-box;transform-origin:150px 82px}
.coil{fill:var(--elements-panel,#08131d);stroke:var(--elements-line,#526a7f);stroke-width:1.5}
.coil-line{fill:none;stroke:var(--elements-electric-live,#ffd166);stroke-width:2;opacity:.28}
.signal{stroke-dasharray:4 5;opacity:.6}
:host([data-state~="energized"]) .coil-line{opacity:1}
:host([data-state~="closed"]) .armature{transform:rotate(-23deg)}
:host([data-state~="fault"]) .armature{stroke:var(--elements-alarm,#ff5c74)}
:host(:not([data-state~="energized"])) .coil-dot{fill:var(--elements-muted,#7890a5)}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'KM-101', description: 'Contactor tag.' }),
    energized: attribute.boolean('energized', { description: 'Whether the contactor coil is energized.' }),
    welded: attribute.boolean('welded', { description: 'Whether the main contacts are welded closed.' }),
    current: attribute.number('current', { defaultValue: 0, minimum: 0, step: 0.1, unit: 'A', description: 'Measured load current.' }),
    coilVoltage: attribute.number('coilVoltage', { attribute: 'coil-voltage', defaultValue: 24, minimum: 0, step: 1, unit: 'V', description: 'Coil control voltage.' }),
    status: attribute.enum('status', electricalStatuses, { defaultValue: 'normal', description: 'Contactor severity.' }),
    quality: attribute.enum('quality', electricalQualities, { defaultValue: 'unknown', description: 'Telemetry quality.' }),
    detail: attribute.enum('detail', electricalDetails, { defaultValue: 'auto', description: 'Visual level of detail.' }),
  },
  states: {
    energized: (context) => booleanValue(context, 'energized'),
    closed: (context) => booleanValue(context, 'energized') || booleanValue(context, 'welded'),
    fault: (context) => booleanValue(context, 'welded'),
  },
  bindings: [
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('readout', (context) => `${Math.round(numberValue(context, 'coilVoltage', 24))} V · ${numberValue(context, 'current').toFixed(1)} A`, ['coilVoltage', 'current']),
  ],
  motions: [
    {
      id: 'contactor-coil', type: 'transition', target: 'coil-dot',
      trigger: (context) => stateValue(context, 'energized'),
      enabled: (context) => stateValue(context, 'energized'),
      keyframes: [{ transform: 'scale(.45)', opacity: .25 }, { transform: 'scale(1.5)', opacity: 1 }, { transform: 'scale(1)', opacity: 1 }],
      options: { duration: 300, easing: 'ease-out' }, reducedMotion: 'finish',
    },
  ],
  ports: [
    { id: 'line', x: 150, y: 8, direction: 'top', kind: 'electrical', role: 'inlet', label: 'Line' },
    { id: 'load', x: 150, y: 232, direction: 'bottom', kind: 'electrical', role: 'outlet', label: 'Load' },
    { id: 'coil', x: 8, y: 120, direction: 'left', kind: 'electrical', role: 'inlet', label: 'Coil supply' },
    { id: 'aux', x: 292, y: 120, direction: 'right', kind: 'signal', role: 'outlet', label: 'Auxiliary state' },
  ],
  parts: [
    { name: 'case', description: 'Contactor body and severity outline.', detail: 'essential' },
    { name: 'armature', description: 'Main contact armature.', detail: 'essential' },
    { name: 'coil', description: 'Actuator coil.', detail: 'standard' },
    { name: 'coil-dot', description: 'Coil state marker.', detail: 'standard' },
    { name: 'label', detail: 'standard' },
    { name: 'readout', detail: 'standard' },
  ],
});
