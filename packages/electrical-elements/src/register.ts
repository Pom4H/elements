import { registerElementsCore } from '@pom4h/elements-core/register';
import { registerElement } from '@pom4h/elements-core/runtime';
import { breakerDefinition } from './elements/breaker.js';
import { contactorDefinition } from './elements/contactor.js';
import { meterDefinition } from './elements/meter.js';
import { motorDefinition } from './elements/motor.js';
import { transformerDefinition } from './elements/transformer.js';

export function registerElectricalElements(): void {
  registerElementsCore();
  registerElement(motorDefinition);
  registerElement(breakerDefinition);
  registerElement(contactorDefinition);
  registerElement(transformerDefinition);
  registerElement(meterDefinition);
}

export {
  breakerDefinition,
  contactorDefinition,
  meterDefinition,
  motorDefinition,
  transformerDefinition,
};
