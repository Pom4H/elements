import type { ElementContext } from '../types.js';
import type { FragmentPlacement } from './fragment.js';
import { instantiateFragment, updateFragmentPlacement } from './fragment.js';

export interface CollectionDefinition {
  readonly mount: string;
  readonly items: (context: ElementContext) => readonly FragmentPlacement[];
}

export class CollectionController {
  readonly #root: ParentNode;
  readonly #definitions: readonly CollectionDefinition[];
  #signature = '';

  constructor(root: ParentNode, definitions: readonly CollectionDefinition[]) {
    this.#root = root;
    this.#definitions = definitions;
  }

  reconcile(context: ElementContext): boolean {
    let structureChanged = false;
    const signatures: string[] = [];

    for (const definition of this.#definitions) {
      const mount = this.#root.querySelector<SVGGElement>(`[data-mount="${CSS.escape(definition.mount)}"]`);
      if (!mount) throw new Error(`Missing SVG mount point: ${definition.mount}`);

      const placements = definition.items(context);
      const existing = new Map<string, SVGGElement>();
      for (const child of mount.querySelectorAll<SVGGElement>(':scope > [data-instance]')) {
        const key = child.dataset.instance;
        if (key) existing.set(key, child);
      }

      const expectedKeys = new Set<string>();
      for (const placement of placements) {
        if (expectedKeys.has(placement.key)) throw new Error(`Duplicate fragment key: ${placement.key}`);
        expectedKeys.add(placement.key);
        signatures.push(`${definition.mount}:${placement.key}:${placement.fragment.name}`);

        let instance = existing.get(placement.key);
        if (instance?.dataset.fragment !== placement.fragment.name) {
          instance?.remove();
          instance = undefined;
        }
        if (!instance) {
          instance = instantiateFragment(placement);
          structureChanged = true;
        } else {
          updateFragmentPlacement(instance, placement);
        }

        // Fragment keys are already the stable identity used for reconciliation.
        // Exporting that same identity as a shadow part gives applications a
        // theming hook for a whole composed module without exposing its SVG
        // implementation classes or reaching into shadowRoot.
        instance.setAttribute('part', `fragment-${placement.key}`);
        mount.append(instance);
      }

      for (const [key, child] of existing) {
        if (!expectedKeys.has(key)) {
          child.remove();
          structureChanged = true;
        }
      }
    }

    const signature = signatures.join('|');
    if (signature !== this.#signature) {
      structureChanged = true;
      this.#signature = signature;
    }
    return structureChanged;
  }
}
