import { detailStyles, type ElementContext } from '@pom4h/elements-core';

export const electricalStatuses = ['normal', 'warning', 'alarm'] as const;
export const electricalQualities = ['unknown', 'good', 'stale', 'bad'] as const;
export const electricalDetails = ['auto', 'full', 'compact', 'symbol'] as const;

export function numberValue(context: ElementContext, name: string, fallback = 0): number {
  const value = Number(context.attributes[name]);
  return Number.isFinite(value) ? value : fallback;
}

export function stringValue(context: ElementContext, name: string, fallback = ''): string {
  const value = context.attributes[name];
  return typeof value === 'string' ? value : fallback;
}

export function booleanValue(context: ElementContext, name: string): boolean {
  return context.attributes[name] === true;
}

export function stateValue(context: ElementContext, name: string): boolean {
  return context.states[name] === true;
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export const electricalDetailStyles = detailStyles({ hideFineBelow: 260, hideStandardBelow: 165 });

export const electricalBaseStyles = `
:host{display:inline-block;max-width:100%;color:var(--elements-ink,#dbe7f3);container-type:inline-size;contain:layout style}
svg{width:100%;height:100%;overflow:visible}
.outline,.wire,.terminal,.symbol-line{fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.panel{fill:var(--elements-panel,#08131d);stroke:var(--elements-line,#526a7f);stroke-width:1.2}
.label,.readout,.meta{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.label{fill:currentColor;font-size:12px;font-weight:800;letter-spacing:.08em}
.readout{fill:var(--elements-electric-live,#ffd166);font-size:10px;font-weight:750}
.meta{fill:var(--elements-muted,#7890a5);font-size:8px;font-weight:650;letter-spacing:.06em}
.status-primary{stroke:var(--elements-ok,#56e29a)}
.status-dot{fill:var(--elements-ok,#56e29a)}
:host([status="warning"]) .status-primary{stroke:var(--elements-warning,#ffbe4a)}
:host([status="warning"]) .status-dot{fill:var(--elements-warning,#ffbe4a)}
:host([status="alarm"]) .status-primary{stroke:var(--elements-alarm,#ff5c74)}
:host([status="alarm"]) .status-dot{fill:var(--elements-alarm,#ff5c74)}
[data-quality-sensitive]{opacity:.45}
:host([quality="good"]) [data-quality-sensitive]{opacity:1}
:host([quality="stale"]) [data-quality-sensitive]{opacity:.62}
:host([quality="bad"]) [data-quality-sensitive]{opacity:.28}
${electricalDetailStyles}
`;
