import type { ElementContext } from '../types.js';
import type { PartMap } from '../parts.js';
import { findMotionScope, type MotionScope } from './scope.js';
import type {
  LoopMotionDefinition,
  MotionDefinition,
  MotionReduction,
  MotionStatus,
  ScrubMotionDefinition,
  TransitionMotionDefinition,
} from './types.js';

interface RuntimeMotion {
  definition: MotionDefinition;
  target: Element;
  animation: Animation | undefined;
  trigger: unknown;
  initialized: boolean;
  /** Timeline position the scrub is travelling towards, in milliseconds. */
  scrubTarget: number;
  /** Timeline position the scrub currently holds, in milliseconds. */
  scrubTime: number;
}

/**
 * Fraction of the remaining distance covered per frame so that roughly 95% of
 * the travel completes within the declared settle time.
 */
const SETTLE_DECAY = 3;
const SETTLE_EPSILON = 0.5;

function resolveKeyframes(definition: MotionDefinition, context: ElementContext, target: Element): Keyframe[] | PropertyIndexedKeyframes {
  return typeof definition.keyframes === 'function' ? definition.keyframes(context, target) : definition.keyframes;
}

function resolveOptions(definition: MotionDefinition, context: ElementContext, target: Element): KeyframeAnimationOptions {
  return typeof definition.options === 'function' ? definition.options(context, target) : definition.options;
}

function reducedMotionActive(host: Element): boolean {
  return host.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;
}

function reductionFor(definition: MotionDefinition): MotionReduction {
  if (definition.reducedMotion !== undefined) return definition.reducedMotion;
  return definition.type === 'scrub' ? 'preserve' : definition.type === 'transition' ? 'finish' : 'freeze';
}

function applyReducedMotion(animation: Animation, reduction: MotionReduction): void {
  switch (reduction) {
    case 'finish':
      animation.finish();
      break;
    case 'freeze':
      animation.pause();
      animation.currentTime = 0;
      break;
    case 'preserve':
      break;
  }
}

function finiteDuration(animation: Animation): number {
  const timing = animation.effect?.getComputedTiming();
  const duration = timing?.duration;
  return typeof duration === 'number' && Number.isFinite(duration) ? duration : 1;
}

export class MotionController {
  readonly #host: HTMLElement;
  readonly #definitions: readonly MotionDefinition[];
  readonly #motions = new Map<string, RuntimeMotion>();
  readonly #settling = new Set<RuntimeMotion>();
  #scope: MotionScope;
  #frame = 0;
  #lastFrameTime = 0;

  constructor(host: HTMLElement, definitions: readonly MotionDefinition[]) {
    this.#host = host;
    this.#definitions = definitions;
    this.#scope = findMotionScope(host);
  }

  connect(): void {
    this.#scope = findMotionScope(this.#host);
  }

  disconnect(): void {
    for (const runtime of this.#motions.values()) runtime.animation?.cancel();
    this.#motions.clear();
    this.#settling.clear();
    this.#stopSettling();
  }

  reconcile(context: ElementContext, parts: PartMap): void {
    const activeKeys = new Set<string>();
    for (const definition of this.#definitions) {
      const targets = parts.get(definition.target);
      targets.forEach((target, index) => {
        const key = `${definition.id}:${index}`;
        activeKeys.add(key);
        let runtime = this.#motions.get(key);
        if (!runtime || runtime.target !== target || runtime.definition !== definition) {
          runtime?.animation?.cancel();
          if (runtime) this.#settling.delete(runtime);
          runtime = {
            definition,
            target,
            animation: undefined,
            trigger: undefined,
            initialized: false,
            scrubTarget: 0,
            scrubTime: 0,
          };
          this.#motions.set(key, runtime);
        }
        this.#reconcileMotion(runtime, context, index);
      });
    }

    for (const [key, runtime] of this.#motions) {
      if (!activeKeys.has(key) || !runtime.target.isConnected) {
        runtime.animation?.cancel();
        this.#settling.delete(runtime);
        this.#motions.delete(key);
      }
    }
    if (this.#settling.size === 0) this.#stopSettling();
  }

  statuses(): readonly MotionStatus[] {
    const statuses: MotionStatus[] = [];
    for (const runtime of this.#motions.values()) {
      if (!runtime.animation) continue;
      statuses.push({
        id: runtime.definition.id,
        target: runtime.target,
        animation: runtime.animation,
        type: runtime.definition.type,
      });
    }
    return statuses;
  }

  #createAnimation(definition: MotionDefinition, context: ElementContext, target: Element): Animation {
    const animation = target.animate(resolveKeyframes(definition, context, target), resolveOptions(definition, context, target));
    animation.id = definition.id;
    return animation;
  }

  #reconcileMotion(runtime: RuntimeMotion, context: ElementContext, index: number): void {
    switch (runtime.definition.type) {
      case 'loop':
        this.#reconcileLoop(runtime, runtime.definition, context, index);
        break;
      case 'transition':
        this.#reconcileTransition(runtime, runtime.definition, context, index);
        break;
      case 'scrub':
        this.#reconcileScrub(runtime, runtime.definition, context, index);
        break;
    }
    runtime.initialized = true;
  }

