export class ElementsConnectionElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return [
      'from',
      'to',
      'kind',
      'active',
      'speed',
      'direction',
      'diameter',
      'status',
      'quality',
      'label',
    ];
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
