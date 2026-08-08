import { registerElementsCore } from '@pom4h/elements-core/register';
import { registerElement } from '@pom4h/elements-core/runtime';
import { controlValveDefinition } from '../../src/elements/process-control-valve/control-valve.js';

registerElementsCore();
registerElement(controlValveDefinition);

export { controlValveDefinition };
