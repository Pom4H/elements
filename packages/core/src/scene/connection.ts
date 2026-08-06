import {
  parseEndpointReference,
  parseEndpointSpecs,
  parseTapReference,
  readConnectionDiameter,
  readConnectionKind,
  readConnectionSpeed,
  readFlowDirection,
  readMedium,
  type ConnectionKind,
  type EndpointReference,
  type EndpointSpec,
  type FlowDirection,
  type MediumId,
  type TapReference,
} from './model.js';

export const connectionAttributes = [
  'from',
  'to',
  'kind',
  'active',
  'flowing',
  'speed',
  'direction',
  'diameter',
  'medium',
  'insulated',
  'status',
  'quality',
  'label',
] as const;

/**
 * Declarative endpoint pair. The element itself never renders: the owning
 * scene reads these accessors, routes the path and owns the flow animation.
 */
export class ElementsConnectionElement extends HTMLElement {
  /** Tag-level default so `<el-pipe>` needs no `kind` attribute. */
  static readonly defaultKind: ConnectionKind = 'pipe';

  static get observedAttributes(): string[] {
    return [...connectionAttributes];
  }

  get connectionKind(): ConnectionKind {
    const declared = this.getAttribute('kind');
    if (declared === null) return (this.constructor as typeof ElementsConnectionElement).defaultKind;
    return readConnectionKind(declared);
  }

  /** The equipment port this run starts at, when it does not tap another run. */
  get source(): EndpointReference | undefined {
    return parseEndpointReference(this.getAttribute('from'));
  }

  /** The run this one branches off, when `from` names a connection instead of a port. */
  get tap(): TapReference | undefined {
    return parseTapReference(this.getAttribute('from'));
  }

  /** Every endpoint this run feeds. More than one turns the run into a tee. */
  get targets(): readonly EndpointSpec[] {
    return parseEndpointSpecs(this.getAttribute('to'));
  }

  /** `active` and `flowing` are interchangeable; `flowing` reads better on pipes. */
  get active(): boolean {
    return this.hasAttribute('active') || this.hasAttribute('flowing');
  }

  get speed(): number {
    return readConnectionSpeed(this.getAttribute('speed'));
  }

  get direction(): FlowDirection {
    return readFlowDirection(this.getAttribute('direction'));
  }

  get diameter(): number {
    return readConnectionDiameter(this.connectionKind, this.getAttribute('diameter'));
  }

  get medium(): MediumId | undefined {
    return readMedium(this.getAttribute('medium'));
  }

  get insulated(): boolean {
    return this.hasAttribute('insulated');
  }

  get status(): string {
    return this.getAttribute('status') ?? 'normal';
  }

  get quality(): string {
    return this.getAttribute('quality') ?? 'good';
  }

  connectedCallback(): void {
    this.setAttribute('aria-hidden', 'true');
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;
    this.dispatchEvent(new CustomEvent('elements-connection-change', {
      bubbles: true,
      composed: true,
      detail: { name, oldValue, newValue },
    }));
  }
}

export class ElementsPipeElement extends ElementsConnectionElement {
  static override readonly defaultKind: ConnectionKind = 'pipe';
}

export class ElementsWireElement extends ElementsConnectionElement {
  static override readonly defaultKind: ConnectionKind = 'wire';
}

export class ElementsSignalElement extends ElementsConnectionElement {
  static override readonly defaultKind: ConnectionKind = 'signal';
}
