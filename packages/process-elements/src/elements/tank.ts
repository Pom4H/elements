import {
  attribute,
  bind,
  defineElementDefinition,
  defineFragment,
  detailStyles,
  media,
  mediumColor,
  mediumIds,
  ports,
  svg,
  viewBox,
  type ElementContext,
  type FragmentPlacement,
  type PortDefinition,
} from '@pom4h/elements-core';
import { booleanValue, clamp, numberValue, stateValue, stringValue } from '../shared.js';

/**
 * Every dimension the level, the gauge and the ports depend on, per body style.
 * Both bodies expose the same part names, so one set of bindings and motions
 * drives either one.
 */
interface BodyMetrics {
  readonly viewBox: string;
  /** Liquid surface height at 100%. */
  readonly liquidTop: number;
  /** Liquid surface height at 0%. */
  readonly liquidBottom: number;
  readonly gaugeX: number;
  readonly gaugeTop: number;
  readonly gaugeHeight: number;
  readonly panel: string;
  /** Where the dynamic nozzles march along the shell. */
  readonly nozzleFrom: number;
  readonly nozzleTo: number;
  readonly nozzleAxis: number;
}

const verticalBody: BodyMetrics = Object.freeze({
  viewBox: '0 0 380 452',
  liquidTop: 74,
  liquidBottom: 358,
  gaugeX: 336,
  gaugeTop: 96,
  gaugeHeight: 240,
  panel: 'translate(66 410)',
  nozzleFrom: 124,
  nozzleTo: 324,
  nozzleAxis: 88,
});

const horizontalBody: BodyMetrics = Object.freeze({
  viewBox: '0 0 470 348',
  liquidTop: 94,
  liquidBottom: 246,
  gaugeX: 424,
  gaugeTop: 100,
  gaugeHeight: 140,
  panel: 'translate(200 302)',
  nozzleFrom: 124,
  nozzleTo: 340,
  nozzleAxis: 94,
});

function isHorizontal(context: ElementContext): boolean {
  return stringValue(context, 'orientation') === 'horizontal';
}

function body(context: ElementContext): BodyMetrics {
  return isHorizontal(context) ? horizontalBody : verticalBody;
}

function level(context: ElementContext): number {
  return clamp(numberValue(context, 'level'), 0, 100);
}

function nozzleCount(context: ElementContext): number {
  return Math.round(clamp(numberValue(context, 'nozzles'), 0, 6));
}

/** Evenly spaced along the straight shell, so two nozzles never share a seat. */
function nozzleOffset(metrics: BodyMetrics, index: number, count: number): number {
  const span = metrics.nozzleTo - metrics.nozzleFrom;
  return metrics.nozzleFrom + ((index + 0.5) * span) / Math.max(1, count);
}

/** The gauge scale runs bottom-up: 0% at the base of the track, 100% at its top. */
function gaugeY(metrics: BodyMetrics, percent: number): number {
  return metrics.gaugeTop + metrics.gaugeHeight * (1 - clamp(percent, 0, 100) / 100);
}

const gaugeMarkup = (metrics: BodyMetrics): string => `
<g class="gauge" data-part="gauge" data-detail="standard">
  <rect class="gauge-track" x="${metrics.gaugeX}" y="${metrics.gaugeTop}" width="14" height="${metrics.gaugeHeight}" rx="7"/>
  <rect class="gauge-band gauge-band-low" data-part="band-low" x="${metrics.gaugeX}" width="14" y="${metrics.gaugeTop}" height="0"/>
  <rect class="gauge-band gauge-band-high" data-part="band-high" x="${metrics.gaugeX}" width="14" y="${metrics.gaugeTop}" height="0"/>
  <rect class="gauge-alarm" data-part="mark-low-alarm" x="${metrics.gaugeX - 3}" width="20" height="2" y="${metrics.gaugeTop}"/>
  <rect class="gauge-alarm" data-part="mark-high-alarm" x="${metrics.gaugeX - 3}" width="20" height="2" y="${metrics.gaugeTop}"/>
  <g transform="translate(${metrics.gaugeX} ${metrics.gaugeTop + metrics.gaugeHeight})">
    <g data-part="level-marker">
      <path class="level-mark" d="M-4 0 L-16 -6 V6 Z"/>
    </g>
  </g>
  <text class="gauge-label" x="${metrics.gaugeX + 18}" y="${metrics.gaugeTop + 5}" data-detail="fine">100</text>
  <text class="gauge-label" x="${metrics.gaugeX + 18}" y="${metrics.gaugeTop + metrics.gaugeHeight + 5}" data-detail="fine">0</text>
</g>`;

