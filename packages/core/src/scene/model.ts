import type { PortDefinition, PortRole } from '../types.js';

export const connectionKinds = ['pipe', 'wire', 'signal'] as const;
export type ConnectionKind = (typeof connectionKinds)[number];

export const flowDirections = ['forward', 'reverse'] as const;
export type FlowDirection = (typeof flowDirections)[number];

export interface EndpointReference {
  readonly elementId: string;
  readonly portId: string;
}

/**
 * Process media shared by every element that shows a substance: pipe bores,
 * tank liquid, nozzle stubs. Each entry owns one CSS custom property so an
 * application can restyle water everywhere from a single declaration.
 */
export const mediumIds = [
  'water',
  'steam',
  'condensate',
  'oil',
  'fuel',
  'gas',
  'air',
  'chemical',
  'slurry',
  'glycol',
] as const;

export type MediumId = (typeof mediumIds)[number];

export interface MediumDefinition {
  readonly id: MediumId;
  readonly label: string;
  /** Custom property carrying the substance colour. */
  readonly variable: `--elements-medium-${MediumId}`;
  /** Fallback colour when the custom property is not set. */
  readonly color: string;
  /** Substances rendered as a compressible phase get a lighter, sparser flow. */
  readonly phase: 'liquid' | 'gas';
}

function defineMedium(id: MediumId, label: string, color: string, phase: MediumDefinition['phase']): MediumDefinition {
  return Object.freeze({ id, label, variable: `--elements-medium-${id}` as const, color, phase });
}

export const media: Readonly<Record<MediumId, MediumDefinition>> = Object.freeze({
  water: defineMedium('water', 'Water', '#59d8ff', 'liquid'),
  steam: defineMedium('steam', 'Steam', '#d9e8f2', 'gas'),
  condensate: defineMedium('condensate', 'Condensate', '#8fd7e8', 'liquid'),
  oil: defineMedium('oil', 'Oil', '#d9a441', 'liquid'),
  fuel: defineMedium('fuel', 'Fuel', '#e2743c', 'liquid'),
  gas: defineMedium('gas', 'Gas', '#f2d06b', 'gas'),
  air: defineMedium('air', 'Instrument air', '#a8c4d8', 'gas'),
  chemical: defineMedium('chemical', 'Chemical', '#b98cff', 'liquid'),
  slurry: defineMedium('slurry', 'Slurry', '#a08464', 'liquid'),
  glycol: defineMedium('glycol', 'Glycol', '#63e3a8', 'liquid'),
});

export function readMedium(value: string | null): MediumId | undefined {
  return mediumIds.includes(value as MediumId) ? (value as MediumId) : undefined;
}

export function mediumColor(id: MediumId): string {
  return `var(${media[id].variable}, ${media[id].color})`;
}

/** Emits `[data-medium="oil"] { --target: … }`-style rules for a given selector template. */
export function mediumStyles(selector: (id: MediumId) => string, declaration: (color: string) => string): string {
  return mediumIds.map((id) => `${selector(id)}{${declaration(mediumColor(id))}}`).join('');
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

/** An equipment port, or a scene node such as a junction referenced by id alone. */
export type EndpointSpec =
  | { readonly type: 'port'; readonly elementId: string; readonly portId: string }
  | { readonly type: 'node'; readonly nodeId: string };

export function parseEndpointSpec(value: string | null): EndpointSpec | undefined {
  if (value === null) return undefined;
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const reference = parseEndpointReference(trimmed);
  if (reference !== undefined) return { type: 'port', ...reference };
  if (trimmed.includes(':') || trimmed.includes('@')) return undefined;
  return { type: 'node', nodeId: trimmed };
}

/** Several endpoints separated by whitespace or commas, as `to` accepts for a tee. */
export function parseEndpointSpecs(value: string | null): readonly EndpointSpec[] {
  if (value === null) return [];
  const specs: EndpointSpec[] = [];
  for (const entry of value.split(/[\s,]+/)) {
    const spec = parseEndpointSpec(entry);
    if (spec !== undefined) specs.push(spec);
  }
  return specs;
}

export interface TapReference {
  readonly connectionId: string;
  /** Position along the tapped run; omitted means tap wherever the branch is shortest. */
  readonly fraction?: number;
}

/**
 * A `from` without a port — `header` or `header@0.6` — taps an existing run
 * instead of starting at a piece of equipment.
 */
export function parseTapReference(value: string | null): TapReference | undefined {
  if (value === null || value.includes(':')) return undefined;
  const [rawId, rawFraction, ...extra] = value.trim().split('@');
  const connectionId = rawId?.trim() ?? '';
  if (connectionId === '' || extra.length > 0) return undefined;
  if (rawFraction === undefined) return { connectionId };
  const fraction = finiteNumber(rawFraction);
  if (fraction === undefined) return undefined;
  return { connectionId, fraction: clamp(fraction, 0, 1) };
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

const portKindsByConnection: Readonly<Record<ConnectionKind, readonly string[]>> = Object.freeze({
  pipe: ['process'],
  wire: ['electrical', 'power'],
  signal: ['signal', 'network'],
});

export type PortCompatibilityIssue = 'kind' | 'role' | 'medium';

export interface PortCompatibility {
  readonly compatible: boolean;
  readonly issue?: PortCompatibilityIssue;
}

const compatible: PortCompatibility = Object.freeze({ compatible: true });

function incompatible(issue: PortCompatibilityIssue): PortCompatibility {
  return Object.freeze({ compatible: false, issue });
}

function rolesConflict(source: PortRole | undefined, target: PortRole | undefined): boolean {
  if (source === undefined || target === undefined) return false;
  if (source === 'bidirectional' || target === 'bidirectional') return false;
  return source === target;
}

/**
 * Endpoint validation for a routed connection. Ports keep their own domain,
 * role and medium so a scene can flag a wire pushed into a process nozzle, a
 * discharge wired to another discharge, or oil routed into a water header.
 */
export function portCompatibility(
  kind: ConnectionKind,
  source: Pick<PortDefinition, 'kind' | 'role' | 'medium'> | undefined,
  target: Pick<PortDefinition, 'kind' | 'role' | 'medium'> | undefined,
): PortCompatibility {
  if (source === undefined || target === undefined) return compatible;

  const allowed = portKindsByConnection[kind];
  for (const portKind of [source.kind, target.kind]) {
    if (portKind !== undefined && !allowed.includes(portKind)) return incompatible('kind');
  }
  if (source.kind !== undefined && target.kind !== undefined && source.kind !== target.kind) {
    return incompatible('kind');
  }
  if (rolesConflict(source.role, target.role)) return incompatible('role');
  if (source.medium !== undefined && target.medium !== undefined && source.medium !== target.medium) {
    return incompatible('medium');
  }
  return compatible;
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
