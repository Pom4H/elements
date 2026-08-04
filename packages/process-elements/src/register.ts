import { registerElement } from '@pom4h/elements-core/runtime';
import { controllerDefinition } from './elements/controller.js';
import { pumpDefinition } from './elements/pump.js';

registerElement(pumpDefinition);
registerElement(controllerDefinition);

export { controllerDefinition, pumpDefinition };
