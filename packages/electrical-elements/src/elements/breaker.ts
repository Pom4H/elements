import {
  attribute,
  bind,
  defineElementDefinition,
  defineFragment,
  ports,
  svg,
  type ElementContext,
  type FragmentPlacement,
  type PortDefinition,
} from '@pom4h/elements-core';
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

function poleCount(context: ElementContext): number {
  return Math.round(clamp(numberValue(context, 'poles', 3), 1, 4));
}

function poleX(index: number, count: number): number {
  if (count === 1) return 150;
  const span = 156;
  return 150 - span / 2 + (span * index) / (count - 1);
}

const breakerPole = defineFragment({
  name: 'breaker-pole',
  template: svg`
<g data-part="pole">
  <circle class="terminal" cx="0" cy="16" r="5"/>
  <path class="wire" d="M0 21 V82"/>
  <circle class="contact" cx="0" cy="91" r="5"/>
  <g class="blade" data-part="contact-blade">
    <path class="symbol-line" d="M0 91 L0 137"/>
  </g>
  <circle class="contact" cx="0" cy="146" r="5"/>
  <path class="wire" d="M0 151 V212"/>
  <circle class="terminal" cx="0" cy="217" r="5"/>
</g>
`,
});

function polePlacements(context: ElementContext): readonly FragmentPlacement[] {
  const count = poleCount(context);
  return Array.from({ length: count }, (_, index) => ({
    key: `pole-${index + 1}`,
    fragment: breakerPole,
    x: poleX(index, count),
    y: 8,
  }));
}

function breakerPorts(context: ElementContext): readonly PortDefinition[] {
  const count = poleCount(context);
  const resolved: PortDefinition[] = [];
  for (let index = 0; index < count; index += 1) {
    const x = poleX(index, count);
    const phase = index + 1;
    resolved.push({ id: `line-${phase}`, x, y: 8, direction: 'top', kind: 'electrical', role: 'inlet', label: `Line ${phase}` });
    resolved.push({ id: `load-${phase}`, x, y: 240, direction: 'bottom', kind: 'electrical', role: 'outlet', label: `Load ${phase}` });
  }
  return resolved;
}

const defaultPorts = breakerPorts({
  host: undefined as unknown as HTMLElement,
  attributes: { poles: 3 },
  states: {},
});

export const breakerDefinition = defineElementDefinition({
  tagName: 'ee-breaker',
  displayName: 'Circuit breaker',
  description: 'A 1–4 pole circuit breaker whose live electrical terminal topology follows the configured pole count.',
  viewBox: '0 0 300 260',
  template: svg`
<rect class="case status-primary" data-part="case" x="38" y="8" width="224" height="232" rx="18"/>
<g data-mount="poles"/>
<circle class="status-dot" data-part="status-dot" cx="246" cy="26" r="6"/>
<g data-detail="standard">
  <rect class="panel" x="54" y="101" width="192" height="58" rx="8"/>
  <text class="label" data-part="label" x="68" y="123">QF-101</text>
  <text class="readout" data-part="readout" data-quality-sensitive x="232" y="123" text-anchor="end">42.1 / 63 A</text>
  <text class="meta" data-part="pole-count" x="68" y="146">3P · CLOSED</text>
</g>
`,
  styles: `
${electricalBaseStyles}
:host{width:300px;aspect-ratio:15/13}
.case{fill:var(--elements-surface,#0b1721);stroke-width:2.4}
.contact{fill:var(--elements-surface,#0b1721);stroke:currentColor;stroke-width:2}
.blade{transform-box:fill-box;transform-origin:0 0;transform:rotate(-29deg)}
:host([data-state~="closed"]) .blade{transform:rotate(0deg)}
:host([data-state~="tripped"]) .blade{transform:rotate(-42deg)}
:host([data-state~="tripped"]) .status-dot{fill:var(--elements-alarm,#ff5c74)}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'QF-101', description: 'Breaker tag.' }),
    poles: attribute.number('poles', { defaultValue: 3, minimum: 1, maximum: 4, step: 1, description: 'Number of switched poles. Each pole adds a line and load terminal.' }),
    closed: attribute.boolean('closed', { description: 'Whether the breaker contacts are closed.' }),
    tripped: attribute.boolean('tripped', { description: 'Whether protection has tripped the breaker.' }),
    current: attribute.number('current', { defaultValue: 0, minimum: 0, step: 0.1, unit: 'A', description: 'Measured phase current.' }),
    rating: attribute.number('rating', { defaultValue: 63, minimum: 1, step: 1, unit: 'A', description: 'Breaker current rating.' }),
    status: attribute.enum('status', electricalStatuses, { defaultValue: 'normal', description: 'Breaker severity independent from trip state.' }),
    quality: attribute.enum('quality', electricalQualities, { defaultValue: 'unknown', description: 'Telemetry quality.' }),
    detail: attribute.enum('detail', electricalDetails, { defaultValue: 'auto', description: 'Visual level of detail.' }),
  },
  states: {
    tripped: (context) => booleanValue(context, 'tripped'),
    closed: (context) => booleanValue(context, 'closed') && !booleanValue(context, 'tripped'),
    open: (context) => !booleanValue(context, 'closed') || booleanValue(context, 'tripped'),
    overloaded: (context) => numberValue(context, 'current') > numberValue(context, 'rating', 63),
  },
  collections: [{ mount: 'poles', items: polePlacements }],
  bindings: [
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('readout', (context) => `${numberValue(context, 'current').toFixed(1)} / ${Math.round(numberValue(context, 'rating', 63))} A`, ['current', 'rating']),
    bind.text('pole-count', (context) => `${poleCount(context)}P · ${stateValue(context, 'tripped') ? 'TRIPPED' : stateValue(context, 'closed') ? 'CLOSED' : 'OPEN'}`, ['poles', 'closed', 'tripped']),
  ],
  motions: [
    {
      id: 'breaker-trip', type: 'transition', target: 'status-dot',
      trigger: (context) => stateValue(context, 'tripped'),
      enabled: (context) => stateValue(context, 'tripped'),
      keyframes: [{ transform: 'scale(.4)', opacity: .25 }, { transform: 'scale(1.8)', opacity: 1 }, { transform: 'scale(1)', opacity: 1 }],
      options: { duration: 420, easing: 'ease-out' }, reducedMotion: 'finish',
    },
  ],
  ports: ports(defaultPorts, breakerPorts),
  parts: [
    { name: 'case', description: 'Breaker enclosure and severity outline.', detail: 'essential' },
    { name: 'pole', description: 'Repeated switched pole geometry.', detail: 'essential' },
    { name: 'contact-blade', description: 'Contact position for each pole.', detail: 'essential' },
    { name: 'status-dot', description: 'Trip marker.', detail: 'standard' },
    { name: 'label', detail: 'standard' },
    { name: 'readout', detail: 'standard' },
    { name: 'pole-count', detail: 'standard' },
  ],
});
