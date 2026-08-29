import {
  attribute,
  bind,
  defineElementDefinition,
  media,
  mediumColor,
  mediumIds,
  ports,
  svg,
  viewBox,
  type ElementContext,
  type PortDefinition,
} from '@pom4h/elements-core';
import { booleanValue, clamp, numberValue, stateValue, stringValue } from '../shared.js';

const views = ['pid', 'flat', 'equipment'] as const;
const details = ['auto', 'full', 'compact', 'symbol'] as const;

interface BodyMetrics {
  readonly viewBox: string;
  readonly top: number;
  readonly bottom: number;
  readonly gaugeX: number;
  readonly gaugeTop: number;
  readonly gaugeHeight: number;
  readonly panel: string;
  readonly nozzleFrom: number;
  readonly nozzleTo: number;
  readonly nozzleAxis: number;
}

const vertical: BodyMetrics = Object.freeze({ viewBox: '0 0 380 452', top: 82, bottom: 350, gaugeX: 330, gaugeTop: 102, gaugeHeight: 224, panel: 'translate(66 410)', nozzleFrom: 124, nozzleTo: 324, nozzleAxis: 88 });
const horizontal: BodyMetrics = Object.freeze({ viewBox: '0 0 470 348', top: 98, bottom: 242, gaugeX: 420, gaugeTop: 106, gaugeHeight: 126, panel: 'translate(200 302)', nozzleFrom: 124, nozzleTo: 340, nozzleAxis: 94 });

function isHorizontal(context: ElementContext): boolean { return stringValue(context, 'orientation') === 'horizontal'; }
function metrics(context: ElementContext): BodyMetrics { return isHorizontal(context) ? horizontal : vertical; }
function level(context: ElementContext): number { return clamp(numberValue(context, 'level'), 0, 100); }
function nozzleCount(context: ElementContext): number { return Math.round(clamp(numberValue(context, 'nozzles'), 0, 6)); }
function nozzleOffset(body: BodyMetrics, index: number, count: number): number { return body.nozzleFrom + ((index + .5) * (body.nozzleTo - body.nozzleFrom)) / Math.max(1, count); }
function gaugeY(body: BodyMetrics, percent: number): number { return body.gaugeTop + body.gaugeHeight * (1 - clamp(percent, 0, 100) / 100); }

function tankPorts(context: ElementContext): readonly PortDefinition[] {
  const body = metrics(context);
  const medium = stringValue(context, 'medium', 'water');
  const fixed: readonly PortDefinition[] = isHorizontal(context)
    ? [
      { id: 'in', x: 104, y: 40, direction: 'top', kind: 'process', role: 'inlet', medium, label: 'Fill' },
      { id: 'out', x: 235, y: 298, direction: 'bottom', kind: 'process', role: 'outlet', medium, label: 'Drain' },
      { id: 'vent', x: 373, y: 48, direction: 'top', kind: 'process', role: 'outlet', label: 'Vent' },
    ]
    : [
      { id: 'in', x: 130, y: 30, direction: 'top', kind: 'process', role: 'inlet', medium, label: 'Fill' },
      { id: 'out', x: 182, y: 408, direction: 'bottom', kind: 'process', role: 'outlet', medium, label: 'Drain' },
      { id: 'vent', x: 239, y: 48, direction: 'top', kind: 'process', role: 'outlet', label: 'Vent' },
    ];
  const extra: PortDefinition[] = [];
  const count = nozzleCount(context);
  for (let index = 0; index < count; index += 1) {
    const offset = nozzleOffset(body, index, count);
    extra.push({ id: `nozzle-${index + 1}`, x: isHorizontal(context) ? offset : body.nozzleAxis - 44, y: isHorizontal(context) ? body.nozzleAxis - 44 : offset, direction: isHorizontal(context) ? 'top' : 'left', kind: 'process', role: 'bidirectional', medium, label: `Nozzle ${index + 1}` });
  }
  return [...fixed, ...extra];
}

