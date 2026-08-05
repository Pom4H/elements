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

export interface DynamicPorts {
  readonly initial: readonly PortDefinition[];
  readonly read: (context: ElementContext) => readonly PortDefinition[];
}

export type PortsDefinition = readonly PortDefinition[] | DynamicPorts;

function validatePorts(list: readonly PortDefinition[]): readonly PortDefinition[] {
  const seen = new Set<string>();
  for (const port of list) {
    if (port.id === '') throw new TypeError('Port identifiers must not be empty.');
    if (seen.has(port.id)) throw new TypeError(`Duplicate port identifier: ${port.id}`);
    seen.add(port.id);
    if (!Number.isFinite(port.x) || !Number.isFinite(port.y)) {
      throw new TypeError(`Port ${port.id} must have finite coordinates.`);
    }
  }
  return list;
}

function isDynamicPorts(definition: PortsDefinition): definition is DynamicPorts {
  return !Array.isArray(definition);
}

export function initialPorts(definition: PortsDefinition | undefined): readonly PortDefinition[] {
  if (definition === undefined) return [];
  return validatePorts(isDynamicPorts(definition) ? definition.initial : definition);
}

export function resolvePorts(
  definition: PortsDefinition | undefined,
  context: ElementContext,
): readonly PortDefinition[] {
  if (definition === undefined) return [];
  return validatePorts(isDynamicPorts(definition) ? definition.read(context) : definition);
}

export function ports(
  initial: readonly PortDefinition[],
  read: DynamicPorts['read'],
): DynamicPorts {
  validatePorts(initial);
  return Object.freeze({ initial, read });
}

export function portSignature(list: readonly PortDefinition[]): string {
  return list
    .map((port) => `${port.id}@${port.x},${port.y},${port.direction},${port.kind ?? ''},${port.role ?? ''},${port.medium ?? ''}`)
    .join('|');
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
  readonly ports?: PortsDefinition;
  readonly parts?: readonly CssPartDefinition[];
}

export function defineElementDefinition(definition: ElementDefinition): ElementDefinition {
  initialViewBox(definition.viewBox);
  initialPorts(definition.ports);
  return Object.freeze(definition);
}
