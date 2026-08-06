import { registerElementsCore } from '@pom4h/elements-core/register';
import { registerElement } from '@pom4h/elements-core/runtime';
import { controlValveDefinition } from './elements/control-valve.js';
import { controllerDefinition } from './elements/controller.js';
import { pidPumpDefinition } from './elements/pid-pump.js';
import { pidValveDefinition } from './elements/pid-valve.js';
import { pidVesselDefinition } from './elements/pid-vessel.js';
import { pumpDefinition } from './elements/pump.js';
import { tankDefinition } from './elements/tank.js';

export function registerProcessElements(): void {
  registerElementsCore();
  registerElement(tankDefinition);
  registerElement(pumpDefinition);
  registerElement(controlValveDefinition);
  registerElement(controllerDefinition);
  registerElement(pidPumpDefinition);
  registerElement(pidValveDefinition);
  registerElement(pidVesselDefinition);
}

export {
  controlValveDefinition,
  controllerDefinition,
  pidPumpDefinition,
  pidValveDefinition,
  pidVesselDefinition,
  pumpDefinition,
  tankDefinition,
};
