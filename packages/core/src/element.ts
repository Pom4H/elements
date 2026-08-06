import {
  definitionForAttribute,
  installAttributeProperties,
  observedAttributeNames,
  readAttributes,
} from './attributes.js';
import { applyBindings } from './bindings.js';
import { CollectionController } from './composition/index.js';
import { initialViewBox, resolveViewBox, type ElementDefinition } from './definition.js';
import { MotionController } from './motion/index.js';
import {
  defaultObserverContext,
  defaultRepresentations,
  isObserverAttribute,
  observerAttributeNames,
  observerSignature,
  observerSourceFor,
  readObserverContext,
  representationOverrideAttribute,
  representationStyles,
  selectRepresentation,
} from './observer.js';
import { PartMap } from './parts.js';
import { createStyleSheet, instantiateSvg } from './template.js';
import type {
  ElementContext,
  ObserverContext,
  RepresentationDefinition,
  StateValueMap,
} from './types.js';

type StateInternals = ElementInternals & {
  readonly states?: CustomStateSet;
};

function aspectRatioFor(viewBox: string): string {
  const values = viewBox.trim().split(/[\s,]+/).map(Number);
  return `${values[2] ?? 1} / ${values[3] ?? 1}`;
}

function protocolStyleSheet(): HTMLStyleElement {
  const style = document.createElement('style');
  style.dataset.elementsProtocol = 'observer-v1';
  style.textContent = representationStyles;
  return style;
}

export abstract class ElementsElement extends HTMLElement {
  static readonly definition: ElementDefinition;

  static get observedAttributes(): string[] {
    return [...new Set([
      ...observedAttributeNames(this.definition.attributes),
      ...observerAttributeNames,
      representationOverrideAttribute,
    ])];
  }

