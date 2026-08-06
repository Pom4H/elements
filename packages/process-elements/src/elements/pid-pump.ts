import {
  attribute,
  bind,
  defineElementDefinition,
  semanticZoomLevels,
  semanticZoomStyles,
  svg,
} from '@pom4h/elements-core';
import { booleanValue, clamp, numberValue, stateValue, stringValue } from '../shared.js';

/**
 * The essential layer uses the common ISO 10628-style circle-and-flow-wedge
 * convention for a centrifugal pump. Higher layers never replace that shape;
 * they only add process, operational, and diagnostic information.
 */
export const pidPumpDefinition = defineElementDefinition({
  tagName: 'pe-pid-pump',
  displayName: 'Semantic zoom centrifugal pump',
  description: 'A symbol-first centrifugal pump that progressively reveals live process, operational, and diagnostic layers.',
  viewBox: '0 0 320 220',
  template: svg`
<g data-part="symbol" data-zoom-layer="symbol">
  <path class="process-line" d="M8 110 H70 M190 110 H312"/>
  <circle class="symbol-body status-ring" data-part="status-ring" data-status-primary cx="130" cy="110" r="60"/>
  <path class="symbol-wedge" d="M96 72 L176 110 L96 148 Z"/>
</g>

<g data-part="process-layer" data-zoom-layer="process">
  <path class="flow-guide" d="M16 110 H304"/>
  <g class="flow-marker" data-part="flow-marker">
    <circle cx="16" cy="110" r="4"/>
    <circle cx="2" cy="110" r="2.5"/>
  </g>
  <path class="direction" d="M205 100 L219 110 L205 120"/>
</g>

<g data-part="operational-layer" data-zoom-layer="operational">
  <g transform="translate(130 110)">
    <g class="rotor" data-part="rotor">
      <path d="M0 -29 L9 -9 L0 0 L-9 -9 Z"/>
      <path d="M29 0 L9 9 L0 0 L9 -9 Z"/>
      <path d="M0 29 L-9 9 L0 0 L9 9 Z"/>
      <path d="M-29 0 L-9 -9 L0 0 L-9 9 Z"/>
    </g>
  </g>
  <circle class="hub" cx="130" cy="110" r="5"/>
  <circle class="state-dot" data-part="state-dot" data-operation-marker cx="180" cy="61" r="6"/>
  <path class="drive-line" d="M190 110 H229"/>
  <circle class="motor-symbol" cx="250" cy="110" r="21"/>
  <text class="motor-label" x="250" y="114" text-anchor="middle">M</text>
  <text class="tag" data-part="label" x="130" y="189" text-anchor="middle">P-101</text>
</g>

<g data-part="diagnostic-layer" data-zoom-layer="diagnostic">
  <rect class="readout-panel" data-quality-sensitive x="73" y="12" width="114" height="31" rx="6"/>
  <text class="readout" data-part="readout" data-quality-sensitive x="130" y="32" text-anchor="middle">6.2 BAR</text>
  <circle class="quality-indicator" data-part="quality-indicator" data-quality-indicator cx="196" cy="27" r="4"/>
  <text class="speed" data-part="speed-label" data-quality-sensitive x="250" y="145" text-anchor="middle">1450 RPM</text>
  <rect class="load-track" data-quality-sensitive x="204" y="158" width="92" height="7" rx="3.5"/>
  <rect class="load-bar" data-part="load-bar" data-quality-sensitive x="204" y="158" width="92" height="7" rx="3.5"/>
  <text class="diagnostic-label" data-quality-sensitive x="250" y="180" text-anchor="middle">SHAFT LOAD</text>
</g>
`,
  styles: `
${semanticZoomStyles('abstraction')}
:host{display:inline-block;width:320px;max-width:100%;aspect-ratio:16/11;color:var(--elements-ink,#dbe7f3);container-type:inline-size;contain:layout style}svg{width:100%;height:100%;overflow:visible}.process-line,.symbol-body,.symbol-wedge,.drive-line,.motor-symbol{fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.symbol-wedge{fill:var(--elements-surface,#0b1721)}.flow-guide{fill:none;stroke:var(--elements-process-flow,#4bcfff);stroke-width:1.5;stroke-dasharray:4 7;opacity:.34}.flow-marker{fill:var(--elements-process-flow,#4bcfff);filter:drop-shadow(0 0 4px color-mix(in srgb,var(--elements-process-flow,#4bcfff),transparent 30%))}.direction{fill:none;stroke:var(--elements-process-flow,#4bcfff);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.rotor{fill:var(--elements-process-flow,#4bcfff);transform-box:fill-box;transform-origin:center;opacity:.82}.hub{fill:currentColor}.state-dot{fill:var(--elements-muted,#7890a5);transform-box:fill-box;transform-origin:center}.quality-indicator{fill:#72869a;stroke:#a8b7c5;stroke-width:.7}.motor-label,.tag,.readout,.speed,.diagnostic-label{font-family:ui-monospace,SFMono-Regular,monospace}.motor-label{fill:currentColor;font-size:14px;font-weight:800}.tag{fill:currentColor;font-size:12px;font-weight:750;letter-spacing:.08em}.readout-panel{fill:var(--elements-panel,#08131d);stroke:var(--elements-line,#526a7f)}.readout{fill:var(--elements-process-flow,#4bcfff);font-size:11px;font-weight:750}.speed{fill:var(--elements-muted,#7890a5);font-size:9px}.load-track{fill:var(--elements-panel,#08131d);stroke:var(--elements-line,#526a7f);stroke-width:1}.load-bar{fill:var(--elements-process-flow,#4bcfff);transform-box:view-box;transform-origin:204px 161.5px}.diagnostic-label{fill:var(--elements-muted,#7890a5);font-size:7px;letter-spacing:.12em}[data-quality-sensitive]{opacity:.42}:host([data-state~="running"]) .state-dot{fill:var(--elements-ok,#56e29a)}:host([status="warning"]) .status-ring{stroke:var(--elements-warning,#ffbe4a)}:host([status="alarm"]) .status-ring{stroke:var(--elements-alarm,#ff5c74)}:host([quality="good"]) [data-quality-sensitive]{opacity:1}:host([quality="stale"]) [data-quality-sensitive]{opacity:.62}:host([quality="bad"]) [data-quality-sensitive]{opacity:.26}:host([quality="good"]) [data-quality-indicator]{fill:var(--elements-ok,#56e29a);stroke:#baffd8}:host([quality="stale"]) [data-quality-indicator]{fill:var(--elements-warning,#ffbe4a);stroke:#ffe1a4}:host([quality="bad"]) [data-quality-indicator]{fill:var(--elements-alarm,#ff5c74);stroke:#ffc0ca}:host(:not([data-state~="running"])) .flow-marker,:host(:not([data-state~="running"])) .rotor{opacity:.18}@container(max-width:220px){.diagnostic-label,.speed{display:none}}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'P-101', description: 'Equipment label.' }),
    running: attribute.boolean('running', { description: 'Whether the pump is running.' }),
    speed: attribute.number('speed', { defaultValue: 0, description: 'Shaft speed in rpm.' }),
    value: attribute.number('value', { defaultValue: 0, description: 'Primary process value.' }),
    unit: attribute.string('unit', { defaultValue: 'bar', description: 'Primary process value unit.' }),
    status: attribute.enum('status', ['normal', 'warning', 'alarm'] as const, { defaultValue: 'normal' }),
    quality: attribute.enum('quality', ['unknown', 'good', 'stale', 'bad'] as const, { defaultValue: 'unknown' }),
    abstraction: attribute.enum('abstraction', semanticZoomLevels, { defaultValue: 'symbol', description: 'Semantic zoom level.' }),
  },
  states: {
    running: (context) => booleanValue(context, 'running') && numberValue(context, 'speed') > 0,
  },
  bindings: [
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('readout', (context) => `${numberValue(context, 'value').toFixed(1)} ${stringValue(context, 'unit').toUpperCase()}`, ['value', 'unit']),
    bind.text('speed-label', (context) => `${Math.round(numberValue(context, 'speed'))} RPM`, ['speed']),
  ],
  motions: [
    {
      id: 'pid-pump-rotor', type: 'loop', target: 'rotor',
      active: (context) => stateValue(context, 'running'),
      playbackRate: (context) => Math.max(.08, numberValue(context, 'speed') / 1450),
      phase: 'process-mechanical',
      keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      options: { duration: 1350, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze',
    },
    {
      id: 'pid-pump-flow', type: 'loop', target: 'flow-marker',
      active: (context) => stateValue(context, 'running'),
      playbackRate: (context) => Math.max(.12, numberValue(context, 'speed') / 1450),
      phase: 'process-flow',
      keyframes: [{ transform: 'translateX(0px)' }, { transform: 'translateX(280px)' }],
      options: { duration: 1700, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze',
    },
    {
      id: 'pid-pump-start', type: 'transition', target: 'state-dot',
      trigger: (context) => stateValue(context, 'running'),
      enabled: (context) => stateValue(context, 'running'),
      keyframes: [{ transform: 'scale(.35)', opacity: .2 }, { transform: 'scale(1.6)', opacity: 1 }, { transform: 'scale(1)', opacity: 1 }],
      options: { duration: 420, easing: 'ease-out' }, reducedMotion: 'finish',
    },
    {
      id: 'pid-pump-load', type: 'scrub', target: 'load-bar',
      progress: (context) => clamp(numberValue(context, 'speed') / 2900, 0, 1),
      keyframes: [{ transform: 'scaleX(.04)' }, { transform: 'scaleX(1)' }],
      options: { duration: 1000, fill: 'both', easing: 'linear' }, reducedMotion: 'preserve',
    },
    {
      id: 'pid-pump-severity', type: 'transition', target: 'status-ring',
      trigger: (context) => stringValue(context, 'status'),
      enabled: (context) => stringValue(context, 'status') !== 'normal',
      keyframes: [{ opacity: .35 }, { opacity: 1 }, { opacity: .72 }, { opacity: 1 }],
      options: { duration: 420, easing: 'ease-out' }, reducedMotion: 'finish',
    },
  ],
  ports: [
    { id: 'in', x: 8, y: 110, direction: 'left', kind: 'process' },
    { id: 'out', x: 312, y: 110, direction: 'right', kind: 'process' },
    { id: 'power', x: 271, y: 89, direction: 'top', kind: 'electrical' },
  ],
  parts: [
    { name: 'symbol', description: 'Canonical ISO-style pump silhouette.', detail: 'essential' },
    { name: 'process-layer', description: 'Process direction and moving flow markers.', detail: 'standard' },
    { name: 'operational-layer', description: 'Rotor, drive, state, and tag.', detail: 'standard' },
    { name: 'diagnostic-layer', description: 'Readouts and shaft-load visualization.', detail: 'fine' },
    { name: 'rotor', detail: 'standard' },
    { name: 'flow-marker', detail: 'standard' },
    { name: 'status-ring', description: 'Primary severity indicator.', detail: 'essential' },
    { name: 'state-dot', description: 'Running-state marker.', detail: 'standard' },
    { name: 'quality-indicator', description: 'Telemetry quality marker.', detail: 'fine' },
    { name: 'load-bar', detail: 'fine' },
    { name: 'label', detail: 'standard' },
    { name: 'readout', detail: 'fine' },
    { name: 'speed-label', detail: 'fine' },
  ],
});
