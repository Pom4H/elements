/**
 * Pointer and keyboard placement for scene equipment.
 *
 * The scene already treats `x` and `y` as layout attributes and re-routes every
 * connection when they change, so moving a node is only a matter of writing new
 * numbers onto it. Nothing here reaches into the scene's internals.
 */

export interface DragOptions {
  /** Placement grid in CSS pixels. Hold Alt while dragging to ignore it. */
  readonly grid?: number;
  /** Distance a keyboard nudge moves a node; Shift multiplies it by four. */
  readonly nudge?: number;
  /** Canvas scale used by a zoomable editor. Defaults to one. */
  readonly scale?: number | (() => number);
}

interface DragSession {
  readonly node: HTMLElement;
  readonly pointerId: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly startX: number;
  readonly startY: number;
  moved: boolean;
}

interface Bounds {
  readonly width: number;
  readonly height: number;
}

function isMovable(scene: HTMLElement, target: EventTarget | null): HTMLElement | undefined {
  if (!(target instanceof Node)) return undefined;
  const node = (target instanceof Element ? target : target.parentElement)?.closest<HTMLElement>('[data-movable]');
  return node?.parentElement === scene ? node : undefined;
}

function numberAttribute(node: HTMLElement, name: string): number {
  const value = Number(node.getAttribute(name));
  return Number.isFinite(value) ? value : 0;
}

function snap(value: number, grid: number): number {
  return grid <= 1 ? Math.round(value) : Math.round(value / grid) * grid;
}

function scaleValue(option: DragOptions['scale']): number {
  const value = typeof option === 'function' ? option() : option ?? 1;
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function logicalBounds(scene: HTMLElement, scale: number): Bounds {
  const bounds = scene.getBoundingClientRect();
  return { width: bounds.width / scale, height: bounds.height / scale };
}

function place(node: HTMLElement, x: number, y: number, bounds: Bounds, grid: number): void {
  const width = node.offsetWidth || 1;
  const height = node.offsetHeight || 1;
  const maxX = Math.max(0, bounds.width - width);
  const maxY = Math.max(0, bounds.height - height);
  node.setAttribute('x', String(Math.min(maxX, Math.max(0, snap(x, grid)))));
  node.setAttribute('y', String(Math.min(maxY, Math.max(0, snap(y, grid)))));
}

/**
 * Makes every scene child carrying `data-movable` draggable with a pointer and
 * nudgeable with the arrow keys. Returns a teardown function.
 */
export function enableSceneDragging(scene: HTMLElement, options: DragOptions = {}): () => void {
  const grid = options.grid ?? 12;
  const nudge = options.nudge ?? grid;
  let session: DragSession | undefined;

  for (const node of scene.querySelectorAll<HTMLElement>('[data-movable]')) {
    if (!node.hasAttribute('tabindex')) node.tabIndex = 0;
    if (!node.hasAttribute('role')) node.setAttribute('role', 'button');
    if (!node.hasAttribute('aria-label')) node.setAttribute('aria-label', `Move ${node.getAttribute('label') ?? node.id}`);
  }

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || !event.isPrimary) return;
    const node = isMovable(scene, event.target);
    if (!node) return;

    const scale = scaleValue(options.scale);
    const bounds = scene.getBoundingClientRect();
    const startX = numberAttribute(node, 'x');
    const startY = numberAttribute(node, 'y');
    session = {
      node,
      pointerId: event.pointerId,
      offsetX: (event.clientX - bounds.left) / scale - startX,
      offsetY: (event.clientY - bounds.top) / scale - startY,
      startX,
      startY,
      moved: false,
    };
    node.dataset.dragging = 'true';
    node.focus({ preventScroll: true });
    scene.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!session || event.pointerId !== session.pointerId) return;
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      endDrag(event);
      return;
    }
    const scale = scaleValue(options.scale);
    const bounds = scene.getBoundingClientRect();
    place(
      session.node,
      (event.clientX - bounds.left) / scale - session.offsetX,
      (event.clientY - bounds.top) / scale - session.offsetY,
      logicalBounds(scene, scale),
      event.altKey ? 1 : grid,
    );
    session.moved = true;
    event.preventDefault();
  };

  const endDrag = (event: PointerEvent): void => {
    if (!session || event.pointerId !== session.pointerId) return;
    const completed = session;
    delete completed.node.dataset.dragging;
    if (scene.hasPointerCapture(event.pointerId)) scene.releasePointerCapture(event.pointerId);
    session = undefined;
    if (completed.moved) {
      completed.node.dispatchEvent(new CustomEvent('elements-layout-change', {
        bubbles: true,
        composed: true,
        detail: {
          from: { x: completed.startX, y: completed.startY },
          to: { x: numberAttribute(completed.node, 'x'), y: numberAttribute(completed.node, 'y') },
        },
      }));
    }
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    const node = isMovable(scene, event.target);
    if (!node) return;
    const step = (event.shiftKey ? 4 : 1) * nudge;
    const delta: Readonly<Record<string, readonly [number, number]>> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = delta[event.key];
    if (!move) return;
    const scale = scaleValue(options.scale);
    const from = { x: numberAttribute(node, 'x'), y: numberAttribute(node, 'y') };
    place(node, from.x + move[0], from.y + move[1], logicalBounds(scene, scale), 1);
    node.dispatchEvent(new CustomEvent('elements-layout-change', {
      bubbles: true,
      composed: true,
      detail: { from, to: { x: numberAttribute(node, 'x'), y: numberAttribute(node, 'y') } },
    }));
    event.preventDefault();
  };

  scene.addEventListener('pointerdown', onPointerDown);
  scene.addEventListener('pointermove', onPointerMove);
  scene.addEventListener('pointerup', endDrag);
  scene.addEventListener('pointercancel', endDrag);
  scene.addEventListener('keydown', onKeyDown);

  return () => {
    scene.removeEventListener('pointerdown', onPointerDown);
    scene.removeEventListener('pointermove', onPointerMove);
    scene.removeEventListener('pointerup', endDrag);
    scene.removeEventListener('pointercancel', endDrag);
    scene.removeEventListener('keydown', onKeyDown);
  };
}
