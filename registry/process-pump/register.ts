import { registerElementsCore } from '@pom4h/elements-core/register';
import { registerElement } from '@pom4h/elements-core/runtime';
import { pumpDefinition } from './pump.js';

/** Browser-only registration entrypoint for the source-owned pump item. */
export function registerProcessPump(): void {
  registerElementsCore();
  registerElement(pumpDefinition);
}

registerProcessPump();

export { pumpDefinition };
