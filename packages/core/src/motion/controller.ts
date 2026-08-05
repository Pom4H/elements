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
}

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
  #scope: MotionScope;

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
          runtime = { definition, target, animation: undefined, trigger: undefined, initialized: false };
          this.#motions.set(key, runtime);
        }
        this.#reconcileMotion(runtime, context, index);
      });
    }

    for (const [key, runtime] of this.#motions) {
      if (!activeKeys.has(key) || !runtime.target.isConnected) {
        runtime.animation?.cancel();
        this.#motions.delete(key);
      }
    }
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
    runtime.animation.currentTime = finiteDuration(runtime.animation) * progress;
  }
}
