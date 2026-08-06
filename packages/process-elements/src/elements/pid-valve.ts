import {
  attribute,
  bind,
  defineElementDefinition,
  semanticZoomLevels,
  semanticZoomStyles,
  svg,
} from '@pom4h/elements-core';
import { booleanValue, clamp, numberValue, stateValue, stringValue } from '../shared.js';

/** Symbol geometry follows the conventional ISO/ISA control-valve bow-tie form. */
export const pidValveDefinition = defineElementDefinition({
  tagName: 'pe-pid-valve',
  displayName: 'Semantic zoom control valve',
  description: 'A standard control-valve symbol with cumulative process, operational, and diagnostic layers.',
  viewBox: '0 0 300 220',
  template: svg`
<g data-part="symbol" data-zoom-layer="symbol">
  <path class="process-line" d="M8 112 H70 M230 112 H292"/>
  <path class="valve-body status-outline" data-part="status-outline" data-status-primary d="M70 78 L150 112 L70 146 Z M230 78 L150 112 L230 146 Z"/>
  <path class="stem" d="M150 111 V57"/>
  <path class="actuator" d="M120 57 A30 30 0 0 1 180 57 Z"/>
</g>

<g data-part="process-layer" data-zoom-layer="process">
  <path class="flow-guide" d="M16 112 H284"/>
  <g class="flow-marker" data-part="flow-marker">
    <circle cx="16" cy="112" r="4"/>
    <circle cx="2" cy="112" r="2.5"/>
  </g>
  <path class="direction" d="M246 102 L260 112 L246 122"/>
</g>

<g data-part="operational-layer" data-zoom-layer="operational">
  <g class="stem-indicator" data-part="stem-indicator" data-quality-sensitive>
    <circle cx="150" cy="57" r="5"/>
    <path d="M150 57 V83"/>
  </g>
  <rect class="aperture" data-part="aperture" data-quality-sensitive x="143" y="91" width="14" height="42" rx="7"/>
  <circle class="state-dot" data-part="state-dot" data-operation-marker cx="181" cy="40" r="6"/>
  <text class="position" data-part="position-label" data-quality-sensitive x="150" y="174" text-anchor="middle">72% OPEN</text>
  <text class="tag" data-part="label" x="150" y="195" text-anchor="middle">FV-101</text>
</g>

<g data-part="diagnostic-layer" data-zoom-layer="diagnostic">
  <rect class="readout-panel" data-quality-sensitive x="82" y="8" width="136" height="26" rx="6"/>
  <text class="readout" data-part="readout" data-quality-sensitive x="150" y="26" text-anchor="middle">12.4 m³/h</text>
  <path class="signal-line" d="M190 48 H248 V20"/>
  <circle class="instrument" cx="248" cy="20" r="16"/>
  <text class="instrument-text" x="248" y="23" text-anchor="middle">FY</text>
  <circle class="quality-indicator" data-part="quality-indicator" data-quality-indicator cx="224" cy="20" r="4"/>
</g>
`,
  styles: `
${semanticZoomStyles('abstraction')}
:host{display:inline-block;width:300px;max-width:100%;aspect-ratio:15/11;color:var(--elements-ink,#dbe7f3);container-type:inline-size;contain:layout style}svg{width:100%;height:100%;overflow:visible}.process-line,.valve-body,.stem,.actuator,.signal-line,.instrument{fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.flow-guide{fill:none;stroke:var(--elements-process-flow,#4bcfff);stroke-width:1.5;stroke-dasharray:4 7;opacity:.34}.flow-marker{fill:var(--elements-process-flow,#4bcfff)}.direction{fill:none;stroke:var(--elements-process-flow,#4bcfff);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.stem-indicator{fill:none;stroke:var(--elements-process-flow,#4bcfff);stroke-width:2.5;transform-box:view-box;transform-origin:150px 57px}.aperture{fill:var(--elements-process-flow,#4bcfff);transform-box:view-box;transform-origin:150px 112px}.state-dot{fill:var(--elements-muted,#7890a5);transform-box:fill-box;transform-origin:center}.quality-indicator{fill:#72869a;stroke:#a8b7c5;stroke-width:.7}.tag,.position,.readout,.instrument-text{font-family:ui-monospace,SFMono-Regular,monospace}.tag{fill:currentColor;font-size:12px;font-weight:750;letter-spacing:.08em}.position{fill:var(--elements-muted,#7890a5);font-size:9px}.readout-panel{fill:var(--elements-panel,#08131d);stroke:var(--elements-line,#526a7f)}.readout{fill:var(--elements-process-flow,#4bcfff);font-size:10px;font-weight:750}.signal-line{stroke:var(--elements-muted,#7890a5);stroke-width:1.4;stroke-dasharray:4 4}.instrument{stroke:var(--elements-muted,#7890a5);stroke-width:1.5}.instrument-text{fill:var(--elements-muted,#7890a5);font-size:8px;font-weight:700}[data-quality-sensitive]{opacity:.42}:host([data-state~="closed"]) .flow-marker{opacity:.12}:host([data-state~="open"]) .state-dot{fill:var(--elements-process-flow,#4bcfff)}:host([data-state~="flowing"]) .state-dot{fill:var(--elements-ok,#56e29a)}:host([status="warning"]) .status-outline{stroke:var(--elements-warning,#ffbe4a)}:host([status="alarm"]) .status-outline{stroke:var(--elements-alarm,#ff5c74)}:host([quality="good"]) [data-quality-sensitive]{opacity:1}:host([quality="stale"]) [data-quality-sensitive]{opacity:.62}:host([quality="bad"]) [data-quality-sensitive]{opacity:.26}:host([quality="good"]) [data-quality-indicator]{fill:var(--elements-ok,#56e29a);stroke:#baffd8}:host([quality="stale"]) [data-quality-indicator]{fill:var(--elements-warning,#ffbe4a);stroke:#ffe1a4}:host([quality="bad"]) [data-quality-indicator]{fill:var(--elements-alarm,#ff5c74);stroke:#ffc0ca}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'FV-101', description: 'Equipment label.' }),
    active: attribute.boolean('active', { description: 'Whether process flow is active.' }),
    position: attribute.number('position', { defaultValue: 0, description: 'Valve opening from 0 to 100 percent.' }),
    value: attribute.number('value', { defaultValue: 0, description: 'Primary process value.' }),
    unit: attribute.string('unit', { defaultValue: 'm³/h', description: 'Primary process value unit.' }),
    status: attribute.enum('status', ['normal', 'warning', 'alarm'] as const, { defaultValue: 'normal' }),
    quality: attribute.enum('quality', ['unknown', 'good', 'stale', 'bad'] as const, { defaultValue: 'unknown' }),
    abstraction: attribute.enum('abstraction', semanticZoomLevels, { defaultValue: 'symbol', description: 'Semantic zoom level.' }),
  },
  states: {
    open: (context) => numberValue(context, 'position') > 1,
    closed: (context) => numberValue(context, 'position') <= 1,
    flowing: (context) => booleanValue(context, 'active') && numberValue(context, 'position') > 1,
  },
  bindings: [
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('position-label', (context) => `${Math.round(clamp(numberValue(context, 'position'), 0, 100))}% OPEN`, ['position']),
    bind.text('readout', (context) => `${numberValue(context, 'value').toFixed(1)} ${stringValue(context, 'unit')}`, ['value', 'unit']),
  ],
  motions: [
    {
      id: 'pid-valve-flow', type: 'loop', target: 'flow-marker',
      active: (context) => stateValue(context, 'flowing'),
      playbackRate: (context) => Math.max(.15, clamp(numberValue(context, 'position') / 100, 0, 1)),
      phase: 'process-flow',
      keyframes: [{ transform: 'translateX(0px)' }, { transform: 'translateX(260px)' }],
      options: { duration: 1600, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze',
    },
    {
      id: 'pid-valve-stem', type: 'scrub', target: 'stem-indicator',
      progress: (context) => clamp(numberValue(context, 'position') / 100, 0, 1),
      keyframes: [{ transform: 'translateY(15px)' }, { transform: 'translateY(0px)' }],
      options: { duration: 1000, fill: 'both', easing: 'linear' }, reducedMotion: 'preserve',
    },
    {
      id: 'pid-valve-aperture', type: 'scrub', target: 'aperture',
      progress: (context) => clamp(numberValue(context, 'position') / 100, 0, 1),
      keyframes: [{ transform: 'scaleY(.05)' }, { transform: 'scaleY(1)' }],
      options: { duration: 1000, fill: 'both', easing: 'linear' }, reducedMotion: 'preserve',
    },
    {
      id: 'pid-valve-severity', type: 'transition', target: 'status-outline',
      trigger: (context) => stringValue(context, 'status'),
      enabled: (context) => stringValue(context, 'status') !== 'normal',
      keyframes: [{ opacity: .35 }, { opacity: 1 }, { opacity: .72 }, { opacity: 1 }],
      options: { duration: 420, easing: 'ease-out' }, reducedMotion: 'finish',
    },
  ],
  ports: [
    { id: 'in', x: 8, y: 112, direction: 'left', kind: 'process' },
    { id: 'out', x: 292, y: 112, direction: 'right', kind: 'process' },
    { id: 'signal', x: 248, y: 4, direction: 'top', kind: 'signal' },
  ],
  parts: [
    { name: 'symbol', description: 'Canonical control-valve silhouette.', detail: 'essential' },
    { name: 'process-layer', description: 'Flow direction and moving markers.', detail: 'standard' },
    { name: 'operational-layer', description: 'Position, aperture, state, and tag.', detail: 'standard' },
    { name: 'diagnostic-layer', description: 'Readout and instrument signal.', detail: 'fine' },
    { name: 'flow-marker', detail: 'standard' },
    { name: 'stem-indicator', detail: 'standard' },
    { name: 'aperture', detail: 'standard' },
    { name: 'status-outline', description: 'Primary severity indicator.', detail: 'essential' },
    { name: 'state-dot', description: 'Open and flowing-state marker.', detail: 'standard' },
    { name: 'quality-indicator', description: 'Telemetry quality marker.', detail: 'fine' },
    { name: 'label', detail: 'standard' },
    { name: 'position-label', detail: 'standard' },
    { name: 'readout', detail: 'fine' },
  ],
});
