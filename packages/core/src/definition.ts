import type { AttributeDefinition } from './attributes.js';
import type { BindingDefinition } from './bindings.js';
import type { CollectionDefinition } from './composition/index.js';
import type { MotionDefinition } from './motion/index.js';
import type { CssPartDefinition, ElementContext, ElementTagName, PortDefinition } from './types.js';
import type { SvgTemplate } from './template.js';

export interface DynamicViewBox {
  readonly initial: string;
  readonly read: (context: ElementContext) => string;
}

export type ViewBoxDefinition = string | DynamicViewBox;

function parseViewBox(value: string): readonly [number, number, number, number] {
  const values = value.trim().split(/[\s,]+/).map(Number);
  if (
    values.length !== 4
    || values.some((entry) => !Number.isFinite(entry))
    || values[2] === undefined
    || values[3] === undefined
    || values[2] <= 0
    || values[3] <= 0
  ) {
    throw new TypeError(`Invalid SVG viewBox: ${value}`);
  }
  return values as unknown as readonly [number, number, number, number];
}

export function initialViewBox(definition: ViewBoxDefinition): string {
  const value = typeof definition === 'string' ? definition : definition.initial;
  parseViewBox(value);
  return value;
}

export function resolveViewBox(definition: ViewBoxDefinition, context: ElementContext): string {
  const value = typeof definition === 'string' ? definition : definition.read(context);
  parseViewBox(value);
  return value;
}

export function viewBox(
  initial: string,
  read: DynamicViewBox['read'],
): DynamicViewBox {
  parseViewBox(initial);
  return Object.freeze({ initial, read });
}

export interface ElementDefinition {
  readonly tagName: ElementTagName;
  readonly displayName: string;
  readonly description?: string;
  readonly viewBox: ViewBoxDefinition;
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
  initialViewBox(definition.viewBox);
  return Object.freeze(definition);
}