  #reconcileLoop(
    runtime: RuntimeMotion,
    definition: LoopMotionDefinition,
    context: ElementContext,
    index: number,
  ): void {
    const active = definition.active(context, runtime.target, index);
    if (!active) {
      runtime.animation?.cancel();
      runtime.animation = undefined;
      return;
    }

    if (!runtime.animation) {
      runtime.animation = this.#createAnimation(definition, context, runtime.target);
      const phase = typeof definition.phase === 'function'
        ? definition.phase(context, runtime.target, index)
        : definition.phase;
      if (phase !== undefined) this.#scope.align(runtime.animation, phase);
    }

    const playbackRate = definition.playbackRate?.(context, runtime.target, index) ?? 1;
    runtime.animation.updatePlaybackRate(Number.isFinite(playbackRate) ? playbackRate : 1);
    if (reducedMotionActive(this.#host)) applyReducedMotion(runtime.animation, reductionFor(definition));
    else if (runtime.animation.playState === 'paused') runtime.animation.play();
  }

  #reconcileTransition(
    runtime: RuntimeMotion,
    definition: TransitionMotionDefinition,
    context: ElementContext,
    index: number,
  ): void {
    const trigger = definition.trigger(context, runtime.target, index);
    const enabled = definition.enabled?.(context, runtime.target, index) ?? true;
    const changed = !Object.is(trigger, runtime.trigger);
    const shouldPlay = enabled && changed && (runtime.initialized || definition.playOnInitial === true);
    runtime.trigger = trigger;
    if (!shouldPlay) return;

    runtime.animation?.cancel();
    runtime.animation = this.#createAnimation(definition, context, runtime.target);
    if (reducedMotionActive(this.#host)) applyReducedMotion(runtime.animation, reductionFor(definition));
  }

  #reconcileScrub(
    runtime: RuntimeMotion,
    definition: ScrubMotionDefinition,
    context: ElementContext,
    index: number,
  ): void {
    if (!runtime.animation) {
      runtime.animation = this.#createAnimation(definition, context, runtime.target);
      runtime.animation.pause();
    }
    const progress = Math.min(1, Math.max(0, definition.progress(context, runtime.target, index)));
    runtime.scrubTarget = finiteDuration(runtime.animation) * progress;

    const settle = definition.settle ?? 0;
    const snap = !runtime.initialized || settle <= 0 || reducedMotionActive(this.#host);
    if (snap) {
      this.#settling.delete(runtime);
      runtime.scrubTime = runtime.scrubTarget;
      runtime.animation.currentTime = runtime.scrubTime;
      return;
    }

    if (Math.abs(runtime.scrubTarget - runtime.scrubTime) < SETTLE_EPSILON) {
      this.#settling.delete(runtime);
      runtime.scrubTime = runtime.scrubTarget;
      runtime.animation.currentTime = runtime.scrubTime;
      return;
    }

    this.#settling.add(runtime);
    this.#requestFrame();
  }

  #requestFrame(): void {
    if (this.#frame !== 0) return;
    const view = this.#host.ownerDocument.defaultView;
    if (!view) return;
    this.#lastFrameTime = view.performance.now();
    this.#frame = view.requestAnimationFrame((time) => this.#advanceSettling(time));
  }

  #stopSettling(): void {
    if (this.#frame === 0) return;
    this.#host.ownerDocument.defaultView?.cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#lastFrameTime = 0;
  }

  #advanceSettling(time: number): void {
    this.#frame = 0;
    const elapsed = Math.min(64, Math.max(1, time - this.#lastFrameTime));
    this.#lastFrameTime = time;

    for (const runtime of [...this.#settling]) {
      const definition = runtime.definition;
      if (definition.type !== 'scrub' || !runtime.animation || !runtime.target.isConnected) {
        this.#settling.delete(runtime);
        continue;
      }
      const distance = runtime.scrubTarget - runtime.scrubTime;
      const step = 1 - Math.exp((-SETTLE_DECAY * elapsed) / Math.max(1, definition.settle ?? 0));
      runtime.scrubTime = Math.abs(distance) < SETTLE_EPSILON
        ? runtime.scrubTarget
        : runtime.scrubTime + distance * step;
      runtime.animation.currentTime = runtime.scrubTime;
      if (runtime.scrubTime === runtime.scrubTarget) this.#settling.delete(runtime);
    }

    if (this.#settling.size > 0) this.#requestFrame();
    else this.#lastFrameTime = 0;
  }
}
