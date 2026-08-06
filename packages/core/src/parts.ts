import type { CssPartDefinition } from './types.js';

export type PartTarget = string | { readonly part: string; readonly instance?: string };

export class PartMap {
  readonly #root: ParentNode;
  readonly #definitions: readonly CssPartDefinition[];
  readonly #parts = new Map<string, SVGElement[]>();

  constructor(root: ParentNode, definitions: readonly CssPartDefinition[] = []) {
    this.#root = root;
    this.#definitions = definitions;
    this.refresh();
  }

  refresh(): void {
    this.#parts.clear();
    for (const element of this.#root.querySelectorAll<SVGElement>('[data-part]')) {
      const name = element.dataset.part;
      if (!name) continue;
      const list = this.#parts.get(name);
      if (list) list.push(element);
      else this.#parts.set(name, [element]);
    }
    this.#applyProtocolMetadata();
  }

  #applyProtocolMetadata(): void {
    for (const definition of this.#definitions) {
      if (definition.minimumFidelity === undefined) continue;
      for (const element of this.#parts.get(definition.name) ?? []) {
        element.dataset.minFidelity = definition.minimumFidelity;
      }
    }
  }

  get(target: PartTarget): readonly SVGElement[] {
    const part = typeof target === 'string' ? target : target.part;
    const elements = this.#parts.get(part) ?? [];
    if (typeof target === 'string' || target.instance === undefined) return elements;
    return elements.filter((element) => element.closest<SVGElement>('[data-instance]')?.dataset.instance === target.instance);
  }

  first(target: PartTarget): SVGElement | undefined {
    return this.get(target)[0];
  }

  names(): readonly string[] {
    return [...this.#parts.keys()];
  }
}
