import type { AttributeDefinition } from '../attributes.js';
import { elementDefinition } from '../registry.js';
import type { ElementDefinition } from '../definition.js';
import { ElementsElement } from '../element.js';
import { conversionCandidates, convertElement, type ConversionCandidate } from './conversion.js';

const STYLES = `
:host {
  --inspector-surface: var(--elements-inspector-surface, #0c1724);
  --inspector-border: var(--elements-inspector-border, #2b4258);
  --inspector-ink: var(--elements-inspector-ink, #dbe7f3);
  --inspector-muted: var(--elements-inspector-muted, #7d93a8);
  --inspector-accent: var(--elements-inspector-accent, #52c8ff);
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: none;
  font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--inspector-ink);
}
:host([open]) { display: block; }
.scrim { position: absolute; inset: 0; }
.panel {
  position: absolute;
  width: 300px;
  max-height: min(70vh, 620px);
  overflow: auto;
  overscroll-behavior: contain;
  background: var(--inspector-surface);
  border: 1px solid var(--inspector-border);
  border-radius: 12px;
  box-shadow: 0 24px 60px rgb(0 0 0 / .55);
}
header { padding: 12px 14px 10px; border-bottom: 1px solid var(--inspector-border); }
header h2 { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: .01em; }
header p { margin: 3px 0 0; color: var(--inspector-muted); font-size: 10px; letter-spacing: .08em; }
section { padding: 10px 14px 12px; border-bottom: 1px solid var(--inspector-border); }
section:last-child { border-bottom: 0; }
h3 {
  margin: 0 0 8px;
  font-size: 9px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--inspector-muted);
}
.row { display: grid; grid-template-columns: 1fr 132px; gap: 8px; align-items: center; margin-bottom: 6px; }
.row label { color: var(--inspector-muted); overflow: hidden; text-overflow: ellipsis; }
.row label span { color: var(--inspector-ink); }
.row .unit { color: var(--inspector-muted); font-size: 10px; }
input, select, button { font: inherit; color: inherit; }
input[type="text"], input[type="number"], select {
  width: 100%;
  min-width: 0;
  padding: 4px 6px;
  background: #08121d;
  border: 1px solid var(--inspector-border);
  border-radius: 6px;
}
input[type="checkbox"] { accent-color: var(--inspector-accent); justify-self: start; width: 16px; height: 16px; }
input[type="range"] { width: 100%; accent-color: var(--inspector-accent); }
.ports { display: flex; flex-wrap: wrap; gap: 4px; }
.port {
  padding: 2px 6px;
  border: 1px solid var(--inspector-border);
  border-radius: 999px;
  color: var(--inspector-muted);
  font-size: 10px;
}
.port b { color: var(--inspector-ink); font-weight: 600; }
.convert { display: grid; gap: 6px; }
.convert button {
  display: block;
  width: 100%;
  text-align: left;
  padding: 7px 9px;
  background: #10202f;
  border: 1px solid var(--inspector-border);
  border-radius: 8px;
  cursor: pointer;
}
.convert button:hover { border-color: var(--inspector-accent); background: #15293c; }
.convert button strong { display: block; font-weight: 600; }
.convert button em { display: block; margin-top: 2px; font-style: normal; font-size: 10px; color: var(--inspector-muted); }
.convert button[data-lossy] em { color: var(--elements-warning, #ffbe4a); }
.empty { color: var(--inspector-muted); font-size: 10px; }
`;

/**
 * Read straight off the constructor rather than through `instanceof`: a
 * workspace can load two copies of the runtime, and an element from the other
 * copy is still a perfectly good element.
 */
function definitionFor(element: Element): ElementDefinition | undefined {
  const carried = (element.constructor as { definition?: ElementDefinition }).definition;
  if (carried !== undefined && typeof carried.tagName === 'string') return carried;
  return elementDefinition(element.localName);
}

function isElementNode(element: Element): element is ElementsElement {
  return typeof (element as ElementsElement).ports === 'object'
    && Array.isArray((element as ElementsElement).ports);
}

function label(attribute: AttributeDefinition<unknown>): string {
  return attribute.attribute.replace(/-/g, ' ');
}

/**
 * Right-click configuration for scene elements. Everything it shows comes from
 * the element definition, so it gains controls for a new element the moment
 * that element is registered.
 */
