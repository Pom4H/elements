import type { ElementDefinition } from './definition.js';

/**
 * Every definition registered in this realm, so tooling can ask what else
 * exists without being handed a list.
 *
 * A workspace can reach the same build through more than one path — package
 * entry points, symlinked `node_modules` — and end up with two copies of this
 * module. The registry therefore lives on a shared symbol rather than in module
 * scope, so every copy sees the same elements.
 */
const REGISTRY_KEY = Symbol.for('@pom4h/elements:definitions');

function definitionRegistry(): Map<string, ElementDefinition> {
  const host = globalThis as unknown as { [key: symbol]: unknown };
  const existing = host[REGISTRY_KEY];
  if (existing instanceof Map) return existing as Map<string, ElementDefinition>;
  const created = new Map<string, ElementDefinition>();
  host[REGISTRY_KEY] = created;
  return created;
}

export function rememberDefinition(definition: ElementDefinition): void {
  definitionRegistry().set(definition.tagName, definition);
}

export function elementDefinition(tagName: string): ElementDefinition | undefined {
  return definitionRegistry().get(tagName);
}

export function elementDefinitions(): readonly ElementDefinition[] {
  return [...definitionRegistry().values()];
}
