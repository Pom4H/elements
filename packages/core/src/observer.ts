import type {
  ObserverContext,
  ObserverFidelity,
  ObserverIntent,
  ObserverRole,
  ObserverScale,
  RepresentationDefinition,
  RepresentationFidelity,
} from './types.js';

export const observerAttributeNames = [
  'observer-role',
  'observer-intent',
  'observer-scale',
  'observer-fidelity',
  'observer-capabilities',
] as const;

export const representationOverrideAttribute = 'representation' as const;
export const observerProviderSelector = [
  '[data-elements-observer]',
  'elements-scene',
  ...observerAttributeNames.map((name) => `[${name}]`),
].join(',');

const fidelities = ['symbol', 'operational', 'structural', 'twin'] as const;
const roles = ['viewer', 'operator', 'maintenance', 'engineer', 'installer', 'simulator'] as const;
const intents = ['overview', 'monitor', 'operate', 'diagnose', 'configure', 'install', 'simulate'] as const;
const scales = ['plant', 'system', 'equipment', 'component'] as const;

const fidelityRank: Readonly<Record<RepresentationFidelity, number>> = {
  symbol: 0,
  operational: 1,
  structural: 2,
  twin: 3,
};

const roleRank: Readonly<Record<ObserverRole, number>> = {
  viewer: 0,
  operator: 1,
  maintenance: 2,
  engineer: 3,
  installer: 3,
  simulator: 3,
};

const intentRank: Readonly<Record<ObserverIntent, number>> = {
  overview: 0,
  monitor: 1,
  operate: 1,
  diagnose: 2,
  configure: 2,
  install: 3,
  simulate: 3,
};

const scaleRank: Readonly<Record<ObserverScale, number>> = {
  plant: 0,
  system: 1,
  equipment: 2,
  component: 3,
};

export const defaultObserverContext: Readonly<ObserverContext> = Object.freeze({
  role: 'engineer',
  intent: 'simulate',
  scale: 'component',
  fidelity: 'auto',
  capabilities: Object.freeze([]),
});

export const defaultRepresentations: readonly RepresentationDefinition[] = Object.freeze([
  Object.freeze({
    id: 'symbol',
    label: 'Symbol',
    fidelity: 'symbol',
    description: 'Identity, state and connection points for plant-wide overview.',
    preserves: Object.freeze(['identity', 'status', 'ports']),
  }),
  Object.freeze({
    id: 'operational',
    label: 'Operational',
    fidelity: 'operational',
    description: 'Operator-facing state, quality, primary values and controllable interfaces.',
    preserves: Object.freeze(['identity', 'status', 'quality', 'primary-values', 'ports']),
  }),
  Object.freeze({
    id: 'structural',
    label: 'Structural',
    fidelity: 'structural',
    description: 'Internal composition and serviceable interfaces for diagnostics and maintenance.',
    preserves: Object.freeze(['identity', 'status', 'quality', 'telemetry', 'composition', 'interfaces', 'ports']),
  }),
  Object.freeze({
    id: 'twin',
    label: 'Digital twin',
    fidelity: 'twin',
    description: 'Maximum available geometry, kinematics, telemetry and component structure.',
    preserves: Object.freeze(['identity', 'status', 'quality', 'telemetry', 'composition', 'interfaces', 'geometry', 'kinematics', 'ports']),
  }),
]);

function enumValue<const T extends readonly string[]>(
  value: string | null,
  values: T,
  fallback: T[number],
): T[number] {
  return value !== null && values.includes(value as T[number]) ? value as T[number] : fallback;
}

function inheritedAttribute(host: HTMLElement, source: Element | null, name: string): string | null {
  return host.getAttribute(name) ?? source?.getAttribute(name) ?? null;
}

function parseCapabilities(value: string | null): readonly string[] {
  if (value === null || value.trim() === '') return Object.freeze([]);
  return Object.freeze([...new Set(
    value.split(/[\s,]+/).map((entry) => entry.trim()).filter(Boolean),
  )].sort());
}

export function isObserverAttribute(name: string): name is (typeof observerAttributeNames)[number] {
  return (observerAttributeNames as readonly string[]).includes(name);
}

export function observerSourceFor(host: HTMLElement): Element | null {
  return host.parentElement?.closest(observerProviderSelector) ?? null;
}