/**
 * Liquid, foam and surface stack. `liquid-carrier` is the scrub target and
 * carries no other transform; the wave rides one level deeper so its loop adds
 * to the level instead of replacing it.
 */
const liquidMarkup = (metrics: BodyMetrics, clipId: string, width: number): string => `
<g clip-path="url(#${clipId})">
  <g data-part="liquid-carrier">
    <rect class="liquid" x="0" y="${metrics.liquidTop}" width="${width}" height="${metrics.liquidBottom - metrics.liquidTop + 340}"/>
    <rect class="foam" data-part="foam-band" x="0" y="${metrics.liquidTop}" width="${width}" height="0"/>
    <g data-part="surface-wave">
      <path class="wave" d="M-120 ${metrics.liquidTop} q30 -7 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 V${metrics.liquidTop + 26} H-120 Z"/>
    </g>
    <g transform="translate(${width / 2} ${metrics.liquidTop + 16})">
      <g data-part="vortex">
        <ellipse class="vortex-ring" rx="46" ry="12"/>
        <ellipse class="vortex-ring" rx="26" ry="7"/>
      </g>
    </g>
  </g>
</g>`;

const verticalVessel = defineFragment({
  name: 'tank-vertical',
  template: svg`
<defs>
  <clipPath id="interior">
    <path d="M88 96 A94 22 0 0 1 276 96 V336 A94 22 0 0 1 88 336 Z"/>
  </clipPath>
</defs>

<path class="shell-fill" d="M84 96 A98 26 0 0 1 280 96 V336 A98 26 0 0 1 84 336 Z"/>
${liquidMarkup(verticalBody, 'interior', 340)}
<path class="shell-outline" data-part="shell" d="M84 96 A98 26 0 0 1 280 96 V336 A98 26 0 0 1 84 336 Z"/>
<path class="shell-seam" d="M84 336 A98 26 0 0 0 280 336" data-detail="fine"/>
<path class="shell-highlight" d="M104 130 V310" data-detail="fine"/>

<rect class="flange" x="110" y="34" width="40" height="10" rx="3"/>
<rect class="nozzle" x="118" y="42" width="24" height="32"/>
<rect class="flange" x="222" y="52" width="34" height="9" rx="3" data-detail="standard"/>
<rect class="nozzle" x="230" y="58" width="18" height="26" data-detail="standard"/>
<rect class="nozzle" x="170" y="350" width="24" height="46"/>
<rect class="flange" x="162" y="394" width="40" height="10" rx="3"/>

<path class="leg" d="M114 342 L98 400 H114 L128 342 Z"/>
<path class="leg" d="M250 342 L266 400 H250 L236 342 Z"/>
<rect class="leg-pad" x="92" y="398" width="28" height="8" rx="3"/>
<rect class="leg-pad" x="244" y="398" width="28" height="8" rx="3"/>

<g class="instrument" data-part="temperature-bubble" transform="translate(306 176)" data-detail="standard">
  <circle class="bubble" r="17"/>
  <text class="bubble-text" y="-2" text-anchor="middle" data-detail="fine">TI</text>
  <text class="bubble-value" y="9" text-anchor="middle" data-part="temperature-readout">48</text>
</g>
<g class="instrument" data-part="pressure-bubble" transform="translate(306 250)" data-detail="standard">
  <circle class="bubble" r="17"/>
  <text class="bubble-text" y="-2" text-anchor="middle" data-detail="fine">PI</text>
  <text class="bubble-value" y="9" text-anchor="middle" data-part="pressure-readout">1.8</text>
</g>
<path class="tap" d="M276 176 H290 M276 250 H290" data-detail="fine"/>
${gaugeMarkup(verticalBody)}
`,
});

