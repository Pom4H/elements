import { media, readConnectionKind, readMedium, type ConnectionKind, type MediumId } from './model.js';

export const junctionAttributes = ['x', 'y', 'kind', 'medium', 'label'] as const;

/**
 * A named point in a scene that connections can start at or end on. Unlike a
 * tap it is placed explicitly, so three or four runs can meet somewhere no
 * equipment stands, and it moves like any other scene node.
 *
 * The scene sizes the fitting from the widest run that reaches it and reports
 * how many runs meet it, so the same element reads as a coupling, a tee or a
 * cross without being told which it is.
 */
export class ElementsJunctionElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return [...junctionAttributes];
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          width: var(--elements-junction-size, 22px);
          height: var(--elements-junction-size, 22px);
          color: var(--elements-junction-medium, var(--elements-process-flow, #59d8ff));
        }
        svg { display: block; width: 100%; height: 100%; overflow: visible; }
        .body {
          fill: var(--elements-pipe-bore, #0a1723);
          stroke: var(--elements-pipe-shell, #53687c);
          stroke-width: 2.5;
        }
        .core { fill: currentColor; opacity: .5; }
        :host([data-links="1"]) .core { opacity: .2; }
        :host([data-links="4"]) .body { stroke-width: 3.2; }
        :host([kind="wire"]) .body {
          fill: var(--elements-wire-core, #b86f32);
          stroke: var(--elements-wire-shell, #27384b);
        }
        :host([kind="signal"]) .body {
          fill: var(--elements-signal-shell, #355068);
          stroke: var(--elements-signal-shell, #355068);
        }
      </style>
      <svg viewBox="0 0 24 24" part="junction" aria-hidden="true">
        <circle class="body" cx="12" cy="12" r="9"/>
        <circle class="core" cx="12" cy="12" r="4"/>
      </svg>
    `;
  }

  connectedCallback(): void {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'presentation');
    this.#applyMedium();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;
    if (name === 'medium') this.#applyMedium();
    this.dispatchEvent(new CustomEvent('elements-connection-change', {
      bubbles: true,
      composed: true,
      detail: { name, oldValue, newValue },
    }));
  }

  get connectionKind(): ConnectionKind {
    return readConnectionKind(this.getAttribute('kind'));
  }

  get medium(): MediumId | undefined {
    return readMedium(this.getAttribute('medium'));
  }

  #applyMedium(): void {
    const medium = this.medium;
    if (medium === undefined) this.style.removeProperty('--elements-junction-medium');
    else this.style.setProperty('--elements-junction-medium', `var(${media[medium].variable}, ${media[medium].color})`);
  }
}