export class ElementsInspectorElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['for'];
  }

  readonly #panel: HTMLDivElement;
  readonly #title: HTMLHeadingElement;
  readonly #subtitle: HTMLParagraphElement;
  readonly #body: HTMLDivElement;
  #target: HTMLElement | undefined;
  #root: HTMLElement | Document | undefined;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = STYLES;

    const scrim = document.createElement('div');
    scrim.className = 'scrim';
    scrim.addEventListener('pointerdown', () => this.close());
    scrim.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      this.close();
    });

    this.#panel = document.createElement('div');
    this.#panel.className = 'panel';
    this.#panel.setAttribute('part', 'panel');

    const header = document.createElement('header');
    this.#title = document.createElement('h2');
    this.#subtitle = document.createElement('p');
    header.append(this.#title, this.#subtitle);

    this.#body = document.createElement('div');
    this.#panel.append(header, this.#body);
    shadow.append(style, scrim, this.#panel);
  }

  connectedCallback(): void {
    this.#attach();
    this.ownerDocument.addEventListener('keydown', this.#onKeyDown);
  }

  disconnectedCallback(): void {
    this.#root?.removeEventListener('contextmenu', this.#onContextMenu as EventListener);
    this.ownerDocument.removeEventListener('keydown', this.#onKeyDown);
    this.#root = undefined;
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#attach();
  }

  get target(): HTMLElement | undefined {
    return this.#target;
  }

  close(): void {
    this.removeAttribute('open');
    this.#target = undefined;
  }

  /** Opens the panel for an element, positioned at a point in viewport space. */
  open(element: HTMLElement, at: { readonly x: number; readonly y: number }): void {
    const definition = definitionFor(element);
    if (!definition) return;

    this.#target = element;
    this.#title.textContent = definition.displayName;
    this.#subtitle.textContent = `<${definition.tagName}>${element.id ? ` · #${element.id}` : ''}`;
    this.#render(element, definition);
    this.setAttribute('open', '');
    this.#place(at);
    this.dispatchEvent(new CustomEvent('elements-inspect', {
      bubbles: true,
      composed: true,
      detail: { element, definition },
    }));
  }

  #attach(): void {
    this.#root?.removeEventListener('contextmenu', this.#onContextMenu as EventListener);
    const selector = this.getAttribute('for');
    const root = selector === null
      ? this.parentElement ?? this.ownerDocument
      : this.ownerDocument.getElementById(selector) ?? this.ownerDocument;
    this.#root = root;
    root.addEventListener('contextmenu', this.#onContextMenu as EventListener);
  }

  readonly #onContextMenu = (event: MouseEvent): void => {
    const element = event.composedPath()
      .filter((node): node is HTMLElement => node instanceof HTMLElement)
      .find((node) => definitionFor(node) !== undefined);
    if (!element) return;
    event.preventDefault();
    this.open(element, { x: event.clientX, y: event.clientY });
  };

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.hasAttribute('open')) this.close();
  };

  #place(at: { readonly x: number; readonly y: number }): void {
    const rect = this.#panel.getBoundingClientRect();
    const maxX = Math.max(8, window.innerWidth - rect.width - 8);
    const maxY = Math.max(8, window.innerHeight - rect.height - 8);
    this.#panel.style.left = `${Math.min(maxX, Math.max(8, at.x))}px`;
    this.#panel.style.top = `${Math.min(maxY, Math.max(8, at.y))}px`;
  }

  #render(element: HTMLElement, definition: ElementDefinition): void {
    this.#body.replaceChildren(
      this.#attributeSection(element, definition),
      ...(isElementNode(element) ? [this.#portSection(element)] : []),
      this.#convertSection(element, definition),
    );
  }

  #attributeSection(element: HTMLElement, definition: ElementDefinition): HTMLElement {
    const section = document.createElement('section');
    const heading = document.createElement('h3');
    heading.textContent = 'Attributes';
    section.append(heading);

    for (const attribute of Object.values(definition.attributes)) {
      const row = document.createElement('div');
      row.className = 'row';

      const name = document.createElement('label');
      const text = document.createElement('span');
      text.textContent = label(attribute);
      name.append(text);
      if (attribute.unit !== undefined) {
        const unit = document.createElement('span');
        unit.className = 'unit';
        unit.textContent = ` ${attribute.unit}`;
        name.append(unit);
      }
      if (attribute.description !== undefined) name.title = attribute.description;

      const control = this.#control(element, attribute);
      name.htmlFor = '';
      row.append(name, control);
      section.append(row);
    }
    return section;
  }

  #control(element: HTMLElement, attribute: AttributeDefinition<unknown>): HTMLElement {
    const current = element.getAttribute(attribute.attribute);

    if (attribute.kind === 'boolean') {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = element.hasAttribute(attribute.attribute);
      input.addEventListener('change', () => element.toggleAttribute(attribute.attribute, input.checked));
      return input;
    }

    if (attribute.kind === 'enum') {
      const select = document.createElement('select');
      for (const value of attribute.values ?? []) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.append(option);
      }
      select.value = current ?? String(attribute.defaultValue);
      select.addEventListener('change', () => element.setAttribute(attribute.attribute, select.value));
      return select;
    }

    const input = document.createElement('input');
    input.type = attribute.kind === 'number' ? 'number' : 'text';
    if (attribute.kind === 'number') {
      if (attribute.minimum !== undefined) input.min = String(attribute.minimum);
      if (attribute.maximum !== undefined) input.max = String(attribute.maximum);
      if (attribute.step !== undefined) input.step = String(attribute.step);
    }
    input.value = current ?? String(attribute.defaultValue);
    input.addEventListener('input', () => {
      if (attribute.kind !== 'number') {
        element.setAttribute(attribute.attribute, input.value);
        return;
      }
      // `value` is locale-formatted for numeric inputs; `valueAsNumber` is not.
      const parsed = input.valueAsNumber;
      if (Number.isFinite(parsed)) element.setAttribute(attribute.attribute, String(parsed));
    });
    return input;
  }

  #portSection(element: ElementsElement): HTMLElement {
    const section = document.createElement('section');
    const heading = document.createElement('h3');
    heading.textContent = `Ports · ${element.ports.length}`;
    section.append(heading);

    const list = document.createElement('div');
    list.className = 'ports';
    for (const port of element.ports) {
      const chip = document.createElement('span');
      chip.className = 'port';
      const id = document.createElement('b');
      id.textContent = port.id;
      chip.append(id, ` ${port.kind ?? 'any'}${port.role ? ` · ${port.role}` : ''}`);
      list.append(chip);
    }
    if (element.ports.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'empty';
      empty.textContent = 'No ports declared.';
      list.append(empty);
    }
    section.append(list);
    return section;
  }

  #convertSection(element: HTMLElement, definition: ElementDefinition): HTMLElement {
    const section = document.createElement('section');
    const heading = document.createElement('h3');
    heading.textContent = 'Convert to';
    section.append(heading);

    const used = this.#connectedPorts(element);
    const candidates = conversionCandidates(definition, { usedPorts: used });
    const list = document.createElement('div');
    list.className = 'convert';

    for (const candidate of candidates) {
      list.append(this.#candidateButton(element, candidate));
    }
    if (candidates.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'empty';
      empty.textContent = 'Nothing registered shares this element’s ports.';
      list.append(empty);
    }
    section.append(list);
    return section;
  }

  #candidateButton(element: HTMLElement, candidate: ConversionCandidate): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    const name = document.createElement('strong');
    name.textContent = candidate.displayName;
    const note = document.createElement('em');
    const mapped = Object.keys(candidate.portMapping).length;
    note.textContent = candidate.droppedPorts.length === 0
      ? `${candidate.tagName} · ${mapped} ports, ${candidate.carriedAttributes.length} attributes carried`
      : `${candidate.tagName} · drops ${candidate.droppedPorts.join(', ')}`;
    if (!candidate.lossless) button.dataset.lossy = 'true';
    button.append(name, note);
    button.addEventListener('click', () => {
      const result = convertElement(element, candidate.tagName);
      this.open(result.element, {
        x: Number.parseFloat(this.#panel.style.left) || 0,
        y: Number.parseFloat(this.#panel.style.top) || 0,
      });
    });
    return button;
  }

  /** Ids of this element's ports that some connection currently references. */
  #connectedPorts(element: HTMLElement): readonly string[] {
    const scene = element.parentElement;
    if (!scene || element.id === '') return [];
    const used = new Set<string>();
    for (const connection of scene.children) {
      for (const name of ['from', 'to']) {
        const value = connection.getAttribute(name);
        if (value === null) continue;
        for (const entry of value.split(/[\s,]+/)) {
          const [elementId, portId] = entry.split(':');
          if (elementId === element.id && portId !== undefined) used.add(portId);
        }
      }
    }
    return [...used];
  }
}
