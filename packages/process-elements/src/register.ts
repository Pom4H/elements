import { registerElementsCore } from '@pom4h/elements-core/register';
import { registerElement } from '@pom4h/elements-core/runtime';
import { controlValveDefinition } from './elements/control-valve.js';
import { controllerDefinition } from './elements/controller.js';
import { pumpDefinition } from './elements/pump.js';

export function registerProcessElements(): void {
  registerElementsCore();
  registerElement(pumpDefinition);
  registerElement(controllerDefinition);
  registerElement(controlValveDefinition);
}

export { controlValveDefinition, controllerDefinition, pumpDefinition };
