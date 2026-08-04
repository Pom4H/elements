const documentScopes = new WeakMap<Document, MotionScope>();

export interface MotionScopeProvider extends Element {
  readonly motionScope: MotionScope;
}

function hasMotionScope(value: Element): value is MotionScopeProvider {
  return 'motionScope' in value && value.motionScope instanceof MotionScope;
}

function composedParent(element: Element): Element | null {
  if (element.parentElement) return element.parentElement;
  const root = element.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
}

export class MotionScope {
  readonly #timeline: AnimationTimeline;
  readonly #epochs = new Map<string, number>();

  constructor(timeline: AnimationTimeline = document.timeline) {
    this.#timeline = timeline;
  }

  get timeline(): AnimationTimeline {
    return this.#timeline;
  }

  epoch(phase: string): number {
    const current = this.#timeline.currentTime;
    const now = typeof current === 'number' ? current : performance.now();
    const existing = this.#epochs.get(phase);
    if (existing !== undefined) return existing;
    this.#epochs.set(phase, now);
    return now;
  }

  align(animation: Animation, phase: string): void {
    const epoch = this.epoch(phase);
    void animation.ready.then(() => {
      if (animation.playState === 'idle') return;
      animation.startTime = epoch;
    });
  }
}

export function defaultMotionScope(ownerDocument: Document): MotionScope {
  const existing = documentScopes.get(ownerDocument);
  if (existing) return existing;
  const scope = new MotionScope(ownerDocument.timeline);
  documentScopes.set(ownerDocument, scope);
  return scope;
}

export function findMotionScope(element: Element): MotionScope {
  let current: Element | null = element;
  while (current) {
    if (current !== element && hasMotionScope(current)) return current.motionScope;
    current = composedParent(current);
  }
  return defaultMotionScope(element.ownerDocument);
}