const horizontalVessel = defineFragment({
  name: 'tank-horizontal',
  template: svg`
<defs>
  <clipPath id="interior">
    <path d="M88 94 H382 A20 76 0 0 1 382 246 H88 A20 76 0 0 1 88 94 Z"/>
  </clipPath>
</defs>

<path class="shell-fill" d="M84 90 H386 A24 80 0 0 1 386 250 H84 A24 80 0 0 1 84 90 Z"/>
${liquidMarkup(horizontalBody, 'interior', 470)}
<path class="shell-outline" data-part="shell" d="M84 90 H386 A24 80 0 0 1 386 250 H84 A24 80 0 0 1 84 90 Z"/>
<path class="shell-seam" d="M84 90 A24 80 0 0 0 84 250 M386 90 A24 80 0 0 0 386 250" data-detail="fine"/>
<path class="shell-highlight" d="M120 112 H350" data-detail="fine"/>

<rect class="nozzle" x="93" y="56" width="22" height="36"/>
<rect class="flange" x="89" y="46" width="30" height="10" rx="3"/>
<rect class="nozzle" x="364" y="60" width="18" height="30" data-detail="standard"/>
<rect class="flange" x="356" y="52" width="34" height="9" rx="3" data-detail="standard"/>
<rect class="nozzle" x="223" y="248" width="24" height="38"/>
<rect class="flange" x="215" y="284" width="40" height="10" rx="3"/>

<path class="saddle" d="M120 248 H186 L198 288 H108 Z"/>
<path class="saddle" d="M288 248 H354 L366 288 H276 Z"/>

<g class="instrument" data-part="temperature-bubble" transform="translate(98 318)" data-detail="standard">
  <circle class="bubble" r="17"/>
  <text class="bubble-text" y="-2" text-anchor="middle" data-detail="fine">TI</text>
  <text class="bubble-value" y="9" text-anchor="middle" data-part="temperature-readout">48</text>
</g>
<g class="instrument" data-part="pressure-bubble" transform="translate(158 318)" data-detail="standard">
  <circle class="bubble" r="17"/>
  <text class="bubble-text" y="-2" text-anchor="middle" data-detail="fine">PI</text>
  <text class="bubble-value" y="9" text-anchor="middle" data-part="pressure-readout">1.8</text>
</g>
<path class="tap" d="M98 292 V301 M158 292 V301" data-detail="fine"/>
${gaugeMarkup(horizontalBody)}
`,
});

const sideNozzle = defineFragment({
  name: 'tank-nozzle-side',
  template: svg`
<rect class="nozzle" x="-34" y="-11" width="36" height="22"/>
<rect class="flange" x="-44" y="-15" width="10" height="30" rx="3"/>
<circle class="bolt" cx="-39" cy="-10" r="1.8" data-detail="fine"/>
<circle class="bolt" cx="-39" cy="10" r="1.8" data-detail="fine"/>
`,
});

const topNozzle = defineFragment({
  name: 'tank-nozzle-top',
  template: svg`
<rect class="nozzle" x="-11" y="-34" width="22" height="36"/>
<rect class="flange" x="-15" y="-44" width="30" height="10" rx="3"/>
<circle class="bolt" cx="-10" cy="-39" r="1.8" data-detail="fine"/>
<circle class="bolt" cx="10" cy="-39" r="1.8" data-detail="fine"/>
`,
});

const verticalAgitator = defineFragment({
  name: 'tank-agitator-vertical',
  template: svg`
<rect class="drive-case" x="158" y="6" width="52" height="40" rx="8"/>
<rect class="drive-lid" x="166" y="0" width="36" height="8" rx="3"/>
<rect class="gearbox" x="164" y="44" width="40" height="20" rx="4"/>
<rect class="shaft" x="179" y="60" width="10" height="228" rx="3"/>
<g transform="translate(184 292)">
  <g class="impeller" data-part="impeller">
    <ellipse class="impeller-hub" rx="9" ry="5"/>
    <path class="impeller-blade" d="M-52 0 C-34 -9 -14 -9 0 0 C-14 9 -34 9 -52 0 Z"/>
    <path class="impeller-blade" d="M52 0 C34 -9 14 -9 0 0 C14 9 34 9 52 0 Z"/>
  </g>
</g>
<g transform="translate(184 236)" data-detail="standard">
  <g class="impeller" data-part="impeller-upper">
    <path class="impeller-blade" d="M-38 0 C-24 -7 -10 -7 0 0 C-10 7 -24 7 -38 0 Z"/>
    <path class="impeller-blade" d="M38 0 C24 -7 10 -7 0 0 C10 7 24 7 38 0 Z"/>
  </g>
</g>
`,
});

