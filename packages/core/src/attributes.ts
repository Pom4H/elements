import type { AttributeValueMap } from './types.js';

export type AttributeKind = 'string' | 'number' | 'boolean' | 'enum';

/**
 * The public API of an element, described well enough that an editor can build
 * a control for it without knowing which element it belongs to.
 */
export interface AttributeDefinition<T> {
  readonly attribute: string;
  readonly property: string;
  readonly kind: AttributeKind;
  readonly defaultValue: T;
  readonly parse: (value: string | null) => T;
  readonly serialize: (value: unknown) => string | null;
  /** Every accepted value, for enums. */
  readonly values?: readonly string[];
  readonly minimum?: number;
  readonly maximum?: number;
  readonly step?: number;
  /** Engineering unit shown beside a numeric control. */
  readonly unit?: string;
  readonly cssVariable?: `--${string}`;
  readonly description?: string;
}

export type AttributeDefinitions<T extends AttributeValueMap> = {
  readonly [K in keyof T]: AttributeDefinition<T[K]>;
};

interface BaseAttributeOptions<T> {
  readonly attribute?: string;
  readonly defaultValue?: T;
  readonly cssVariable?: `--${string}`;
  readonly description?: string;
}

interface NumberAttributeOptions extends BaseAttributeOptions<number> {
  readonly minimum?: number;
  readonly maximum?: number;
  readonly step?: number;
  readonly unit?: string;
}

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
}

function propertyName(attribute: string): string {
  return attribute.replace(/-([a-z])/g, (_, character: string) => character.toUpperCase());
}

function optional<T>(key: string, value: T | undefined): Record<string, T> {
  return value === undefined ? {} : { [key]: value };
}

function createDefinition<T>(
  property: string,
  kind: AttributeKind,
  options: BaseAttributeOptions<T>,
  defaultValue: T,
  parse: (value: string | null) => T,
  serialize: (value: T) => string | null,
  extra: Record<string, unknown> = {},
): AttributeDefinition<T> {
  const attribute = options.attribute ?? toKebabCase(property);
  return {
    attribute,
    property,
    kind,
    defaultValue: options.defaultValue ?? defaultValue,
    parse,
    serialize: (value: unknown) => serialize(value as T),
    ...extra,
    ...optional('cssVariable', options.cssVariable),
    ...optional('description', options.description),
  };
}

export const attribute = {
  string(property: string, options: BaseAttributeOptions<string> = {}): AttributeDefinition<string> {
    return createDefinition(property, 'string', options, '', (value) => value ?? options.defaultValue ?? '', (value) => value);
  },

  number(property: string, options: NumberAttributeOptions = {}): AttributeDefinition<number> {
    return createDefinition(
      property,
      'number',
      options,
      0,
      (value) => {
        if (value === null || value.trim() === '') return options.defaultValue ?? 0;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : options.defaultValue ?? 0;
      },
      (value) => (Number.isFinite(value) ? String(value) : null),
      {
        ...optional('minimum', options.minimum),
        ...optional('maximum', options.maximum),
        ...optional('step', options.step),
        ...optional('unit', options.unit),
      },
    );
  },

  boolean(property: string, options: BaseAttributeOptions<boolean> = {}): AttributeDefinition<boolean> {
    return createDefinition(property, 'boolean', options, false, (value) => value !== null, (value) => (value ? '' : null));
  },

  enum<const TValues extends readonly string[]>(
    property: string,
    values: TValues,
    options: BaseAttributeOptions<TValues[number]> & { readonly defaultValue: TValues[number] },
  ): AttributeDefinition<TValues[number]> {
    const allowed = new Set<string>(values);
    return createDefinition(
      property,
      'enum',
      options,
      options.defaultValue,
      (value) => (value !== null && allowed.has(value) ? value : options.defaultValue),
      (value) => value,
      { values: [...values] },
    );
  },
};

export function readAttributes<T extends AttributeValueMap>(
  host: HTMLElement,
  definitions: AttributeDefinitions<T>,
): T {
  const values: Record<string, unknown> = {};
  for (const [key, definition] of Object.entries(definitions)) {
    values[key] = definition.parse(host.getAttribute(definition.attribute));
  }
  return values as T;
}

export function observedAttributeNames<T extends AttributeValueMap>(definitions: AttributeDefinitions<T>): string[] {
  return Object.values(definitions as Record<string, AttributeDefinition<unknown>>).map((definition) => definition.attribute);
}

export function definitionForAttribute<T extends AttributeValueMap>(
  definitions: AttributeDefinitions<T>,
  attributeName: string,
): AttributeDefinition<unknown> | undefined {
  return Object.values(definitions as Record<string, AttributeDefinition<unknown>>).find(
    (definition) => definition.attribute === attributeName,
  );
}

export function installAttributeProperties<T extends AttributeValueMap>(
  prototype: object,
  definitions: AttributeDefinitions<T>,
): void {
  for (const definition of Object.values(definitions as Record<string, AttributeDefinition<unknown>>)) {
    if (Object.prototype.hasOwnProperty.call(prototype, definition.property)) continue;
    Object.defineProperty(prototype, definition.property, {
      configurable: true,
      enumerable: true,
      get(this: HTMLElement) {
        return definition.parse(this.getAttribute(definition.attribute));
      },
      set(this: HTMLElement, value: unknown) {
        const serialized = definition.serialize(value);
        if (serialized === null) this.removeAttribute(definition.attribute);
        else this.setAttribute(definition.attribute, serialized);
      },
    });
  }
}

export function propertyForAttribute(attributeName: string): string {
  return propertyName(attributeName);
}
