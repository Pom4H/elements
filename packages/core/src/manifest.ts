import type { AttributeKind } from './attributes.js';
import { initialPorts, initialViewBox, type ElementDefinition } from './definition.js';
import type { PortDefinition } from './types.js';

export const ELEMENTS_MANIFEST_SCHEMA_VERSION = 1 as const;

export interface ElementsManifestEntry {
  readonly tagName: string;
  readonly name: string;
  readonly description?: string;
  readonly viewBox: string;
  readonly dynamicViewBox: boolean;
  readonly attributes: readonly {
    readonly name: string;
    readonly property: string;
    readonly kind: AttributeKind;
    readonly default: unknown;
    readonly values?: readonly string[];
    readonly minimum?: number;
    readonly maximum?: number;
    readonly step?: number;
    readonly unit?: string;
    readonly description?: string;
  }[];
  readonly states: readonly string[];
  readonly parts: NonNullable<ElementDefinition['parts']>;
  readonly ports: readonly PortDefinition[];
  readonly dynamicPorts: boolean;
  readonly motions: readonly { readonly id: string; readonly type: string; readonly target: unknown }[];
  readonly composition: readonly string[];
}

export interface ElementsManifest {
  readonly schemaVersion: typeof ELEMENTS_MANIFEST_SCHEMA_VERSION;
  readonly name: string;
  readonly version: string;
  readonly elements: readonly ElementsManifestEntry[];
}

function assertUnique(values: readonly string[], description: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${description}: ${value}`);
    seen.add(value);
  }
}

function validateEntry(entry: ElementsManifestEntry): void {
  if (!/^[a-z][a-z0-9.-]*-[a-z0-9.-]+$/.test(entry.tagName)) {
    throw new Error(`Invalid custom element tag name in manifest: ${entry.tagName}`);
  }
  assertUnique(entry.attributes.map((attribute) => attribute.name), `${entry.tagName} attribute`);
  assertUnique(entry.attributes.map((attribute) => attribute.property), `${entry.tagName} property`);
  assertUnique(entry.states, `${entry.tagName} state`);
  assertUnique(entry.parts.map((part) => part.name), `${entry.tagName} part`);
  assertUnique(entry.ports.map((port) => port.id), `${entry.tagName} port`);
  assertUnique(entry.motions.map((motion) => motion.id), `${entry.tagName} motion`);
  assertUnique(entry.composition, `${entry.tagName} composition mount`);
}

export function createManifestEntry(definition: ElementDefinition): ElementsManifestEntry {
  const entry: ElementsManifestEntry = {
    tagName: definition.tagName,
    name: definition.displayName,
    ...(definition.description === undefined ? {} : { description: definition.description }),
    viewBox: initialViewBox(definition.viewBox),
    dynamicViewBox: typeof definition.viewBox !== 'string',
    attributes: Object.values(definition.attributes).map((attribute) => ({
      name: attribute.attribute,
      property: attribute.property,
      kind: attribute.kind,
      default: attribute.defaultValue,
      ...(attribute.values === undefined ? {} : { values: attribute.values }),
      ...(attribute.minimum === undefined ? {} : { minimum: attribute.minimum }),
      ...(attribute.maximum === undefined ? {} : { maximum: attribute.maximum }),
      ...(attribute.step === undefined ? {} : { step: attribute.step }),
      ...(attribute.unit === undefined ? {} : { unit: attribute.unit }),
      ...(attribute.description === undefined ? {} : { description: attribute.description }),
    })),
    states: Object.keys(definition.states ?? {}),
    parts: definition.parts ?? [],
    ports: initialPorts(definition.ports),
    dynamicPorts: definition.ports !== undefined && !Array.isArray(definition.ports),
    motions: (definition.motions ?? []).map((motion) => ({ id: motion.id, type: motion.type, target: motion.target })),
    composition: (definition.collections ?? []).map((collection) => collection.mount),
  };
  validateEntry(entry);
  return entry;
}

export function createElementsManifest(input: {
  readonly name: string;
  readonly version: string;
  readonly elements: readonly ElementsManifestEntry[];
}): ElementsManifest {
  if (!input.name.trim()) throw new Error('Elements manifest package name must not be empty.');
  if (!input.version.trim()) throw new Error('Elements manifest package version must not be empty.');
  assertUnique(input.elements.map((entry) => entry.tagName), 'manifest tag name');
  for (const entry of input.elements) validateEntry(entry);
  return Object.freeze({
    schemaVersion: ELEMENTS_MANIFEST_SCHEMA_VERSION,
    name: input.name,
    version: input.version,
    elements: Object.freeze([...input.elements]),
  });
}
