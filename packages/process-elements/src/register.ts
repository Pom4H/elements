import { registerElementsCore } from '@pom4h/elements-core/register';
import { registerElement } from '@pom4h/elements-core/runtime';
import { controllerDefinition } from './elements/controller.js';
import { pumpDefinition } from './elements/pump.js';

export function registerProcessElements(): void {
  registerElementsCore();
  registerElement(pumpDefinition);
  registerElement(controllerDefinition);
}

export { controllerDefinition, pumpDefinition };
