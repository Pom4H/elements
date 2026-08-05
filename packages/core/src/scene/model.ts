export const connectionKinds = ['pipe', 'wire', 'signal'] as const;
export type ConnectionKind = (typeof connectionKinds)[number];

export const flowDirections = ['forward', 'reverse'] as const;
export type FlowDirection = (typeof flowDirections)[number];

export interface EndpointReference {
  readonly elementId: string;
  readonly portId: string;
}

export interface ConnectionVisualMetrics {
  readonly outerWidth: number;
  readonly innerWidth: number;
  readonly flowWidth: number;
  readonly dash: number;
  readonly gap: number;
  readonly cycle: number;
}

function finiteNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function parseEndpointReference(value: string | null): EndpointReference | undefined {
  if (value === null) return undefined;
  const separator = value.indexOf(':');
  if (separator <= 0 || separator === value.length - 1) return undefined;
  const elementId = value.slice(0, separator).trim();
  const portId = value.slice(separator + 1).trim();
  if (elementId === '' || portId === '') return undefined;
  return { elementId, portId };
}

export function readConnectionKind(value: string | null): ConnectionKind {
  return connectionKinds.includes(value as ConnectionKind) ? (value as ConnectionKind) : 'pipe';
}

export function readFlowDirection(value: string | null): FlowDirection {
  return value === 'reverse' ? 'reverse' : 'forward';
}

export function readConnectionSpeed(value: string | null): number {
  return clamp(finiteNumber(value) ?? 1, 0, 8);
}

export function readConnectionDiameter(kind: ConnectionKind, value: string | null): number {
  const fallback = kind === 'pipe' ? 16 : kind === 'wire' ? 5 : 3;
  return clamp(finiteNumber(value) ?? fallback, kind === 'pipe' ? 8 : 2, kind === 'pipe' ? 48 : 12);
}

export function connectionVisualMetrics(kind: ConnectionKind, diameter: number): ConnectionVisualMetrics {
  if (kind === 'pipe') {
    const outerWidth = diameter;
    const innerWidth = diameter * 0.66;
    const flowWidth = Math.max(3, diameter * 0.32);
    const dash = Math.max(8, diameter * 0.72);
    const gap = Math.max(7, diameter * 0.58);
    return { outerWidth, innerWidth, flowWidth, dash, gap, cycle: dash + gap };
  }

  if (kind === 'wire') {
    const outerWidth = diameter;
    const innerWidth = Math.max(1, diameter * 0.42);
    const flowWidth = Math.max(1.5, diameter * 0.34);
    const dash = Math.max(5, diameter * 1.3);
    const gap = Math.max(5, diameter * 1.15);
    return { outerWidth, innerWidth, flowWidth, dash, gap, cycle: dash + gap };
  }

  const outerWidth = diameter;
  const innerWidth = Math.max(1, diameter * 0.45);
  const flowWidth = Math.max(1, diameter * 0.4);
  const dash = 4;
  const gap = 6;
  return { outerWidth, innerWidth, flowWidth, dash, gap, cycle: dash + gap };
}