export function readObserverContext(host: HTMLElement): Readonly<ObserverContext> {
  const source = observerSourceFor(host);
  return Object.freeze({
    role: enumValue(inheritedAttribute(host, source, 'observer-role'), roles, defaultObserverContext.role),
    intent: enumValue(inheritedAttribute(host, source, 'observer-intent'), intents, defaultObserverContext.intent),
    scale: enumValue(inheritedAttribute(host, source, 'observer-scale'), scales, defaultObserverContext.scale),
    fidelity: enumValue(
      inheritedAttribute(host, source, 'observer-fidelity'),
      ['auto', ...fidelities] as const,
      defaultObserverContext.fidelity,
    ) as ObserverFidelity,
    capabilities: parseCapabilities(inheritedAttribute(host, source, 'observer-capabilities')),
  });
}

export function observerSignature(observer: Readonly<ObserverContext>): string {
  return [
    observer.role,
    observer.intent,
    observer.scale,
    observer.fidelity,
    ...observer.capabilities,
  ].join(':');
}

export function representationDefinitions(
  definitions: readonly RepresentationDefinition[] | undefined,
): readonly RepresentationDefinition[] {
  const source = definitions === undefined || definitions.length === 0 ? defaultRepresentations : definitions;
  const ids = new Set<string>();
  const normalized = source.map((definition) => {
    if (!/^[a-z][a-z0-9-]*$/.test(definition.id)) {
      throw new TypeError(`Invalid representation id: ${definition.id}`);
    }
    if (ids.has(definition.id)) throw new TypeError(`Duplicate representation id: ${definition.id}`);
    ids.add(definition.id);
    return Object.freeze({
      ...definition,
      ...(definition.requires === undefined ? {} : { requires: Object.freeze([...definition.requires]) }),
      ...(definition.preserves === undefined ? {} : { preserves: Object.freeze([...definition.preserves]) }),
    });
  });
  return Object.freeze(normalized);
}

function targetFidelity(observer: Readonly<ObserverContext>): RepresentationFidelity {
  if (observer.fidelity !== 'auto') return observer.fidelity;
  const rank = Math.max(
    roleRank[observer.role],
    intentRank[observer.intent],
    scaleRank[observer.scale],
  );
  return fidelities[rank] ?? 'twin';
}

function isAvailable(
  representation: Readonly<RepresentationDefinition>,
  capabilities: readonly string[],
): boolean {
  return (representation.requires ?? []).every((capability) => capabilities.includes(capability));
}

export function selectRepresentation(
  definitions: readonly RepresentationDefinition[] | undefined,
  observer: Readonly<ObserverContext>,
  forcedId?: string | null,
): Readonly<RepresentationDefinition> {
  const all = representationDefinitions(definitions);
  const available = all.filter((representation) => isAvailable(representation, observer.capabilities));
  const candidates = available.length > 0 ? available : all;

  if (forcedId !== undefined && forcedId !== null) {
    const forced = candidates.find((representation) => representation.id === forcedId);
    if (forced) return forced;
  }

  const targetRank = fidelityRank[targetFidelity(observer)];
  const ordered = [...candidates].sort((left, right) => (
    fidelityRank[left.fidelity] - fidelityRank[right.fidelity]
  ));
  const notMoreDetailed = ordered.filter((representation) => fidelityRank[representation.fidelity] <= targetRank);
  return notMoreDetailed.at(-1) ?? ordered[0] ?? defaultRepresentations[0]!;
}

export const representationStyles = `
:host([data-representation-fidelity="symbol"]) [data-detail] { display: none !important; }
:host([data-representation-fidelity="operational"]) [data-detail="fine"] { display: none !important; }

:host([data-representation-fidelity="symbol"]) [data-min-fidelity="operational"],
:host([data-representation-fidelity="symbol"]) [data-min-fidelity="structural"],
:host([data-representation-fidelity="symbol"]) [data-min-fidelity="twin"],
:host([data-representation-fidelity="operational"]) [data-min-fidelity="structural"],
:host([data-representation-fidelity="operational"]) [data-min-fidelity="twin"],
:host([data-representation-fidelity="structural"]) [data-min-fidelity="twin"] {
  display: none !important;
}
`;