const horizontalAgitator = defineFragment({
  name: 'tank-agitator-horizontal',
  template: svg`
<rect class="drive-case" x="4" y="146" width="46" height="48" rx="8"/>
<rect class="gearbox" x="48" y="158" width="20" height="24" rx="4"/>
<rect class="shaft" x="66" y="165" width="132" height="10" rx="3"/>
<g transform="translate(198 170)">
  <g class="impeller" data-part="impeller">
    <ellipse class="impeller-hub" rx="5" ry="9"/>
    <path class="impeller-blade" d="M0 -46 C9 -30 9 -12 0 0 C-9 -12 -9 -30 0 -46 Z"/>
    <path class="impeller-blade" d="M0 46 C9 30 9 12 0 0 C-9 12 -9 30 0 46 Z"/>
  </g>
</g>
`,
});

const verticalHeater = defineFragment({
  name: 'tank-heater-vertical',
  template: svg`
<path class="heater-coil" data-part="heater-coil" d="M112 316 H248 M248 316 C260 322 260 330 248 334 H112 C100 338 100 346 112 350 H248"/>
<rect class="heater-gland" x="94" y="310" width="20" height="14" rx="3"/>
`,
});

const horizontalHeater = defineFragment({
  name: 'tank-heater-horizontal',
  template: svg`
<path class="heater-coil" data-part="heater-coil" d="M120 214 H340 M340 214 C352 219 352 226 340 230 H120 C108 234 108 241 120 244 H340"/>
<rect class="heater-gland" x="102" y="208" width="20" height="14" rx="3"/>
`,
});

function tankAssembly(context: ElementContext): readonly FragmentPlacement[] {
  const horizontal = isHorizontal(context);
  const metrics = body(context);
  const count = nozzleCount(context);

  const placements: FragmentPlacement[] = [
    { key: 'vessel', fragment: horizontal ? horizontalVessel : verticalVessel },
  ];

  for (let index = 0; index < count; index += 1) {
    const offset = nozzleOffset(metrics, index, count);
    placements.push({
      key: `nozzle-${index + 1}`,
      fragment: horizontal ? topNozzle : sideNozzle,
      x: horizontal ? offset : metrics.nozzleAxis,
      y: horizontal ? metrics.nozzleAxis : offset,
    });
  }

  if (booleanValue(context, 'agitator')) {
    placements.push({ key: 'agitator', fragment: horizontal ? horizontalAgitator : verticalAgitator });
  }
  if (booleanValue(context, 'heater')) {
    placements.push({ key: 'heater', fragment: horizontal ? horizontalHeater : verticalHeater });
  }
  return placements;
}

function tankPorts(context: ElementContext): readonly PortDefinition[] {
  const horizontal = isHorizontal(context);
  const metrics = body(context);
  const medium = stringValue(context, 'medium', 'water');
  const fixed: readonly PortDefinition[] = horizontal
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

  const count = nozzleCount(context);
  const nozzles: PortDefinition[] = [];
  for (let index = 0; index < count; index += 1) {
    const offset = nozzleOffset(metrics, index, count);
    nozzles.push({
      id: `nozzle-${index + 1}`,
      x: horizontal ? offset : metrics.nozzleAxis - 44,
      y: horizontal ? metrics.nozzleAxis - 44 : offset,
      direction: horizontal ? 'top' : 'left',
      kind: 'process',
      role: 'bidirectional',
      medium,
      label: `Nozzle ${index + 1}`,
    });
  }
  return [...fixed, ...nozzles];
}

/** The registry default: a vertical vessel with the two nozzles the tag ships with. */
const defaultPorts: readonly PortDefinition[] = tankPorts({
  host: undefined as unknown as HTMLElement,
  attributes: { orientation: 'vertical', nozzles: 2, medium: 'water' },
  states: {},
});

function mediumLabel(context: ElementContext): string {
  const id = stringValue(context, 'medium', 'water');
  const definition = mediumIds.includes(id as (typeof mediumIds)[number])
    ? media[id as (typeof mediumIds)[number]]
    : media.water;
  return definition.label.toUpperCase();
}

const liquidStyles = mediumIds
  .map((id) => `:host([medium="${id}"]) .liquid,:host([medium="${id}"]) .wave{fill:${mediumColor(id)};fill-opacity:${media[id].phase === 'gas' ? 0.26 : 0.72}}`)
  .join('');

