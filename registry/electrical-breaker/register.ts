import { registerElementsCore } from '@pom4h/elements-core/register';
import { registerElement } from '@pom4h/elements-core/runtime';
import { breakerDefinition } from './breaker.js';

export function registerElectricalBreaker(): void {
  registerElementsCore();
  registerElement(breakerDefinition);
}

registerElectricalBreaker();

export { breakerDefinition };
