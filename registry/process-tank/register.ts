import { registerElementsCore } from '@pom4h/elements-core/register';
import { registerElement } from '@pom4h/elements-core/runtime';
import { tankDefinition } from '../../src/elements/process-tank/tank.js';

registerElementsCore();
registerElement(tankDefinition);

export { tankDefinition };
