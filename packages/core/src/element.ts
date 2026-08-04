import {
  definitionForAttribute,
  installAttributeProperties,
  observedAttributeNames,
  readAttributes,
} from './attributes.js';
import { applyBindings } from './bindings.js';
import { CollectionController } from './composition/index.js';
import type { ElementDefinition } from './definition.js';
import { MotionController } from './motion/index.js';
import { PartMap } from './parts.js';
import { createStyleSheet, instantiateSvg } from './template.js';
import type { ElementContext, StateValueMap } from './types.js';

type StateInternals = ElementInternals & {
  readonly states?: CustomStateSet;
};

export abstract class ElementsElement extends HTMLElement {
  static readonly definition: ElementDefinition;

  static get observedAttributes(): string[] {
    return observedAttributeNames(this.definition.attributes);
  }

  readonly #definition: ElementDefinition;
  readonly #internals: StateInternals | undefined;
  readonly #svg: SVGSVGElement;
  readonly #parts: PartMap;
  readonly #collections: CollectionController;
  readonly #motions: MotionController;
  readonly #changed = new Set<string>();
  #attributes: Record<string, unknown> = {};
  #states: StateValueMap = {};
  #scheduled = false;
  #connected = false;

  protected constructor() {
    super();
    const constructor = this.constructor as typeof ElementsElement;
    this.#definition = constructor.definition;
    this.#internals = typeof this.attachInternals === 'function' ? (this.attachInternals() as StateInternals) : undefined;

    const shadow = this.attachShadow({ mode: 'open' });
    this.#svg = instantiateSvg(this.#definition.template, this.#definition.viewBox);
    shadow.append(this.#svg);

    if (this.#definition.styles) {
      const style = createStyleSheet(this.#definition.styles);
      if (style instanceof CSSStyleSheet && 'adoptedStyleSheets' in shadow) {
        shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, style];
      } else {
        shadow.prepend(style as HTMLStyleElement);
      }
    }

    this.#parts = new PartMap(this.#svg);
    this.#collections = new CollectionController(this.#svg, this.#definition.collections ?? []);
    this.#motions = new MotionController(this, this.#definition.motions ?? []);
  }

  get svgRoot(): SVGSVGElement {
    return this.#svg;
  }

  get parts(): PartMap {
    return this.#parts;
  }

  get context(): ElementContext {
    return { host: this, attributes: this.#attributes, states: this.#states };
  }

  get activeMotions() {
    return this.#motions.statuses();
  }

  connectedCallback(): void {
    this.#connected = true;
    this.#upgradeProperties();
    this.#motions.connect();
    this.#schedule('*');
  }

  disconnectedCallback(): void {
    this.#connected = false;
    this.#motions.disconnect();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;
    const definition = definitionForAttribute(this.#definition.attributes, name);
    this.#schedule(definition?.property ?? name);
  }

  refresh(): void {
    this.#schedule('*');
  }

  #upgradeProperties(): void {
    for (const definition of Object.values(this.#definition.attributes)) {
      const property = definition.property;
      if (!Object.prototype.hasOwnProperty.call(this, property)) continue;
      const value = (this as unknown as Record<string, unknown>)[property];
      delete (this as unknown as Record<string, unknown>)[property];
      (this as unknown as Record<string, unknown>)[property] = value;
    }
  }

  #schedule(name: string): void {
    this.#changed.add(name);
    if (this.#scheduled) return;
    this.#scheduled = true;
    queueMicrotask(() => this.#update());
  }

  #update(): void {
    this.#scheduled = false;
    if (!this.#connected) return;

    const previousStates = this.#states;
    this.#attributes = readAttributes(this, this.#definition.attributes);
    const provisional: ElementContext = { host: this, attributes: this.#attributes, states: previousStates };
    const nextStates: StateValueMap = {};
    for (const [name, derive] of Object.entries(this.#definition.states ?? {})) {
      nextStates[name] = Boolean(derive(provisional));
      if (nextStates[name] !== previousStates[name]) this.#changed.add(name);
    }
    this.#states = nextStates;

    this.#reflectAttributesToCss();
    this.#reflectStates();

    const context = this.context;
    const structureChanged = this.#collections.reconcile(context);
    if (structureChanged) this.#parts.refresh();

    applyBindings(this.#definition.bindings ?? [], context, this.#parts, this.#changed);
    this.#motions.reconcile(context, this.#parts);

    const changed = [...this.#changed];
    this.#changed.clear();
    this.dispatchEvent(new CustomEvent('elements-update', {
      bubbles: true,
      composed: true,
      detail: { changed, attributes: this.#attributes, states: this.#states },
    }));
  }

  #reflectAttributesToCss(): void {
    for (const [property, definition] of Object.entries(this.#definition.attributes)) {
      if (definition.cssVariable === undefined) continue;
      const value = this.#attributes[property];
      if (value === null || value === undefined || value === false) this.style.removeProperty(definition.cssVariable);
      else this.style.setProperty(definition.cssVariable, String(value));
    }
  }

  #reflectStates(): void {
    const names = Object.entries(this.#states)
      .filter(([, active]) => active)
      .map(([name]) => name)
      .sort();
    if (names.length === 0) this.removeAttribute('data-state');
    else this.setAttribute('data-state', names.join(' '));

    const customStates = this.#internals?.states;
    if (!customStates) return;
    for (const name of Object.keys(this.#definition.states ?? {})) {
      if (this.#states[name]) customStates.add(name);
      else customStates.delete(name);
    }
  }
}

export function installElementDefinition(
  elementClass: typeof ElementsElement,
  definition: ElementDefinition,
): void {
  Object.defineProperty(elementClass, 'definition', { value: definition });
  installAttributeProperties(elementClass.prototype, definition.attributes);
}
