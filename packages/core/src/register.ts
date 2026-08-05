import { registerSceneElements } from './scene/index.js';

export * from './runtime.js';

export function registerElementsCore(): void {
  registerSceneElements();
}
