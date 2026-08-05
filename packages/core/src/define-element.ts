import type { ElementDefinition } from './definition.js';
import { ElementsElement, installElementDefinition } from './element.js';

export type ElementsElementConstructor = typeof ElementsElement & { new (): ElementsElement };

export function createElementClass(definition: ElementDefinition): ElementsElementConstructor {
  class DefinedElementsElement extends ElementsElement {
    constructor() {
      super();
    }
  }
  installElementDefinition(DefinedElementsElement, definition);
  return DefinedElementsElement;
}

export function registerElement(definition: ElementDefinition): ElementsElementConstructor {
  const existing = customElements.get(definition.tagName);
  if (existing) return existing as ElementsElementConstructor;
  const elementClass = createElementClass(definition);
  customElements.define(definition.tagName, elementClass);
  return elementClass;
}
