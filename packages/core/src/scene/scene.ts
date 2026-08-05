import { ElementsElement } from '../element.js';
import { MotionScope } from '../motion/index.js';
import { pointsToRoundedPath, routeOrthogonal } from '../routing/index.js';
import type { Point, PortDefinition, PortDirection } from '../types.js';
import { ElementsConnectionElement } from './connection.js';
import {
  connectionVisualMetrics,
  parseEndpointReference,
  readConnectionDiameter,
  readConnectionKind,
  readConnectionSpeed,
  readFlowDirection,
  type ConnectionKind,
  type ConnectionVisualMetrics,
} from './model.js';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const CONNECTION_ATTRIBUTES = [
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
  'id',
  'x',
  'y',
  'width',
  'height',
  'rotation',
  'scale',
] as const;

interface PortAnchor {
  readonly point: Point;
  readonly direction: PortDirection;
  readonly kind: string | undefined;
}

interface RenderedConnection {
  readonly group: SVGGElement;
  readonly shadow: SVGPathElement;
  readonly shell: SVGPathElement;
  readonly bore: SVGPathElement;
  readonly flow: SVGPathElement;
  animation: Animation | null;
  animationSignature: string;
}

function svgElement<K extends keyof SVGElementTagNameMap>(name: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NAMESPACE, name);
}

