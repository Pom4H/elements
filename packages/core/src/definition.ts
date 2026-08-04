import type { AttributeDefinition } from './attributes.js';
import type { BindingDefinition } from './bindings.js';
import type { CollectionDefinition } from './composition/index.js';
import type { MotionDefinition } from './motion/index.js';
import type { CssPartDefinition, ElementContext, ElementTagName, PortDefinition } from './types.js';
import type { SvgTemplate } from './template.js';

export interface ElementDefinition {
  readonly tagName: ElementTagName;
  readonly displayName: string;
  readonly description?: string;
  readonly viewBox: string;
  readonly template: SvgTemplate;
  readonly styles?: string;
  readonly attributes: Readonly<Record<string, AttributeDefinition<unknown>>>;
  readonly states?: Readonly<Record<string, (context: ElementContext) => boolean>>;
  readonly bindings?: readonly BindingDefinition[];
  readonly collections?: readonly CollectionDefinition[];
  readonly motions?: readonly MotionDefinition[];
  readonly ports?: readonly PortDefinition[];
  readonly parts?: readonly CssPartDefinition[];
}

export function defineElementDefinition(definition: ElementDefinition): ElementDefinition {
  return Object.freeze(definition);
}
