import {
  attribute,
  bind,
  defineElementDefinition,
  semanticZoomLevels,
  semanticZoomStyles,
  svg,
} from '@pom4h/elements-core';
import { booleanValue, clamp, numberValue, stateValue, stringValue } from '../shared.js';

/** Symbol geometry follows the conventional vertical process-vessel outline. */
export const pidVesselDefinition = defineElementDefinition({
  tagName: 'pe-pid-vessel',
  displayName: 'Semantic zoom process vessel',
  description: 'A standard vessel silhouette with cumulative level, operating-state, and diagnostic layers.',
  viewBox: '0 0 260 280',
  template: svg`
<defs>
  <clipPath id="vessel-clip"><rect x="70" y="47" width="120" height="174" rx="56"/></clipPath>
</defs>
<g data-part="symbol" data-zoom-layer="symbol">
  <path class="nozzle" d="M8 92 H70 M190 188 H252 M130 221 V272"/>
  <rect class="vessel status-outline" data-part="status-outline" data-status-primary x="70" y="32" width="120" height="204" rx="58"/>
  <path class="support" d="M92 232 L82 265 M168 232 L178 265"/>
</g>

<g data-part="process-layer" data-zoom-layer="process" clip-path="url(#vessel-clip)">
  <g class="level-group" data-part="level-group" data-quality-sensitive>
    <rect class="liquid" x="70" y="74" width="120" height="148"/>
    <path class="surface-wave" data-part="surface-wave" d="M70 76 C88 68 105 84 124 76 C143 68 160 84 190 76"/>
    <g class="bubbles" data-part="bubbles">
      <circle cx="99" cy="137" r="4"/><circle cx="145" cy="164" r="3"/><circle cx="169" cy="119" r="2.5"/>
    </g>
  </g>
</g>

<g data-part="operational-layer" data-zoom-layer="operational">
  <rect class="gauge-track" x="203" y="59" width="12" height="154" rx="6"/>
  <rect class="gauge-fill" data-part="gauge-fill" data-quality-sensitive x="203" y="59" width="12" height="154" rx="6"/>
  <circle class="state-dot" data-part="state-dot" data-operation-marker cx="185" cy="44" r="6"/>
  <text class="level-label" data-part="level-label" data-quality-sensitive x="130" y="255" text-anchor="middle">64% LEVEL</text>
  <text class="tag" data-part="label" x="130" y="275" text-anchor="middle">V-101</text>
</g>

<g data-part="diagnostic-layer" data-zoom-layer="diagnostic">
  <rect class="readout-panel" data-quality-sensitive x="83" y="7" width="94" height="27" rx="6"/>
  <text class="readout" data-part="readout" data-quality-sensitive x="130" y="25" text-anchor="middle">4.8 m</text>
  <path class="signal-line" d="M215 72 H241 V47"/>
  <circle class="instrument" cx="241" cy="32" r="15"/>
  <text class="instrument-text" x="241" y="35" text-anchor="middle">LT</text>
  <circle class="quality-indicator" data-part="quality-indicator" data-quality-indicator cx="217" cy="32" r="4"/>
</g>
`,
  styles: `
${semanticZoomStyles('abstraction')}
:host{display:inline-block;width:260px;max-width:100%;aspect-ratio:13/14;color:var(--elements-ink,#dbe7f3);container-type:inline-size;contain:layout style}svg{width:100%;height:100%;overflow:visible}.nozzle,.vessel,.support,.signal-line,.instrument{fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.liquid{fill:color-mix(in srgb,var(--elements-process-flow,#4bcfff),transparent 64%)}.surface-wave{fill:none;stroke:var(--elements-process-flow,#4bcfff);stroke-width:3}.bubbles{fill:var(--elements-process-flow,#4bcfff);opacity:.7}.level-group{transform-box:view-box;transform-origin:130px 222px}.gauge-track{fill:var(--elements-panel,#08131d);stroke:var(--elements-line,#526a7f)}.gauge-fill{fill:var(--elements-process-flow,#4bcfff);transform-box:view-box;transform-origin:209px 213px}.state-dot{fill:var(--elements-muted,#7890a5);transform-box:fill-box;transform-origin:center}.quality-indicator{fill:#72869a;stroke:#a8b7c5;stroke-width:.7}.tag,.level-label,.readout,.instrument-text{font-family:ui-monospace,SFMono-Regular,monospace}.tag{fill:currentColor;font-size:12px;font-weight:750;letter-spacing:.08em}.level-label{fill:var(--elements-muted,#7890a5);font-size:9px}.readout-panel{fill:var(--elements-panel,#08131d);stroke:var(--elements-line,#526a7f)}.readout{fill:var(--elements-process-flow,#4bcfff);font-size:10px;font-weight:750}.signal-line{stroke:var(--elements-muted,#7890a5);stroke-width:1.4;stroke-dasharray:4 4}.instrument{stroke:var(--elements-muted,#7890a5);stroke-width:1.5}.instrument-text{fill:var(--elements-muted,#7890a5);font-size:8px;font-weight:700}[data-quality-sensitive]{opacity:.42}:host([data-state~="active"]) .state-dot{fill:var(--elements-ok,#56e29a)}:host([status="warning"]) .status-outline{stroke:var(--elements-warning,#ffbe4a)}:host([status="alarm"]) .status-outline{stroke:var(--elements-alarm,#ff5c74)}:host([quality="good"]) [data-quality-sensitive]{opacity:1}:host([quality="stale"]) [data-quality-sensitive]{opacity:.62}:host([quality="bad"]) [data-quality-sensitive]{opacity:.26}:host([quality="good"]) [data-quality-indicator]{fill:var(--elements-ok,#56e29a);stroke:#baffd8}:host([quality="stale"]) [data-quality-indicator]{fill:var(--elements-warning,#ffbe4a);stroke:#ffe1a4}:host([quality="bad"]) [data-quality-indicator]{fill:var(--elements-alarm,#ff5c74);stroke:#ffc0ca}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'V-101', description: 'Equipment label.' }),
    active: attribute.boolean('active', { description: 'Whether the vessel has active inflow or agitation.' }),
    level: attribute.number('level', { defaultValue: 0, description: 'Liquid level from 0 to 100 percent.' }),
    value: attribute.number('value', { defaultValue: 0, description: 'Primary process value.' }),
    unit: attribute.string('unit', { defaultValue: 'm', description: 'Primary process value unit.' }),
    status: attribute.enum('status', ['normal', 'warning', 'alarm'] as const, { defaultValue: 'normal' }),
    quality: attribute.enum('quality', ['unknown', 'good', 'stale', 'bad'] as const, { defaultValue: 'unknown' }),
    abstraction: attribute.enum('abstraction', semanticZoomLevels, { defaultValue: 'symbol', description: 'Semantic zoom level.' }),
  },
  states: {
    active: (context) => booleanValue(context, 'active'),
  },
  bindings: [
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('level-label', (context) => `${Math.round(clamp(numberValue(context, 'level'), 0, 100))}% LEVEL`, ['level']),
    bind.text('readout', (context) => `${numberValue(context, 'value').toFixed(1)} ${stringValue(context, 'unit')}`, ['value', 'unit']),
  ],
  motions: [
    {
      id: 'pid-vessel-level', type: 'scrub', target: 'level-group',
      progress: (context) => clamp(numberValue(context, 'level') / 100, 0, 1),
      keyframes: [{ transform: 'translateY(148px)' }, { transform: 'translateY(0px)' }],
      options: { duration: 1000, fill: 'both', easing: 'linear' }, reducedMotion: 'preserve',
    },
    {
      id: 'pid-vessel-gauge', type: 'scrub', target: 'gauge-fill',
      progress: (context) => clamp(numberValue(context, 'level') / 100, 0, 1),
      keyframes: [{ transform: 'scaleY(.02)' }, { transform: 'scaleY(1)' }],
      options: { duration: 1000, fill: 'both', easing: 'linear' }, reducedMotion: 'preserve',
    },
    {
      id: 'pid-vessel-surface', type: 'loop', target: 'surface-wave',
      active: (context) => stateValue(context, 'active'),
      phase: 'process-fluid',
      keyframes: [{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }],
      options: { duration: 950, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }, reducedMotion: 'freeze',
    },
    {
      id: 'pid-vessel-bubbles', type: 'loop', target: 'bubbles',
      active: (context) => stateValue(context, 'active'),
      phase: 'process-fluid',
      keyframes: [{ transform: 'translateY(20px)', opacity: .2 }, { transform: 'translateY(-24px)', opacity: .85 }],
      options: { duration: 1800, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze',
    },
    {
      id: 'pid-vessel-severity', type: 'transition', target: 'status-outline',
      trigger: (context) => stringValue(context, 'status'),
      enabled: (context) => stringValue(context, 'status') !== 'normal',
      keyframes: [{ opacity: .35 }, { opacity: 1 }, { opacity: .72 }, { opacity: 1 }],
      options: { duration: 420, easing: 'ease-out' }, reducedMotion: 'finish',
    },
  ],
  ports: [
    { id: 'in', x: 8, y: 92, direction: 'left', kind: 'process' },
    { id: 'out', x: 252, y: 188, direction: 'right', kind: 'process' },
    { id: 'drain', x: 130, y: 272, direction: 'bottom', kind: 'process' },
    { id: 'level', x: 241, y: 17, direction: 'top', kind: 'signal' },
  ],
  parts: [
    { name: 'symbol', description: 'Canonical vertical-vessel silhouette.', detail: 'essential' },
    { name: 'process-layer', description: 'Liquid level and surface motion.', detail: 'standard' },
    { name: 'operational-layer', description: 'Gauge, state, and equipment tag.', detail: 'standard' },
    { name: 'diagnostic-layer', description: 'Level transmitter and numeric readout.', detail: 'fine' },
    { name: 'level-group', detail: 'standard' },
    { name: 'surface-wave', detail: 'standard' },
    { name: 'bubbles', detail: 'standard' },
    { name: 'gauge-fill', detail: 'standard' },
    { name: 'status-outline', description: 'Primary severity indicator.', detail: 'essential' },
    { name: 'state-dot', description: 'Active-process marker.', detail: 'standard' },
    { name: 'quality-indicator', description: 'Telemetry quality marker.', detail: 'fine' },
    { name: 'label', detail: 'standard' },
    { name: 'level-label', detail: 'standard' },
    { name: 'readout', detail: 'fine' },
  ],
});
