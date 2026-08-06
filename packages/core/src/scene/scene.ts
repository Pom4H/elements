import { ElementsElement } from '../element.js';
import { MotionScope } from '../motion/index.js';
import { pointsToRoundedPath, routeBranched, tapPolyline, type RouteObstacle } from '../routing/index.js';
import type { Point, PortDefinition, PortDirection } from '../types.js';
import { ElementsConnectionElement, connectionAttributes } from './connection.js';
import { ElementsJunctionElement, junctionAttributes } from './junction.js';
import {
  connectionVisualMetrics,
  media,
  mediumStyles,
  portCompatibility,
  readMedium,
  type ConnectionKind,
  type ConnectionVisualMetrics,
  type EndpointReference,
  type EndpointSpec,
  type MediumId,
  type TapReference,
} from './model.js';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const LAYOUT_ATTRIBUTES = ['id', 'x', 'y', 'width', 'height', 'rotation', 'scale'] as const;
const OBSERVED_ATTRIBUTES = [...new Set([...connectionAttributes, ...junctionAttributes, ...LAYOUT_ATTRIBUTES])];

interface PortAnchor {
  readonly point: Point;
  readonly direction: PortDirection;
  /** Absent when the anchor is a tap on another run rather than an equipment port. */
  readonly port: PortDefinition | undefined;
}

/**
 * An endpoint before its facing is settled. Junctions have no direction of
 * their own, so theirs is decided once the other end of the run is known.
 */
interface Endpoint {
  readonly point: Point;
  readonly direction: PortDirection | undefined;
  readonly port: PortDefinition | undefined;
  readonly junction?: ElementsJunctionElement;
  /** Id of the equipment owning this endpoint, so the run can ignore it as an obstacle. */
  readonly owner?: string;
}

function faceEndpoint(endpoint: Endpoint, counterpart: Point): PortAnchor {
  const direction = endpoint.direction
    ?? screenDirection(counterpart.x - endpoint.point.x, counterpart.y - endpoint.point.y);
  return { point: endpoint.point, direction, port: endpoint.port };
}

interface JunctionUse {
  readonly links: number;
  readonly diameter: number;
}

interface RenderContext {
  readonly sceneRect: DOMRect;
  readonly nodes: ReadonlyMap<string, ElementsElement>;
  readonly junctions: ReadonlyMap<string, ElementsJunctionElement>;
  readonly obstacles: ReadonlyMap<string, RouteObstacle>;
  readonly routes: Map<string, ResolvedRoute>;
  readonly junctionUse: Map<string, JunctionUse>;
}

interface RenderedConnection {
  readonly group: SVGGElement;
  readonly shadow: SVGPathElement;
  readonly jacket: SVGPathElement;
  readonly shell: SVGPathElement;
  readonly bore: SVGPathElement;
  readonly flow: SVGPathElement;
  readonly fittings: SVGGElement;
  animation: Animation | null;
  animationSignature: string;
}

