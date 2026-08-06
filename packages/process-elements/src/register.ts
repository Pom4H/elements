import { registerElementsCore } from '@pom4h/elements-core/register';
import { registerElement } from '@pom4h/elements-core/runtime';
import { controllerDefinition } from './elements/controller.js';
import { pidPumpDefinition } from './elements/pid-pump.js';
import { pidValveDefinition } from './elements/pid-valve.js';
import { pidVesselDefinition } from './elements/pid-vessel.js';
import { pumpDefinition } from './elements/pump.js';

export function registerProcessElements(): void {
  registerElementsCore();
  registerElement(pumpDefinition);
  registerElement(controllerDefinition);
  registerElement(pidPumpDefinition);
  registerElement(pidValveDefinition);
  registerElement(pidVesselDefinition);
}

export {
  controllerDefinition,
  pidPumpDefinition,
  pidValveDefinition,
  pidVesselDefinition,
  pumpDefinition,
};