const defaultPorts = tankPorts({ host: undefined as unknown as HTMLElement, attributes: { orientation: 'vertical', nozzles: 2, medium: 'water' }, states: {} });

function mediumLabel(context: ElementContext): string {
  const id = stringValue(context, 'medium', 'water');
  return (mediumIds.includes(id as (typeof mediumIds)[number]) ? media[id as (typeof mediumIds)[number]] : media.water).label.toUpperCase();
}

const mediumRules = mediumIds.map((id) => `:host([medium="${id}"]) .liquid{fill:${mediumColor(id)};fill-opacity:${media[id].phase === 'gas' ? .24 : .68}}`).join('');

export const tankDefinition = defineElementDefinition({
  tagName: 'pe-tank',
  displayName: 'Storage tank',
  description: 'A vessel with P&ID, flat SCADA and equipment SVG views sharing one level, threshold, nozzle and port contract.',
  viewBox: viewBox(vertical.viewBox, (context) => metrics(context).viewBox),
  template: svg`
<defs>
  <clipPath id="v-eq"><path d="M88 92 A94 22 0 0 1 276 92 V338 A94 22 0 0 1 88 338 Z"/></clipPath>
  <clipPath id="v-flat"><rect x="92" y="86" width="184" height="258" rx="42"/></clipPath>
  <clipPath id="h-eq"><path d="M88 94 H382 A22 74 0 0 1 382 242 H88 A22 74 0 0 1 88 94 Z"/></clipPath>
  <clipPath id="h-flat"><rect x="84" y="96" width="304" height="144" rx="40"/></clipPath>
</defs>

<!-- Vertical P&ID -->
<g class="view pid-view vertical-view">
  <path class="line" d="M130 30 V72 M182 350 V408 M239 48 V72"/>
  <path class="pid-shell" data-part="shell" d="M92 82 H272 V350 H92 Z"/>
  <rect class="liquid" data-part="liquid-carrier" x="94" y="82" width="176" height="268"/>
  <path class="level-line" d="M94 82 H270" data-part="surface-wave"/>
  <path class="status-outline" data-part="status-outline" d="M84 74 H280 V358 H84 Z"/>
</g>

<!-- Vertical flat SCADA -->
<g class="view flat-view vertical-view">
  <rect class="body" data-part="shell" x="92" y="86" width="184" height="258" rx="42"/>
  <g clip-path="url(#v-flat)"><rect class="liquid" data-part="liquid-carrier" x="92" y="82" width="184" height="270"/><path class="level-line" data-part="surface-wave" d="M92 82 H276"/></g>
  <path class="fitting" d="M119 42 H141 V86 H119 Z M171 344 H193 V398 H171 Z M229 54 H247 V86 H229 Z"/>
  <path class="status-outline" data-part="status-outline" d="M86 80 H282 V350 H86 Z"/>
  <g class="gauge" data-part="gauge"><rect class="gauge-track" x="330" y="102" width="10" height="224" rx="5"/><g data-part="level-marker" transform="translate(330 326)"><path class="level-marker" d="M0 0 L-13 -6 V6 Z"/></g></g>
</g>

<!-- Vertical equipment -->
<g class="view equipment-view vertical-view">
  <path class="body" d="M84 94 A100 26 0 0 1 284 94 V338 A100 26 0 0 1 84 338 Z"/>
  <g clip-path="url(#v-eq)"><rect class="liquid" data-part="liquid-carrier" x="88" y="82" width="188" height="280"/><path class="level-line" data-part="surface-wave" d="M88 82 H276"/></g>
  <path class="shell" data-part="shell" d="M84 94 A100 26 0 0 1 284 94 V338 A100 26 0 0 1 84 338 Z"/>
  <path class="fitting" d="M118 42 H142 V76 H118 Z M170 350 H194 V396 H170 Z M229 58 H247 V84 H229 Z"/>
  <path class="leg" d="M114 340 L99 400 H116 L129 340 Z M251 340 L266 400 H249 L236 340 Z"/>
  <path class="status-outline" data-part="status-outline" d="M78 88 A106 31 0 0 1 290 88 V344 A106 31 0 0 1 78 344 Z"/>
  <g class="gauge" data-part="gauge"><rect class="gauge-track" x="330" y="102" width="10" height="224" rx="5"/><g data-part="level-marker" transform="translate(330 326)"><path class="level-marker" d="M0 0 L-13 -6 V6 Z"/></g></g>
  <g class="agitator" data-part="agitator" transform="translate(184 116)"><path class="mechanism" d="M0 -72 V118 M-48 118 H48"/><g data-part="impeller"><path class="mechanism" d="M-46 118 Q-24 103 0 118 Q24 133 46 118"/></g></g>
  <path class="heater" data-part="heater-coil" d="M112 310 H248 Q262 318 248 326 H112 Q98 334 112 342 H248"/>
</g>

<!-- Horizontal P&ID -->
<g class="view pid-view horizontal-view">
  <path class="line" d="M104 40 V88 M235 242 V298 M373 48 V88"/>
  <rect class="pid-shell" data-part="shell" x="84" y="94" width="304" height="148" rx="38"/>
  <rect class="liquid" data-part="liquid-carrier" x="86" y="98" width="300" height="144"/>
  <path class="level-line" data-part="surface-wave" d="M86 98 H386"/>
  <rect class="status-outline" data-part="status-outline" x="76" y="86" width="320" height="164" rx="46"/>
</g>

<!-- Horizontal flat SCADA -->
<g class="view flat-view horizontal-view">
  <rect class="body" data-part="shell" x="84" y="96" width="304" height="144" rx="40"/>
  <g clip-path="url(#h-flat)"><rect class="liquid" data-part="liquid-carrier" x="84" y="98" width="304" height="148"/><path class="level-line" data-part="surface-wave" d="M84 98 H388"/></g>
  <path class="fitting" d="M93 58 H115 V96 H93 Z M224 240 H246 V288 H224 Z M364 62 H382 V96 H364 Z"/>
  <rect class="status-outline" data-part="status-outline" x="76" y="88" width="320" height="160" rx="48"/>
  <g class="gauge" data-part="gauge"><rect class="gauge-track" x="420" y="106" width="10" height="126" rx="5"/><g data-part="level-marker" transform="translate(420 232)"><path class="level-marker" d="M0 0 L-13 -6 V6 Z"/></g></g>
</g>

<!-- Horizontal equipment -->
<g class="view equipment-view horizontal-view">
  <path class="body" d="M84 92 H386 A26 78 0 0 1 386 248 H84 A26 78 0 0 1 84 92 Z"/>
  <g clip-path="url(#h-eq)"><rect class="liquid" data-part="liquid-carrier" x="88" y="98" width="294" height="150"/><path class="level-line" data-part="surface-wave" d="M88 98 H382"/></g>
  <path class="shell" data-part="shell" d="M84 92 H386 A26 78 0 0 1 386 248 H84 A26 78 0 0 1 84 92 Z"/>
  <path class="fitting" d="M93 56 H115 V92 H93 Z M224 248 H246 V288 H224 Z M364 62 H382 V92 H364 Z"/>
  <path class="leg" d="M120 248 H180 L190 286 H110 Z M292 248 H352 L362 286 H282 Z"/>
  <rect class="status-outline" data-part="status-outline" x="76" y="84" width="320" height="172" rx="48"/>
  <g class="gauge" data-part="gauge"><rect class="gauge-track" x="420" y="106" width="10" height="126" rx="5"/><g data-part="level-marker" transform="translate(420 232)"><path class="level-marker" d="M0 0 L-13 -6 V6 Z"/></g></g>
  <g class="agitator" data-part="agitator"><path class="mechanism" d="M52 170 H206"/><g data-part="impeller" transform="translate(206 170)"><path class="mechanism" d="M0 -38 Q-12 -18 0 0 Q12 18 0 38"/></g></g>
  <path class="heater" data-part="heater-coil" d="M126 204 H342 Q354 211 342 218 H126 Q114 225 126 232 H342"/>
</g>

<g class="tag-panel" data-part="tag-panel" transform="translate(66 410)" data-detail="standard">
  <rect class="panel" width="248" height="30" rx="5"/>
  <rect class="operation-strip" data-part="status-strip" width="4" height="30" rx="2"/>
  <text class="tag" x="14" y="20" data-part="label">T-101</text>
  <text class="meta" x="82" y="19" data-part="meta">WATER · 45 m³</text>
  <text class="readout" x="235" y="20" text-anchor="end" data-part="readout">72%</text>
</g>
`,
  styles: `
:host{display:inline-block;width:var(--tank-intrinsic-width,380px);max-width:100%;aspect-ratio:var(--elements-aspect-ratio,380 / 452);color:var(--elements-ink,#dbe7f3);container-type:inline-size;contain:layout style;--eq-body:var(--elements-equipment-body,#31485a);--eq-body-2:var(--elements-equipment-body-alt,#3d566a);--eq-stroke:var(--elements-equipment-stroke,#9aafbd);--eq-line:var(--elements-line,#8095a4);--eq-panel:var(--elements-panel,#0d1922);--eq-muted:var(--elements-muted,#7890a1);--eq-process:var(--elements-process,#43bce8)}svg{width:100%;height:100%;overflow:visible}.view{display:none}:host(:not([orientation="horizontal"])) .vertical-view,:host([orientation="vertical"]) .vertical-view,:host([orientation="horizontal"]) .horizontal-view{display:none}:host(:not([orientation="horizontal"]):not([view])) .equipment-view.vertical-view,:host([orientation="vertical"]:not([view])) .equipment-view.vertical-view,:host([orientation="horizontal"]:not([view])) .equipment-view.horizontal-view,:host([view="equipment"]:not([orientation="horizontal"])) .equipment-view.vertical-view,:host([view="equipment"][orientation="vertical"]) .equipment-view.vertical-view,:host([view="equipment"][orientation="horizontal"]) .equipment-view.horizontal-view,:host([view="flat"]:not([orientation="horizontal"])) .flat-view.vertical-view,:host([view="flat"][orientation="vertical"]) .flat-view.vertical-view,:host([view="flat"][orientation="horizontal"]) .flat-view.horizontal-view,:host([view="pid"]:not([orientation="horizontal"])) .pid-view.vertical-view,:host([view="pid"][orientation="vertical"]) .pid-view.vertical-view,:host([view="pid"][orientation="horizontal"]) .pid-view.horizontal-view{display:inline}
.body{fill:var(--eq-body);stroke:var(--eq-stroke);stroke-width:2}.shell,.pid-shell{fill:none;stroke:var(--eq-stroke);stroke-width:2.2}.pid-shell{stroke-width:3}.fitting,.leg{fill:var(--eq-body-2);stroke:var(--eq-stroke);stroke-width:1.5}.line,.mechanism{fill:none;stroke:var(--eq-line);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.liquid{fill:${mediumColor('water')};fill-opacity:.68}.level-line{fill:none;stroke:color-mix(in srgb,var(--eq-process) 70%,white);stroke-width:2}.status-outline{fill:none;stroke:transparent;stroke-width:3}.gauge-track{fill:var(--eq-panel);stroke:var(--eq-line);stroke-width:1}.level-marker{fill:var(--eq-process)}.heater{fill:none;stroke:var(--eq-muted);stroke-width:5;stroke-linecap:round}.agitator{display:none}.heater{display:none}:host([agitator]) .agitator{display:inline}:host([heater]) .heater{display:inline}.panel{fill:var(--eq-panel);stroke:var(--eq-line);stroke-width:1}.operation-strip{fill:var(--eq-muted)}.tag{fill:currentColor;font:700 13px/1 ui-monospace,monospace;letter-spacing:.06em}.meta{fill:var(--eq-muted);font:650 8px/1 ui-monospace,monospace}.readout{fill:var(--eq-process);font:750 10px/1 ui-monospace,monospace}
${mediumRules}
:host([data-state~="agitating"]) .operation-strip{fill:var(--elements-ok,#56e29a)}:host([data-state~="heating"]) .heater{stroke:#ff8a4a}:host([data-state~="warning"]) .status-outline{stroke:var(--elements-warning,#ffbe4a)}:host([data-state~="alarm"]) .status-outline{stroke:var(--elements-alarm,#ff5c74)}:host([data-state~="low"]) .level-marker,:host([data-state~="high"]) .level-marker{fill:var(--elements-warning,#ffbe4a)}:host([data-state~="low-alarm"]) .level-marker,:host([data-state~="high-alarm"]) .level-marker{fill:var(--elements-alarm,#ff5c74)}:host([data-state~="bad-quality"]) .readout{opacity:.26}:host([data-state~="stale"]) .readout{opacity:.62}
:host([detail="compact"]) [data-detail="fine"],:host([detail="symbol"]) [data-detail]{display:none}:host([detail="symbol"]) text{display:none}
`,
  attributes: {
    label: attribute.string('label', { defaultValue: 'T-101', description: 'Equipment label.' }),
    level: attribute.number('level', { defaultValue: 0, minimum: 0, maximum: 100, step: 1, unit: '%', cssVariable: '--tank-level', description: 'Liquid level from 0 to 100 percent.' }),
    temperature: attribute.number('temperature', { defaultValue: 0, step: 1, unit: '°C', description: 'Contents temperature in degrees Celsius.' }),
    pressure: attribute.number('pressure', { defaultValue: 0, minimum: 0, step: 0.1, unit: 'bar', description: 'Vapour space pressure in bar.' }),
    lowLimit: attribute.number('lowLimit', { attribute: 'low-limit', defaultValue: 20, description: 'Low level warning threshold.' }),
    highLimit: attribute.number('highLimit', { attribute: 'high-limit', defaultValue: 80, description: 'High level warning threshold.' }),
    lowAlarm: attribute.number('lowAlarm', { attribute: 'low-alarm', defaultValue: 5, description: 'Low level alarm threshold.' }),
    highAlarm: attribute.number('highAlarm', { attribute: 'high-alarm', defaultValue: 95, description: 'High level alarm threshold.' }),
    medium: attribute.enum('medium', mediumIds, { defaultValue: 'water', description: 'Stored substance. Sets the liquid colour and propagates to process ports.' }),
    capacity: attribute.number('capacity', { defaultValue: 0, minimum: 0, step: 1, unit: 'm³', description: 'Nominal capacity in cubic metres.' }),
    orientation: attribute.enum('orientation', ['vertical', 'horizontal'] as const, { defaultValue: 'vertical', description: 'Body orientation.' }),
    nozzles: attribute.number('nozzles', { defaultValue: 2, minimum: 0, maximum: 6, step: 1, description: 'Number of generated process ports.' }),
    foam: attribute.number('foam', { defaultValue: 0, minimum: 0, maximum: 100, step: 1, unit: '%', description: 'Foam layer thickness.' }),
    agitator: attribute.boolean('agitator', { description: 'Whether an agitator is installed.' }),
    agitatorSpeed: attribute.number('agitatorSpeed', { attribute: 'agitator-speed', defaultValue: 0, minimum: 0, step: 5, unit: 'rpm', description: 'Agitator shaft speed.' }),
    heater: attribute.boolean('heater', { description: 'Whether a heating coil is installed.' }),
    heating: attribute.boolean('heating', { description: 'Whether the heating coil is energised.' }),
    status: attribute.enum('status', ['idle', 'normal', 'warning', 'alarm'] as const, { defaultValue: 'idle', description: 'Process status independent from data quality.' }),
    quality: attribute.enum('quality', ['good', 'stale', 'bad'] as const, { defaultValue: 'good', description: 'Telemetry quality independent from process status.' }),
    detail: attribute.enum('detail', details, { defaultValue: 'auto', description: 'Visual level of detail.' }),
    view: attribute.enum('view', views, { defaultValue: 'equipment', description: 'SVG visual family. Does not change the vessel data or ports.' }),
  },
  states: {
    horizontal: isHorizontal,
    empty: (context) => level(context) <= .5,
    full: (context) => level(context) >= 99.5,
    low: (context) => level(context) < numberValue(context, 'lowLimit'),
    high: (context) => level(context) > numberValue(context, 'highLimit'),
    'low-alarm': (context) => level(context) <= numberValue(context, 'lowAlarm'),
    'high-alarm': (context) => level(context) >= numberValue(context, 'highAlarm'),
    agitating: (context) => booleanValue(context, 'agitator') && numberValue(context, 'agitatorSpeed') > 0,
    heating: (context) => booleanValue(context, 'heater') && booleanValue(context, 'heating'),
    foaming: (context) => numberValue(context, 'foam') > 0,
    warning: (context) => stringValue(context, 'status') === 'warning' || level(context) < numberValue(context, 'lowLimit') || level(context) > numberValue(context, 'highLimit'),
    alarm: (context) => stringValue(context, 'status') === 'alarm' || level(context) <= numberValue(context, 'lowAlarm') || level(context) >= numberValue(context, 'highAlarm'),
    stale: (context) => stringValue(context, 'quality') === 'stale',
    'bad-quality': (context) => stringValue(context, 'quality') === 'bad',
  },
  bindings: [
    bind.style('host', '--tank-intrinsic-width', (context) => (isHorizontal(context) ? '470px' : '380px'), ['orientation']),
    bind.attribute('tag-panel', 'transform', (context) => metrics(context).panel, ['orientation']),
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('meta', (context) => { const capacity = numberValue(context, 'capacity'); const substance = mediumLabel(context); return capacity > 0 ? `${substance} · ${capacity} m³` : substance; }, ['medium', 'capacity']),
    bind.text('readout', (context) => `${level(context).toFixed(0)}%`, ['level']),
  ],
  motions: [
    { id: 'liquid-level', type: 'scrub', target: 'liquid-carrier', progress: (context) => level(context) / 100, settle: 900, keyframes: (context) => [{ transform: `translateY(${metrics(context).bottom - metrics(context).top}px)` }, { transform: 'translateY(0px)' }], options: { duration: 1000, fill: 'both' }, reducedMotion: 'preserve' },
    { id: 'level-marker', type: 'scrub', target: 'level-marker', progress: (context) => level(context) / 100, settle: 900, keyframes: (context) => [{ transform: 'translateY(0px)' }, { transform: `translateY(-${metrics(context).gaugeHeight}px)` }], options: { duration: 1000, fill: 'both' }, reducedMotion: 'preserve' },
    { id: 'impeller-spin', type: 'loop', target: 'impeller', active: (context) => stateValue(context, 'agitating'), playbackRate: (context) => Math.max(.15, numberValue(context, 'agitatorSpeed') / 90), phase: 'process-mechanical', keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], options: { duration: 1200, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze' },
  ],
  ports: ports(defaultPorts, tankPorts),
  parts: [
    { name: 'shell', description: 'Vessel silhouette in every visual family.', detail: 'essential' },
    { name: 'liquid-carrier', description: 'Level scrub target.', detail: 'essential' },
    { name: 'surface-wave', description: 'Liquid surface.', detail: 'standard' },
    { name: 'agitator', description: 'Agitator assembly.', detail: 'standard' },
    { name: 'impeller', description: 'Agitator motion target.', detail: 'standard' },
    { name: 'heater-coil', description: 'Heating coil.', detail: 'standard' },
    { name: 'gauge', description: 'Level gauge.', detail: 'standard' },
    { name: 'level-marker', description: 'Gauge level marker.', detail: 'standard' },
    { name: 'status-outline', description: 'Warning/alarm outline.', detail: 'essential' },
    { name: 'status-strip', detail: 'standard' },
    { name: 'label', detail: 'standard' },
    { name: 'readout', detail: 'standard' },
    { name: 'meta', detail: 'standard' },
  ],
});
