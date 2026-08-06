import type { AttributeKind } from './attributes.js';
import { initialPorts, initialViewBox, type ElementDefinition } from './definition.js';
import type { PortDefinition } from './types.js';

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

export function createManifestEntry(definition: ElementDefinition): ElementsManifestEntry {
  return {
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
}
