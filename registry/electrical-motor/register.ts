import { registerElementsCore } from '@pom4h/elements-core/register';
import { registerElement } from '@pom4h/elements-core/runtime';
import { motorDefinition } from './motor.js';

export function registerElectricalMotor(): void {
  registerElementsCore();
  registerElement(motorDefinition);
}

registerElectricalMotor();

export { motorDefinition };