/** What a later run needs to know to tap this one. */
interface ResolvedRoute {
  readonly points: readonly Point[];
  readonly diameter: number;
  readonly medium: MediumId | undefined;
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

function stubOut(point: Point, direction: PortDirection, stub: number): Point {
  const vector = directionVector(direction);
  return { x: point.x + vector.x * stub, y: point.y + vector.y * stub };
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

  const jacket = svgElement('path');
  jacket.classList.add('connection-jacket');
  jacket.setAttribute('part', 'connection-jacket');

  const shell = svgElement('path');
  shell.classList.add('connection-shell');
  shell.setAttribute('part', 'connection-shell');

  const bore = svgElement('path');
  bore.classList.add('connection-bore');
  bore.setAttribute('part', 'connection-bore');

  const flow = svgElement('path');
  flow.classList.add('connection-flow');
  flow.setAttribute('part', 'connection-flow');

  const fittings = svgElement('g');
  fittings.classList.add('connection-fittings');
  fittings.setAttribute('part', 'connection-fittings');

  group.append(shadow, jacket, shell, bore, flow, fittings);
  return { group, shadow, jacket, shell, bore, flow, fittings, animation: null, animationSignature: '' };
}

/** Every polyline of a run as one multi-subpath `d`; dashes restart per branch. */
function routeToPath(segments: readonly (readonly Point[])[], radius: number): string {
  return segments.map((points) => pointsToRoundedPath(points, radius)).filter(Boolean).join(' ');
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
        ::slotted(*) { z-index: 1; }
        /* Connections are declarations, not boxes: the scene draws them. */
        ::slotted(el-connection),
        ::slotted(el-pipe),
        ::slotted(el-wire),
        ::slotted(el-signal) { display: none !important; }
        ::slotted(el-junction) { z-index: 2; }
        .connection path {
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .connection-shadow { stroke: var(--elements-connection-shadow, rgb(0 4 10 / .68)); }
        .connection-jacket {
          stroke: var(--elements-insulation, #9fb2c2);
          opacity: 0;
        }
        .connection[data-insulated="true"] .connection-jacket { opacity: .34; }
        .connection-shell { stroke: var(--elements-pipe-shell, #53687c); }
        .connection-bore { stroke: var(--elements-pipe-bore, #0a1723); }
        .connection-flow {
          stroke: var(--elements-process-flow, #59d8ff);
          opacity: .12;
          filter: drop-shadow(0 0 2px rgb(89 216 255 / .32));
          transition: opacity 180ms ease;
        }
        .connection[data-active="true"] .connection-flow { opacity: .96; }
        ${mediumStyles(
          (id) => `.connection[data-medium="${id}"] .connection-flow`,
          (color) => `stroke:${color};filter:drop-shadow(0 0 2px ${color})`,
        )}
        .connection[data-phase="gas"] .connection-flow { opacity: .08; }
        .connection[data-phase="gas"][data-active="true"] .connection-flow { opacity: .6; }
        .connection-collar {
          fill: var(--elements-pipe-bore, #0a1723);
          stroke: var(--elements-pipe-shell, #53687c);
        }
        .connection-fittings[data-reducing="true"] .connection-collar {
          stroke: var(--elements-pipe-reducer, #8ba0b3);
        }
        .connection[data-kind="wire"] .connection-collar {
          fill: var(--elements-wire-core, #b86f32);
          stroke: var(--elements-wire-shell, #27384b);
        }
        .connection[data-kind="signal"] .connection-collar {
          fill: var(--elements-signal-shell, #355068);
          stroke: var(--elements-signal-shell, #355068);
        }
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
        .connection[data-issue] .connection-shell {
          stroke: var(--elements-alarm, #ff5c74);
          stroke-dasharray: 7 6;
        }
        .connection[data-issue] .connection-flow { display: none; }
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
      attributeFilter: [...OBSERVED_ATTRIBUTES],
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

  #junctions(): ElementsJunctionElement[] {
    return Array.from(this.children).filter(
      (element): element is ElementsJunctionElement => element instanceof ElementsJunctionElement,
    );
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

  #applyNodeLayout(node: HTMLElement): void {
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
    // Ports are resolved per instance: a tank with four nozzles exposes four
    // more anchors than the same definition with one.
    const port = node.port(portId);
    if (!port) return undefined;

    const matrix = node.svgRoot.getScreenCTM();
    if (!matrix) return undefined;
    const screenPoint = new DOMPoint(port.x, port.y).matrixTransform(matrix);
    const vector = directionVector(port.direction);
    const screenVector = new DOMPoint(port.x + vector.x, port.y + vector.y).matrixTransform(matrix);

    return {
      point: { x: screenPoint.x - sceneRect.left, y: screenPoint.y - sceneRect.top },
      direction: screenDirection(screenVector.x - screenPoint.x, screenVector.y - screenPoint.y),
      port,
    };
  }

  /** Endpoint whose facing is not known until its counterpart is placed. */
  #junctionEndpoint(junction: ElementsJunctionElement, sceneRect: DOMRect): Endpoint {
    const rect = junction.getBoundingClientRect();
    return {
      point: {
        x: rect.left + rect.width / 2 - sceneRect.left,
        y: rect.top + rect.height / 2 - sceneRect.top,
      },
      direction: undefined,
      port: undefined,
      junction,
    };
  }

  #resolveEndpoint(spec: EndpointSpec | undefined, context: RenderContext): Endpoint | undefined {
    if (!spec) return undefined;
    if (spec.type === 'node') {
      const junction = context.junctions.get(spec.nodeId);
      return junction ? this.#junctionEndpoint(junction, context.sceneRect) : undefined;
    }
    const node = context.nodes.get(spec.elementId);
    if (!node) return undefined;
    const anchor = this.#portAnchor(node, spec.portId, context.sceneRect);
    return anchor ? { ...anchor, owner: spec.elementId } : undefined;
  }

  #render(): void {
    const sceneRect = this.getBoundingClientRect();
    const width = Math.max(1, sceneRect.width);
    const height = Math.max(1, sceneRect.height);
    this.#svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const nodes = this.#nodes();
    if (nodes.length !== this.#observedNodeCount) this.#syncResizeTargets();
    for (const node of nodes) this.#applyNodeLayout(node);
    const junctions = this.#junctions();
    for (const junction of junctions) this.#applyNodeLayout(junction);

    const connections = this.#connections();
    const activeConnections = new Set(connections);
    for (const [connection, rendered] of this.#rendered) {
      if (activeConnections.has(connection)) continue;
      rendered.animation?.cancel();
      rendered.group.remove();
      this.#rendered.delete(connection);
    }

    const context: RenderContext = {
      sceneRect,
      nodes: new Map(nodes.filter((node) => node.id !== '').map((node) => [node.id, node])),
      junctions: new Map(junctions.filter((junction) => junction.id !== '').map((junction) => [junction.id, junction])),
      obstacles: new Map(nodes.filter((node) => node.id !== '').map((node) => {
        const rect = node.getBoundingClientRect();
        return [node.id, {
          x: rect.left - sceneRect.left,
          y: rect.top - sceneRect.top,
          width: rect.width,
          height: rect.height,
        }];
      })),
      routes: new Map(),
      junctionUse: new Map(),
    };

    // Runs that start at a port are routed first so that runs tapping them
    // already have a trunk to attach to, whatever the document order.
    const taps: ElementsConnectionElement[] = [];
    for (const connection of connections) {
      if (connection.tap === undefined || context.junctions.has(connection.tap.connectionId)) {
        this.#renderConnection(connection, context);
      } else {
        taps.push(connection);
      }
    }
    for (const connection of taps) this.#renderConnection(connection, context);

    this.#sizeJunctions(junctions, context);
  }

  /** A junction wears the widest run that reaches it, and says how many meet it. */
  #sizeJunctions(junctions: readonly ElementsJunctionElement[], context: RenderContext): void {
    for (const junction of junctions) {
      const use = context.junctionUse.get(junction.id);
      junction.dataset.links = String(use?.links ?? 0);
      const diameter = use?.diameter ?? 0;
      if (diameter <= 0) junction.style.removeProperty('--elements-junction-size');
      else junction.style.setProperty('--elements-junction-size', `${Math.round(diameter + 10)}px`);
    }
  }

  #renderedFor(connection: ElementsConnectionElement): RenderedConnection {
    let rendered = this.#rendered.get(connection);
    if (!rendered) {
      rendered = createRenderedConnection();
      this.#rendered.set(connection, rendered);
      this.#layer.append(rendered.group);
    }
    return rendered;
  }

  #renderConnection(connection: ElementsConnectionElement, context: RenderContext): void {
    const rendered = this.#renderedFor(connection);
    const rawTargets = connection.targets
      .map((spec) => this.#resolveEndpoint(spec, context))
      .filter((endpoint): endpoint is Endpoint => endpoint !== undefined);

    const tap = connection.tap;
    const junctionSource = tap === undefined ? undefined : context.junctions.get(tap.connectionId);
    const trunk = tap === undefined || junctionSource !== undefined
      ? undefined
      : context.routes.get(tap.connectionId);

    const rawSource = junctionSource !== undefined
      ? this.#junctionEndpoint(junctionSource, context.sceneRect)
      : tap === undefined
        ? this.#resolveEndpoint(connection.source === undefined ? undefined : { type: 'port', ...connection.source }, context)
        : this.#tapEndpoint(trunk, tap, rawTargets[0], connection.diameter);

    if (!rawSource || rawTargets.length === 0) {
      rendered.group.setAttribute('display', 'none');
      return;
    }
    rendered.group.removeAttribute('display');

    // A junction has no facing of its own; it takes the one that points at
    // whatever sits on the other end of the run.
    const source = faceEndpoint(rawSource, rawTargets[0]!.point);
    const targets = rawTargets.map((target) => faceEndpoint(target, source.point));

    const kind = connection.connectionKind;
    const diameter = connection.diameter;
    const metrics = connectionVisualMetrics(kind, diameter);
    const stub = Math.max(24, diameter * 1.6);
    const radius = Math.max(7, diameter * 0.72);

    // Equipment at either end of this run is not something it has to avoid.
    const exempt = new Set([rawSource.owner, ...rawTargets.map((target) => target.owner)]);
    const obstacles = [...context.obstacles]
      .filter(([id]) => !exempt.has(id))
      .map(([, obstacle]) => obstacle);

    const route = routeBranched(source, targets, { stub, obstacles, margin: Math.max(10, diameter) });
    const path = routeToPath([route.trunk, ...route.branches], radius);

    for (const endpoint of [rawSource, ...rawTargets]) {
      if (!endpoint.junction) continue;
      const use = context.junctionUse.get(endpoint.junction.id) ?? { links: 0, diameter: 0 };
      context.junctionUse.set(endpoint.junction.id, {
        links: use.links + 1,
        diameter: Math.max(use.diameter, diameter),
      });
    }

    for (const pathElement of [rendered.shadow, rendered.jacket, rendered.shell, rendered.bore, rendered.flow]) {
      pathElement.setAttribute('d', path);
    }
    rendered.shadow.setAttribute('stroke-width', String(metrics.outerWidth + (kind === 'pipe' ? 5 : 2)));
    rendered.jacket.setAttribute('stroke-width', String(metrics.outerWidth + 9));
    rendered.shell.setAttribute('stroke-width', String(metrics.outerWidth));
    rendered.bore.setAttribute('stroke-width', String(metrics.innerWidth));
    rendered.flow.setAttribute('stroke-width', String(metrics.flowWidth));
    rendered.flow.setAttribute('stroke-dasharray', `${metrics.dash} ${metrics.gap}`);

    // The endpoint media win over the connection attribute: a nozzle that
    // declares oil keeps the pipe amber even when the markup forgets to say so.
    // A tap with nothing of its own inherits from the run it branches off.
    const medium = readMedium(source.port?.medium ?? null)
      ?? targets.map((target) => readMedium(target.port?.medium ?? null)).find(Boolean)
      ?? connection.medium
      ?? trunk?.medium;
    const compatibility = targets
      .map((target) => portCompatibility(kind, source.port, target.port))
      .find((result) => !result.compatible) ?? { compatible: true };

    // A tee where the branch is narrower than its run is a reducing tee; the
    // fitting is drawn at the run's bore so the step reads as a real fitting.
    this.#renderFittings(rendered, route.tees, diameter, trunk === undefined ? diameter : trunk.diameter, tap, source.point);

    const id = connection.getAttribute('id');
    if (id !== null) context.routes.set(id, { points: route.trunk, diameter, medium });
    rendered.group.dataset.kind = kind;
    rendered.group.dataset.active = String(connection.active);
    rendered.group.dataset.insulated = String(connection.insulated);
    rendered.group.dataset.status = connection.status;
    rendered.group.dataset.quality = connection.quality;
    if (medium === undefined) {
      delete rendered.group.dataset.medium;
      delete rendered.group.dataset.phase;
    } else {
      rendered.group.dataset.medium = medium;
      rendered.group.dataset.phase = media[medium].phase;
    }
    if (compatibility.issue === undefined) delete rendered.group.dataset.issue;
    else rendered.group.dataset.issue = compatibility.issue;

    const label = connection.getAttribute('label');
    if (label === null) rendered.group.removeAttribute('aria-label');
    else rendered.group.setAttribute('aria-label', label);

    this.#syncAnimation(connection, rendered, kind, metrics);
  }

  /** Where a branching run leaves the run it taps, and which way it heads off. */
  #tapEndpoint(
    trunk: ResolvedRoute | undefined,
    tap: TapReference,
    target: Endpoint | undefined,
    diameter: number,
  ): Endpoint | undefined {
    if (!trunk || !target) return undefined;
    const stub = Math.max(24, diameter * 1.6);
    // Aim at the target's stub rather than the port itself, so the branch leaves
    // the run opposite the approach rather than doubling back.
    const toward = target.direction === undefined
      ? target.point
      : stubOut(target.point, target.direction, stub);
    const anchor = tapPolyline(trunk.points, toward, tap.fraction);
    if (!anchor) return undefined;
    return { point: anchor.point, direction: anchor.direction, port: undefined };
  }

  #renderFittings(
    rendered: RenderedConnection,
    tees: readonly Point[],
    branchDiameter: number,
    trunkDiameter: number,
    tap: TapReference | undefined,
    tapPoint: Point,
  ): void {
    const collars = tap === undefined ? tees : [tapPoint, ...tees];
    const runDiameter = tap === undefined ? branchDiameter : trunkDiameter;
    const reducing = branchDiameter < runDiameter - 1;

    while (rendered.fittings.childElementCount > collars.length) {
      rendered.fittings.lastElementChild?.remove();
    }
    while (rendered.fittings.childElementCount < collars.length) {
      const collar = svgElement('circle');
      collar.classList.add('connection-collar');
      rendered.fittings.append(collar);
    }

    collars.forEach((point, index) => {
      const collar = rendered.fittings.children[index];
      if (!(collar instanceof SVGCircleElement)) return;
      collar.setAttribute('cx', String(point.x));
      collar.setAttribute('cy', String(point.y));
      collar.setAttribute('r', String(Math.max(branchDiameter, runDiameter) * 0.5 + 1.5));
      collar.setAttribute('stroke-width', String(reducing ? 3 : 2));
    });
    rendered.fittings.dataset.reducing = String(reducing);
  }

  #syncAnimation(
    connection: ElementsConnectionElement,
    rendered: RenderedConnection,
    kind: ConnectionKind,
    metrics: ConnectionVisualMetrics,
  ): void {
    const direction = connection.direction;
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
    const speed = connection.speed;
    if (!connection.active || speed === 0) {
      animation.pause();
      return;
    }

    animation.playbackRate = speed;
    if (animation.playState !== 'running') animation.play();
    this.motionScope.align(animation, kind === 'pipe' ? 'process-flow' : kind === 'wire' ? 'electrical-flow' : 'signal-flow');
  }
}
