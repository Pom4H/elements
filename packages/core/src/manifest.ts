import { initialViewBox, type ElementDefinition } from './definition.js';

export interface ElementsManifestEntry {
  readonly tagName: string;
  readonly name: string;
  readonly description?: string;
  readonly viewBox: string;
  readonly dynamicViewBox: boolean;
  readonly attributes: readonly {
    readonly name: string;
    readonly property: string;
    readonly default: unknown;
    readonly description?: string;
  }[];
  readonly states: readonly string[];
  readonly parts: NonNullable<ElementDefinition['parts']>;
  readonly ports: NonNullable<ElementDefinition['ports']>;
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
      default: attribute.defaultValue,
      ...(attribute.description === undefined ? {} : { description: attribute.description }),
    })),
    states: Object.keys(definition.states ?? {}),
    parts: definition.parts ?? [],
    ports: definition.ports ?? [],
    motions: (definition.motions ?? []).map((motion) => ({ id: motion.id, type: motion.type, target: motion.target })),
    composition: (definition.collections ?? []).map((collection) => collection.mount),
  };
}
