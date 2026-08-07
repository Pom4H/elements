export type PartTarget = string | { readonly part: string; readonly instance?: string };

export class PartMap {
  readonly #root: ParentNode;
  readonly #parts = new Map<string, SVGElement[]>();

  constructor(root: ParentNode) {
    this.#root = root;
    this.refresh();
  }

  refresh(): void {
    this.#parts.clear();
    for (const element of this.#root.querySelectorAll<SVGElement>('[data-part]')) {
      const name = element.dataset.part;
      if (!name) continue;
      // Semantic runtime parts are also native CSS shadow parts. This keeps the
      // registry/binding vocabulary and the theming vocabulary identical while
      // letting applications skin an element without reaching into shadowRoot.
      element.setAttribute('part', name);
      const list = this.#parts.get(name);
      if (list) list.push(element);
      else this.#parts.set(name, [element]);
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