  readonly #definition: ElementDefinition;
  readonly #internals: StateInternals | undefined;
  readonly #svg: SVGSVGElement;
  readonly #parts: PartMap;
  readonly #collections: CollectionController;
  readonly #motions: MotionController;
  readonly #changed = new Set<string>();
  readonly #observerMutation = new MutationObserver(() => {
    this.#connectObserverSource();
    this.#schedule('observer');
  });
  #observerSource: Element | null = null;
  #attributes: Record<string, unknown> = {};
  #states: StateValueMap = {};
  #observer: Readonly<ObserverContext> = defaultObserverContext;
  #representation: Readonly<RepresentationDefinition> = defaultRepresentations[3]!;
  #scheduled = false;
  #connected = false;

  protected constructor() {
    super();
    const constructor = this.constructor as typeof ElementsElement;
    this.#definition = constructor.definition;
    this.#representation = selectRepresentation(this.#definition.representations, this.#observer);
    this.#internals = typeof this.attachInternals === 'function' ? (this.attachInternals() as StateInternals) : undefined;

    const shadow = this.attachShadow({ mode: 'open' });
    const initial = initialViewBox(this.#definition.viewBox);
    this.#svg = instantiateSvg(this.#definition.template, initial);
    this.style.setProperty('--elements-aspect-ratio', aspectRatioFor(initial));
    shadow.append(this.#svg);

    if (this.#definition.styles) {
      const style = createStyleSheet(this.#definition.styles);
      if (style instanceof CSSStyleSheet && 'adoptedStyleSheets' in shadow) {
        shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, style];
      } else {
        shadow.prepend(style as HTMLStyleElement);
      }
    }
    shadow.append(protocolStyleSheet());

    this.#parts = new PartMap(this.#svg, this.#definition.parts ?? []);
    this.#collections = new CollectionController(this.#svg, this.#definition.collections ?? []);
    this.#motions = new MotionController(this, this.#definition.motions ?? []);
  }

  get svgRoot(): SVGSVGElement {
    return this.#svg;
  }

  get parts(): PartMap {
    return this.#parts;
  }

  get observerContext(): Readonly<ObserverContext> {
    return this.#observer;
  }

  get activeRepresentation(): Readonly<RepresentationDefinition> {
    return this.#representation;
  }

  get context(): ElementContext {
    return {
      host: this,
      attributes: this.#attributes,
      states: this.#states,
      observer: this.#observer,
      representation: this.#representation,
    };
  }

  get activeMotions() {
    return this.#motions.statuses();
  }

  connectedCallback(): void {
    this.#connected = true;
    this.#upgradeProperties();
    this.#connectObserverSource();
    this.#motions.connect();
    this.#schedule('*');
  }

  disconnectedCallback(): void {
    this.#connected = false;
    this.#observerMutation.disconnect();
    this.#observerSource = null;
    this.#motions.disconnect();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;
    if (isObserverAttribute(name) || name === representationOverrideAttribute) {
      this.#schedule('observer');
      return;
    }
    const definition = definitionForAttribute(this.#definition.attributes, name);
    this.#schedule(definition?.property ?? name);
  }

  refresh(): void {
    this.#connectObserverSource();
    this.#schedule('*');
  }

  #connectObserverSource(): void {
    const source = observerSourceFor(this);
    if (source === this.#observerSource) return;
    this.#observerMutation.disconnect();
    this.#observerSource = source;
    if (source) {
      this.#observerMutation.observe(source, {
        attributes: true,
        attributeFilter: [...observerAttributeNames],
      });
    }
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

    const previousObserverSignature = observerSignature(this.#observer);
    const previousRepresentation = this.#representation;
    const nextObserver = readObserverContext(this);
    const nextRepresentation = selectRepresentation(
      this.#definition.representations,
      nextObserver,
      this.getAttribute(representationOverrideAttribute),
    );
    const observerChanged = observerSignature(nextObserver) !== previousObserverSignature;
    const representationChanged = nextRepresentation.id !== previousRepresentation.id;
    if (observerChanged) this.#changed.add('observer');
    if (representationChanged) this.#changed.add('representation');
    this.#observer = nextObserver;
    this.#representation = nextRepresentation;

    const previousStates = this.#states;
    this.#attributes = readAttributes(this, this.#definition.attributes);
    const provisional: ElementContext = {
      host: this,
      attributes: this.#attributes,
      states: previousStates,
      observer: this.#observer,
      representation: this.#representation,
    };
    const nextStates: StateValueMap = {};
    for (const [name, derive] of Object.entries(this.#definition.states ?? {})) {
      nextStates[name] = Boolean(derive(provisional));
      if (nextStates[name] !== previousStates[name]) this.#changed.add(name);
    }
    this.#states = nextStates;

    this.#reflectAttributesToCss();
    this.#reflectStates();
    this.#reflectObserver();

    const context = this.context;
    this.#updateViewport(context);
    const structureChanged = this.#collections.reconcile(context);
    if (structureChanged) this.#parts.refresh();

    applyBindings(this.#definition.bindings ?? [], context, this.#parts, this.#changed);
    this.#motions.reconcile(context, this.#parts);

    const changed = [...this.#changed];
    this.#changed.clear();
    const detail = {
      changed,
      attributes: this.#attributes,
      states: this.#states,
      observer: this.#observer,
      representation: this.#representation,
    };
    this.dispatchEvent(new CustomEvent('elements-update', {
      bubbles: true,
      composed: true,
      detail,
    }));
    if (representationChanged) {
      this.dispatchEvent(new CustomEvent('elements-representation-change', {
        bubbles: true,
        composed: true,
        detail: {
          previous: previousRepresentation,
          current: this.#representation,
          observer: this.#observer,
        },
      }));
    }
  }

  #reflectObserver(): void {
    this.dataset.representation = this.#representation.id;
    this.dataset.representationFidelity = this.#representation.fidelity;
    this.dataset.observerRole = this.#observer.role;
    this.dataset.observerIntent = this.#observer.intent;
    this.dataset.observerScale = this.#observer.scale;
  }

  #updateViewport(context: ElementContext): void {
    const next = resolveViewBox(this.#definition.viewBox, context);
    if (this.#svg.getAttribute('viewBox') === next) return;
    this.#svg.setAttribute('viewBox', next);
    this.style.setProperty('--elements-aspect-ratio', aspectRatioFor(next));
    this.#changed.add('viewBox');
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