function numberAttribute(element: Element, name: string): number | undefined {
  const value = element.getAttribute(name);
  if (value === null || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function directionVector(direction: PortDirection): Point {
  switch (direction) {
    case 'left': return { x: -1, y: 0 };
    case 'right': return { x: 1, y: 0 };
    case 'top': return { x: 0, y: -1 };
    case 'bottom': return { x: 0, y: 1 };
  }
}

function screenDirection(dx: number, dy: number): PortDirection {
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'bottom' : 'top';
}

function isElementsElement(element: Element): element is ElementsElement {
  return element instanceof ElementsElement;
}

function createRenderedConnection(): RenderedConnection {
  const group = svgElement('g');
  group.classList.add('connection');
  group.setAttribute('part', 'connection');

  const shadow = svgElement('path');
  shadow.classList.add('connection-shadow');
  shadow.setAttribute('part', 'connection-shadow');

  const shell = svgElement('path');
  shell.classList.add('connection-shell');
  shell.setAttribute('part', 'connection-shell');

  const bore = svgElement('path');
  bore.classList.add('connection-bore');
  bore.setAttribute('part', 'connection-bore');

  const flow = svgElement('path');
  flow.classList.add('connection-flow');
  flow.setAttribute('part', 'connection-flow');

  group.append(shadow, shell, bore, flow);
  return { group, shadow, shell, bore, flow, animation: null, animationSignature: '' };
}

export class ElementsSceneElement extends HTMLElement {
  readonly motionScope: MotionScope;

  readonly #svg: SVGSVGElement;
  readonly #layer: SVGGElement;
  readonly #slot: HTMLSlotElement;
  readonly #rendered = new Map<ElementsConnectionElement, RenderedConnection>();
  readonly #resizeObserver = new ResizeObserver(() => this.#scheduleRender());
  readonly #mutationObserver = new MutationObserver((records) => {
    if (records.some((record) => record.type === 'childList')) this.#syncResizeTargets();
    this.#scheduleRender();
  });
  #frame = 0;
  #connected = false;
  #observedNodeCount = -1;

  constructor() {
    super();
    this.motionScope = new MotionScope(document.timeline);
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          min-width: 1px;
          min-height: 1px;
          overflow: hidden;
          isolation: isolate;
          container-type: inline-size;
        }
        svg {
          position: absolute;
          inset: 0;
          z-index: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
          pointer-events: none;
        }
        slot { position: relative; z-index: 1; }
        ::slotted(:not(el-connection)) { z-index: 1; }
        ::slotted(el-connection) { display: none !important; }
        .connection path {
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .connection-shadow { stroke: var(--elements-connection-shadow, rgb(0 4 10 / .68)); }
        .connection-shell { stroke: var(--elements-pipe-shell, #53687c); }
        .connection-bore { stroke: var(--elements-pipe-bore, #0a1723); }
        .connection-flow {
          stroke: var(--elements-process-flow, #59d8ff);
          opacity: .12;
          filter: drop-shadow(0 0 2px rgb(89 216 255 / .32));
          transition: opacity 180ms ease;
        }
        .connection[data-active="true"] .connection-flow { opacity: .96; }
        .connection[data-kind="wire"] .connection-shell { stroke: var(--elements-wire-shell, #27384b); }
        .connection[data-kind="wire"] .connection-bore { stroke: var(--elements-wire-core, #b86f32); }
        .connection[data-kind="wire"] .connection-flow {
          stroke: var(--elements-current-flow, #ffd65a);
          filter: drop-shadow(0 0 2px rgb(255 214 90 / .36));
        }
        .connection[data-kind="signal"] .connection-shell { stroke: var(--elements-signal-shell, #355068); }
        .connection[data-kind="signal"] .connection-bore { stroke: transparent; }
        .connection[data-kind="signal"] .connection-flow {
          stroke: var(--elements-signal-flow, #82bfff);
          filter: none;
        }
        .connection[data-status="warning"] .connection-shell { stroke: var(--elements-warning, #ffbe4a); }
        .connection[data-status="alarm"] .connection-shell { stroke: var(--elements-alarm, #ff5c74); }
        .connection[data-quality="stale"] { opacity: .58; }
        .connection[data-quality="bad"] { opacity: .34; filter: grayscale(1); }
        .connection[data-compatible="false"] .connection-shell {
          stroke: var(--elements-alarm, #ff5c74);
          stroke-dasharray: 7 6;
        }
        @media (prefers-reduced-motion: reduce) {
          .connection-flow { filter: none; }
        }
      </style>
      <svg part="connections" aria-hidden="true" preserveAspectRatio="none">
        <g part="connection-layer"></g>
      </svg>
      <slot></slot>
    `;

    const svg = shadow.querySelector('svg');
    const layer = shadow.querySelector('svg > g');
    const slot = shadow.querySelector('slot');
    if (!(svg instanceof SVGSVGElement) || !(layer instanceof SVGGElement) || !(slot instanceof HTMLSlotElement)) {
      throw new Error('Elements scene template is incomplete.');
    }
    this.#svg = svg;
    this.#layer = layer;
    this.#slot = slot;
    this.#slot.addEventListener('slotchange', () => {
      this.#syncResizeTargets();
      this.#scheduleRender();
    });
  }

  connectedCallback(): void {
    this.#connected = true;
    this.#mutationObserver.observe(this, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [...CONNECTION_ATTRIBUTES],
    });
    this.addEventListener('elements-update', this.#onElementUpdate);
    this.addEventListener('elements-connection-change', this.#onConnectionChange);
    this.#syncResizeTargets();
    this.#scheduleRender();
  }

  disconnectedCallback(): void {
    this.#connected = false;
    this.#mutationObserver.disconnect();
    this.#resizeObserver.disconnect();
    this.removeEventListener('elements-update', this.#onElementUpdate);
    this.removeEventListener('elements-connection-change', this.#onConnectionChange);
    if (this.#frame !== 0) cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    for (const rendered of this.#rendered.values()) {
      rendered.animation?.cancel();
      rendered.animation = null;
    }
  }

  refreshConnections(): void {
    this.#scheduleRender();
  }

  readonly #onElementUpdate = (): void => this.#scheduleRender();
  readonly #onConnectionChange = (): void => this.#scheduleRender();

  #nodes(): ElementsElement[] {
    return Array.from(this.children).filter(isElementsElement);
  }

  #connections(): ElementsConnectionElement[] {
    return Array.from(this.children).filter(
      (element): element is ElementsConnectionElement => element instanceof ElementsConnectionElement,
    );
  }

  #syncResizeTargets(): void {
    const nodes = this.#nodes();
    if (nodes.length === this.#observedNodeCount && this.#connected) return;
    this.#observedNodeCount = nodes.length;
    this.#resizeObserver.disconnect();
    if (!this.#connected) return;
    this.#resizeObserver.observe(this);
    for (const node of nodes) this.#resizeObserver.observe(node);
  }

  #scheduleRender(): void {
    if (!this.#connected || this.#frame !== 0) return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      this.#render();
    });
  }

  #applyNodeLayout(node: ElementsElement): void {
    const managed = ['x', 'y', 'width', 'height', 'rotation', 'scale'].some((name) => node.hasAttribute(name));
    if (!managed) return;

    node.style.position = 'absolute';
    node.style.left = `${numberAttribute(node, 'x') ?? 0}px`;
    node.style.top = `${numberAttribute(node, 'y') ?? 0}px`;

    const width = numberAttribute(node, 'width');
    const height = numberAttribute(node, 'height');
    if (width === undefined) node.style.removeProperty('width');
    else node.style.width = `${Math.max(1, width)}px`;
    if (height === undefined) node.style.removeProperty('height');
    else node.style.height = `${Math.max(1, height)}px`;

    const rotation = numberAttribute(node, 'rotation') ?? 0;
    const scale = numberAttribute(node, 'scale') ?? 1;
    node.style.transformOrigin = 'center center';
    node.style.transform = `rotate(${rotation}deg) scale(${Math.max(0.01, scale)})`;
  }

  #portAnchor(node: ElementsElement, portId: string, sceneRect: DOMRect): PortAnchor | undefined {
    const constructor = node.constructor as typeof ElementsElement;
    const port = constructor.definition.ports?.find((candidate) => candidate.id === portId);
    if (!port) return undefined;

    const matrix = node.svgRoot.getScreenCTM();
    if (!matrix) return undefined;
    const screenPoint = new DOMPoint(port.x, port.y).matrixTransform(matrix);
    const vector = directionVector(port.direction);
    const screenVector = new DOMPoint(port.x + vector.x, port.y + vector.y).matrixTransform(matrix);

    return {
      point: { x: screenPoint.x - sceneRect.left, y: screenPoint.y - sceneRect.top },
      direction: screenDirection(screenVector.x - screenPoint.x, screenVector.y - screenPoint.y),
      kind: port.kind,
    };
  }

  #resolveAnchor(referenceValue: string | null, sceneRect: DOMRect): PortAnchor | undefined {
    const reference = parseEndpointReference(referenceValue);
    if (!reference) return undefined;
    const node = this.#nodes().find((candidate) => candidate.id === reference.elementId);
    return node ? this.#portAnchor(node, reference.portId, sceneRect) : undefined;
  }

  #render(): void {
    const sceneRect = this.getBoundingClientRect();
    const width = Math.max(1, sceneRect.width);
    const height = Math.max(1, sceneRect.height);
    this.#svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const nodes = this.#nodes();
    if (nodes.length !== this.#observedNodeCount) this.#syncResizeTargets();
    for (const node of nodes) this.#applyNodeLayout(node);

    const activeConnections = new Set(this.#connections());
    for (const [connection, rendered] of this.#rendered) {
      if (activeConnections.has(connection)) continue;
      rendered.animation?.cancel();
      rendered.group.remove();
      this.#rendered.delete(connection);
    }

    for (const connection of activeConnections) {
      let rendered = this.#rendered.get(connection);
      if (!rendered) {
        rendered = createRenderedConnection();
        this.#rendered.set(connection, rendered);
        this.#layer.append(rendered.group);
      }
      this.#renderConnection(connection, rendered, sceneRect);
    }
  }

  #renderConnection(
    connection: ElementsConnectionElement,
    rendered: RenderedConnection,
    sceneRect: DOMRect,
  ): void {
    const source = this.#resolveAnchor(connection.getAttribute('from'), sceneRect);
    const target = this.#resolveAnchor(connection.getAttribute('to'), sceneRect);
    if (!source || !target) {
      rendered.group.setAttribute('display', 'none');
      return;
    }
    rendered.group.removeAttribute('display');

    const kind = readConnectionKind(connection.getAttribute('kind'));
    const diameter = readConnectionDiameter(kind, connection.getAttribute('diameter'));
    const metrics = connectionVisualMetrics(kind, diameter);
    const stub = Math.max(24, diameter * 1.6);
    const radius = Math.max(7, diameter * 0.72);
    const path = pointsToRoundedPath(routeOrthogonal(source, target, stub), radius);

    for (const pathElement of [rendered.shadow, rendered.shell, rendered.bore, rendered.flow]) {
      pathElement.setAttribute('d', path);
    }
    rendered.shadow.setAttribute('stroke-width', String(metrics.outerWidth + (kind === 'pipe' ? 5 : 2)));
    rendered.shell.setAttribute('stroke-width', String(metrics.outerWidth));
    rendered.bore.setAttribute('stroke-width', String(metrics.innerWidth));
    rendered.flow.setAttribute('stroke-width', String(metrics.flowWidth));
    rendered.flow.setAttribute('stroke-dasharray', `${metrics.dash} ${metrics.gap}`);

    const compatible = this.#compatible(kind, source.kind, target.kind);
    rendered.group.dataset.kind = kind;
    rendered.group.dataset.active = String(connection.hasAttribute('active'));
    rendered.group.dataset.compatible = String(compatible);
    rendered.group.dataset.status = connection.getAttribute('status') ?? 'normal';
    rendered.group.dataset.quality = connection.getAttribute('quality') ?? 'good';
    const label = connection.getAttribute('label');
    if (label === null) rendered.group.removeAttribute('aria-label');
    else rendered.group.setAttribute('aria-label', label);

    this.#syncAnimation(connection, rendered, kind, metrics);
  }

  #compatible(kind: ConnectionKind, sourceKind: string | undefined, targetKind: string | undefined): boolean {
    if (sourceKind === undefined || targetKind === undefined) return true;
    if (sourceKind !== targetKind) return false;
    if (kind === 'pipe') return sourceKind === 'process';
    if (kind === 'wire') return sourceKind === 'electrical' || sourceKind === 'power';
    return sourceKind === 'signal' || sourceKind === 'network';
  }

  #syncAnimation(
    connection: ElementsConnectionElement,
    rendered: RenderedConnection,
    kind: ConnectionKind,
    metrics: ConnectionVisualMetrics,
  ): void {
    const direction = readFlowDirection(connection.getAttribute('direction'));
    const signature = `${kind}:${direction}:${metrics.cycle}`;
    if (rendered.animation === null || rendered.animationSignature !== signature) {
      rendered.animation?.cancel();
      const offset = direction === 'reverse' ? metrics.cycle : -metrics.cycle;
      const duration = kind === 'pipe' ? 1050 : kind === 'wire' ? 720 : 900;
      const animation = rendered.flow.animate(
        [{ strokeDashoffset: '0' }, { strokeDashoffset: String(offset) }],
        { duration, iterations: Infinity, easing: 'linear' },
      );
      animation.pause();
      animation.currentTime = 0;
      rendered.animation = animation;
      rendered.animationSignature = signature;
    }

    const animation = rendered.animation;
    const speed = readConnectionSpeed(connection.getAttribute('speed'));
    if (!connection.hasAttribute('active') || speed === 0) {
      animation.pause();
      return;
    }

    animation.playbackRate = speed;
    if (animation.playState !== 'running') animation.play();
    this.motionScope.align(animation, kind === 'pipe' ? 'process-flow' : kind === 'wire' ? 'electrical-flow' : 'signal-flow');
  }
}