export const tankDefinition = defineElementDefinition({
  tagName: 'pe-tank',
  displayName: 'Storage tank',
  description: 'A process vessel with clip-path liquid level, limit bands, a generated nozzle set with matching ports, optional agitator and heater, and vertical or horizontal bodies.',
  viewBox: viewBox(verticalBody.viewBox, (context) => body(context).viewBox),
  template: svg`<defs>
<linearGradient id="tank-shell" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#22394d"/><stop offset=".26" stop-color="#33506a"/><stop offset=".62" stop-color="#1b2f42"/><stop offset="1" stop-color="#101f2d"/></linearGradient>
<linearGradient id="tank-steel" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8196a8"/><stop offset=".42" stop-color="#41586c"/><stop offset="1" stop-color="#1d3042"/></linearGradient>
<filter id="tank-green" x="-150%" y="-150%" width="400%" height="400%"><feDropShadow dx="0" dy="0" stdDeviation="2.4" flood-color="#56e29a" flood-opacity=".7"/></filter>
<filter id="tank-amber" x="-150%" y="-150%" width="400%" height="400%"><feDropShadow dx="0" dy="0" stdDeviation="2.4" flood-color="#ffbe4a" flood-opacity=".68"/></filter>
<filter id="tank-red" x="-150%" y="-150%" width="400%" height="400%"><feDropShadow dx="0" dy="0" stdDeviation="2.6" flood-color="#ff5c74" flood-opacity=".74"/></filter>
<filter id="tank-heat" x="-120%" y="-120%" width="340%" height="340%"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#ff8a4a" flood-opacity=".8"/></filter>
</defs>

<g data-mount="vessel"/>

<g class="tag-panel" data-part="tag-panel" transform="${verticalBody.panel}">
  <rect class="tag-plate" width="248" height="34" rx="7" data-detail="standard"/>
  <rect class="status-strip" data-part="status-strip" width="5" height="34" rx="2.5" data-detail="standard"/>
  <text class="tag" x="16" y="22" data-detail="standard" data-part="label">T-101</text>
  <text class="meta" x="86" y="21" data-detail="standard" data-part="meta">WATER · 45 m³</text>
  <text class="readout" x="236" y="22" text-anchor="end" data-detail="standard" data-part="readout">72%</text>
</g>
`,
  styles: `
:host{display:inline-block;width:var(--tank-intrinsic-width,380px);max-width:100%;aspect-ratio:var(--elements-aspect-ratio,380 / 452);color:var(--elements-ink,#dbe7f3);container-type:inline-size;contain:layout style}
svg{width:100%;height:100%;overflow:visible}

.shell-fill{fill:url(#tank-shell)}
.shell-outline{fill:none;stroke:#a7bac9;stroke-width:2.4}
.shell-seam{fill:none;stroke:#8ba0b3;stroke-width:1.1;stroke-opacity:.55}
.shell-highlight{fill:none;stroke:#cfe9f8;stroke-opacity:.16;stroke-width:9;stroke-linecap:round}
.nozzle,.saddle,.leg,.leg-pad,.gearbox,.heater-gland{fill:url(#tank-steel);stroke:#a3b6c5;stroke-width:1.4}
.flange{fill:url(#tank-steel);stroke:#c0ccd6;stroke-width:1.7}
.bolt{fill:#263a4d;stroke:#bbc9d4;stroke-width:.7}
.liquid,.wave{fill:${mediumColor('water')};fill-opacity:.72}
.foam{fill:#e8f6ff;fill-opacity:.34}
.vortex-ring{fill:none;stroke:#ffffff;stroke-opacity:.22;stroke-width:2}
.drive-case,.drive-lid{fill:url(#tank-shell);stroke:#a3b6c5;stroke-width:1.5}
.shaft{fill:url(#tank-steel);stroke:#c8d4dd;stroke-width:1}
.impeller,[data-part="vortex"]{transform-box:fill-box;transform-origin:center}
.impeller-hub{fill:#16283a;stroke:#cfe4f0;stroke-width:1.2}
.impeller-blade{fill:#7fb6d4;fill-opacity:.6;stroke:#cbe6f5;stroke-width:1}
.heater-coil{fill:none;stroke:#6c839a;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}
.instrument .bubble{fill:#07131f;stroke:#8ba0b3;stroke-width:1.3}
.bubble-text{fill:#7d93a8;font:700 7px/1 ui-monospace,monospace;letter-spacing:.1em}
.bubble-value{fill:#71d8ff;font:800 9px/1 ui-monospace,monospace}
.tap{stroke:#8ba0b3;stroke-width:2}
.gauge-track{fill:#0d1e2c;stroke:#5c748a;stroke-width:1}
.gauge-band-low,.gauge-band-high{fill:var(--elements-warning,#ffbe4a);fill-opacity:.26}
.gauge-alarm{fill:var(--elements-alarm,#ff5c74);fill-opacity:.85}
.level-mark{fill:#6fe0ff;stroke:#d5f4ff;stroke-width:.8}
.gauge-label{fill:#7d93a8;font:700 6px/1 ui-monospace,monospace}
.tag-plate{fill:#07121e;stroke:#4e6579;stroke-width:1}
.status-strip{fill:#56e29a;filter:url(#tank-green)}
.tag{fill:#edf4fa;font:700 14px/1 ui-monospace,monospace;letter-spacing:.08em}
.meta{fill:#72889d;font:600 7px/1 ui-monospace,monospace;letter-spacing:.09em}
.readout{fill:#71d8ff;font:700 11px/1 ui-monospace,monospace}

${liquidStyles}

:host(:not([data-state~="foaming"])) .foam{display:none}
:host(:not([data-state~="agitating"])) [data-part="vortex"]{display:none}
:host([data-state~="heating"]) .heater-coil{stroke:#ff8a4a;filter:url(#tank-heat)}
:host([data-state~="low"]) .level-mark,:host([data-state~="high"]) .level-mark{fill:var(--elements-warning,#ffbe4a)}
:host([data-state~="low-alarm"]) .level-mark,:host([data-state~="high-alarm"]) .level-mark{fill:var(--elements-alarm,#ff5c74)}
:host([data-state~="warning"]) .status-strip{fill:var(--elements-warning,#ffbe4a);filter:url(#tank-amber)}
:host([data-state~="alarm"]) .status-strip{fill:var(--elements-alarm,#ff5c74);filter:url(#tank-red)}
:host([data-state~="alarm"]) .shell-outline{stroke:var(--elements-alarm,#ff5c74)}
:host([data-state~="bad-quality"]) svg{opacity:.42;filter:grayscale(1)}
:host([data-state~="stale"]) svg{opacity:.64;filter:saturate(.35)}
${detailStyles({ hideFineBelow: 300, hideStandardBelow: 200 })}
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
    medium: attribute.enum('medium', mediumIds, { defaultValue: 'water', description: 'Stored substance. Sets the liquid colour and propagates to the process ports.' }),
    capacity: attribute.number('capacity', { defaultValue: 0, minimum: 0, step: 1, unit: 'm³', description: 'Nominal capacity in cubic metres.' }),
    orientation: attribute.enum('orientation', ['vertical', 'horizontal'] as const, { defaultValue: 'vertical', description: 'Body style. Changes the viewport, the shell and the nozzle axis.' }),
    nozzles: attribute.number('nozzles', { defaultValue: 2, minimum: 0, maximum: 6, step: 1, description: 'Number of generated shell nozzles from 0 to 6. Each one adds a port.' }),
    foam: attribute.number('foam', { defaultValue: 0, minimum: 0, maximum: 100, step: 1, unit: '%', description: 'Foam layer thickness from 0 to 100 percent of the vessel height.' }),
    agitator: attribute.boolean('agitator', { description: 'Whether an agitator is installed.' }),
    agitatorSpeed: attribute.number('agitatorSpeed', { attribute: 'agitator-speed', defaultValue: 0, minimum: 0, step: 5, unit: 'rpm', description: 'Agitator shaft speed in rpm.' }),
    heater: attribute.boolean('heater', { description: 'Whether a heating coil is installed.' }),
    heating: attribute.boolean('heating', { description: 'Whether the heating coil is energised.' }),
    status: attribute.enum('status', ['idle', 'normal', 'warning', 'alarm'] as const, { defaultValue: 'idle', description: 'Process status independent from data quality.' }),
    quality: attribute.enum('quality', ['good', 'stale', 'bad'] as const, { defaultValue: 'good', description: 'Telemetry quality independent from process status.' }),
    detail: attribute.enum('detail', ['auto', 'full', 'compact', 'symbol'] as const, { defaultValue: 'auto', description: 'Visual level of detail.' }),
  },
  states: {
    horizontal: isHorizontal,
    empty: (context) => level(context) <= 0.5,
    full: (context) => level(context) >= 99.5,
    low: (context) => level(context) < numberValue(context, 'lowLimit'),
    high: (context) => level(context) > numberValue(context, 'highLimit'),
    'low-alarm': (context) => level(context) <= numberValue(context, 'lowAlarm'),
    'high-alarm': (context) => level(context) >= numberValue(context, 'highAlarm'),
    agitating: (context) => booleanValue(context, 'agitator') && numberValue(context, 'agitatorSpeed') > 0,
    heating: (context) => booleanValue(context, 'heater') && booleanValue(context, 'heating'),
    foaming: (context) => numberValue(context, 'foam') > 0,
    warning: (context) => stringValue(context, 'status') === 'warning'
      || level(context) < numberValue(context, 'lowLimit')
      || level(context) > numberValue(context, 'highLimit'),
    alarm: (context) => stringValue(context, 'status') === 'alarm'
      || level(context) <= numberValue(context, 'lowAlarm')
      || level(context) >= numberValue(context, 'highAlarm'),
    stale: (context) => stringValue(context, 'quality') === 'stale',
    'bad-quality': (context) => stringValue(context, 'quality') === 'bad',
  },
  collections: [{ mount: 'vessel', items: tankAssembly }],
  bindings: [
    bind.style('host', '--tank-intrinsic-width', (context) => (isHorizontal(context) ? '470px' : '380px'), ['orientation']),
    bind.attribute('tag-panel', 'transform', (context) => body(context).panel, ['orientation']),
    bind.text('label', (context) => stringValue(context, 'label'), ['label']),
    bind.text('meta', (context) => {
      const capacity = numberValue(context, 'capacity');
      const substance = mediumLabel(context);
      return capacity > 0 ? `${substance} · ${capacity} m³` : substance;
    }, ['medium', 'capacity']),
    bind.text('readout', (context) => `${level(context).toFixed(0)}%`, ['level']),
    bind.text('temperature-readout', (context) => `${Math.round(numberValue(context, 'temperature'))}`, ['temperature']),
    bind.text('pressure-readout', (context) => numberValue(context, 'pressure').toFixed(1), ['pressure']),
    // Limit bands are geometry derived from data: the warning zones grow and
    // shrink with the configured thresholds.
    bind.attribute('band-low', 'y', (context) => gaugeY(body(context), numberValue(context, 'lowLimit')), ['lowLimit', 'orientation']),
    bind.attribute('band-low', 'height', (context) => {
      const metrics = body(context);
      return metrics.gaugeTop + metrics.gaugeHeight - gaugeY(metrics, numberValue(context, 'lowLimit'));
    }, ['lowLimit', 'orientation']),
    bind.attribute('band-high', 'height', (context) => {
      const metrics = body(context);
      return gaugeY(metrics, numberValue(context, 'highLimit')) - metrics.gaugeTop;
    }, ['highLimit', 'orientation']),
    bind.attribute('mark-low-alarm', 'y', (context) => gaugeY(body(context), numberValue(context, 'lowAlarm')) - 1, ['lowAlarm', 'orientation']),
    bind.attribute('mark-high-alarm', 'y', (context) => gaugeY(body(context), numberValue(context, 'highAlarm')) - 1, ['highAlarm', 'orientation']),
    bind.attribute('foam-band', 'height', (context) => {
      const metrics = body(context);
      return (clamp(numberValue(context, 'foam'), 0, 100) / 100) * (metrics.liquidBottom - metrics.liquidTop);
    }, ['foam', 'orientation']),
  ],
  motions: [
    {
      // Level is the one place the settle really shows: a tank that jumps
      // between telemetry samples reads as a rendering glitch.
      id: 'liquid-level', type: 'scrub', target: 'liquid-carrier',
      progress: (context) => level(context) / 100,
      settle: 900,
      keyframes: (context) => [
        { transform: `translateY(${body(context).liquidBottom - body(context).liquidTop}px)` },
        { transform: 'translateY(0px)' },
      ],
      options: { duration: 1000, fill: 'both' }, reducedMotion: 'preserve',
    },
    {
      id: 'level-marker', type: 'scrub', target: 'level-marker',
      progress: (context) => level(context) / 100,
      settle: 900,
      keyframes: (context) => [
        { transform: 'translateY(0px)' },
        { transform: `translateY(-${body(context).gaugeHeight}px)` },
      ],
      options: { duration: 1000, fill: 'both' }, reducedMotion: 'preserve',
    },
    {
      id: 'surface-wave', type: 'loop', target: 'surface-wave',
      active: (context) => !stateValue(context, 'empty') && !stateValue(context, 'full'),
      playbackRate: (context) => (stateValue(context, 'agitating') ? 2.4 : 1),
      phase: 'process-surface',
      keyframes: [{ transform: 'translateX(0px)' }, { transform: 'translateX(120px)' }],
      options: { duration: 4200, iterations: Infinity, easing: 'linear' }, reducedMotion: 'freeze',
    },
    {
      id: 'vortex-swirl', type: 'loop', target: 'vortex',
      active: (context) => stateValue(context, 'agitating'),
      playbackRate: (context) => Math.max(0.2, numberValue(context, 'agitatorSpeed') / 90),
      keyframes: [
        { transform: 'scale(1) translateY(0px)', opacity: 0.2 },
        { transform: 'scale(0.72) translateY(6px)', opacity: 0.8 },
        { transform: 'scale(1) translateY(0px)', opacity: 0.2 },
      ],
      options: { duration: 2600, iterations: Infinity, easing: 'ease-in-out' }, reducedMotion: 'freeze',
    },
    {
      id: 'impeller-spin', type: 'loop', target: 'impeller',
      active: (context) => stateValue(context, 'agitating'),
      playbackRate: (context) => Math.max(0.15, numberValue(context, 'agitatorSpeed') / 90),
      phase: 'process-mechanical',
      // A disc foreshortens along the axis perpendicular to its shaft, so a
      // side-entry impeller squashes vertically and a top-entry one horizontally.
      keyframes: (context) => (isHorizontal(context)
        ? [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.16)' }, { transform: 'scaleY(1)' }]
        : [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0.16)' }, { transform: 'scaleX(1)' }]),
      options: { duration: 900, iterations: Infinity, easing: 'ease-in-out' }, reducedMotion: 'freeze',
    },
    {
      id: 'impeller-upper-spin', type: 'loop', target: 'impeller-upper',
      active: (context) => stateValue(context, 'agitating'),
      playbackRate: (context) => Math.max(0.15, numberValue(context, 'agitatorSpeed') / 90),
      phase: 'process-mechanical',
      keyframes: [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0.16)' }, { transform: 'scaleX(1)' }],
      options: { duration: 900, iterations: Infinity, easing: 'ease-in-out' }, reducedMotion: 'freeze',
    },
    {
      id: 'heater-glow', type: 'loop', target: 'heater-coil',
      active: (context) => stateValue(context, 'heating'),
      keyframes: [{ opacity: 0.55 }, { opacity: 1 }, { opacity: 0.55 }],
      options: { duration: 2200, iterations: Infinity, easing: 'ease-in-out' }, reducedMotion: 'finish',
    },
    {
      id: 'alarm-pulse', type: 'loop', target: 'status-strip',
      active: (context) => stateValue(context, 'alarm'),
      keyframes: [{ opacity: 0.3 }, { opacity: 1 }, { opacity: 0.3 }],
      options: { duration: 760, iterations: Infinity, easing: 'ease-in-out' }, reducedMotion: 'finish',
    },
  ],
  // Nozzle count and body style both rewrite the port set, so a scene has to
  // read ports off the live instance rather than the definition.
  ports: ports(defaultPorts, tankPorts),
  parts: [
    { name: 'shell', description: 'Vessel shell outline.', detail: 'essential' },
    { name: 'liquid-carrier', description: 'Clipped liquid stack driven by the level.', detail: 'essential' },
    { name: 'surface-wave', description: 'Nested surface ripple that rides on the level.', detail: 'standard' },
    { name: 'foam-band', description: 'Foam layer whose thickness follows the foam value.', detail: 'standard' },
    { name: 'vortex', description: 'Surface vortex shown while the agitator runs.', detail: 'standard' },
    { name: 'impeller', description: 'Agitator impeller.', detail: 'essential' },
    { name: 'heater-coil', description: 'Heating coil.', detail: 'standard' },
    { name: 'gauge', description: 'Level gauge with warning bands and alarm marks.', detail: 'standard' },
    { name: 'level-marker', description: 'Level pointer on the gauge.', detail: 'standard' },
    { name: 'band-low', detail: 'standard' },
    { name: 'band-high', detail: 'standard' },
    { name: 'temperature-readout', detail: 'standard' },
    { name: 'pressure-readout', detail: 'standard' },
    { name: 'status-strip', detail: 'standard' },
    { name: 'label', detail: 'standard' },
    { name: 'readout', detail: 'standard' },
    { name: 'meta', detail: 'standard' },
  ],
});
