import type { ElementContext } from '../types.js';
import type { PartTarget } from '../parts.js';

export type MotionReduction = 'freeze' | 'finish' | 'preserve';

interface MotionBase {
  readonly id: string;
  readonly target: PartTarget;
  readonly keyframes: Keyframe[] | PropertyIndexedKeyframes | ((context: ElementContext, target: Element) => Keyframe[] | PropertyIndexedKeyframes);
  readonly options: KeyframeAnimationOptions | ((context: ElementContext, target: Element) => KeyframeAnimationOptions);
  readonly reducedMotion?: MotionReduction;
}

export interface LoopMotionDefinition extends MotionBase {
  readonly type: 'loop';
  readonly active: (context: ElementContext, target: Element, index: number) => boolean;
  readonly playbackRate?: (context: ElementContext, target: Element, index: number) => number;
  readonly phase?: string | ((context: ElementContext, target: Element, index: number) => string);
}

export interface TransitionMotionDefinition extends MotionBase {
  readonly type: 'transition';
  readonly trigger: (context: ElementContext, target: Element, index: number) => unknown;
  readonly enabled?: (context: ElementContext, target: Element, index: number) => boolean;
  readonly playOnInitial?: boolean;
}

export interface ScrubMotionDefinition extends MotionBase {
  readonly type: 'scrub';
  readonly progress: (context: ElementContext, target: Element, index: number) => number;
}

export type MotionDefinition = LoopMotionDefinition | TransitionMotionDefinition | ScrubMotionDefinition;

export interface MotionStatus {
  readonly id: string;
  readonly target: Element;
  readonly animation: Animation;
  readonly type: MotionDefinition['type'];
}
