import { registerElementsCore } from '@pom4h/elements-core/register';
import { registerElement } from '@pom4h/elements-core/runtime';
import { compressorDefinition } from './elements/compressor.js';
import { controlValveDefinition } from './elements/control-valve.js';
import { controllerDefinition } from './elements/controller.js';
import { fanDefinition } from './elements/fan.js';
import { heatExchangerDefinition } from './elements/heat-exchanger.js';
import { instrumentDefinition } from './elements/instrument.js';
import { pidPumpDefinition } from './elements/pid-pump.js';
import { pidValveDefinition } from './elements/pid-valve.js';
import { pidVesselDefinition } from './elements/pid-vessel.js';
import { pumpDefinition } from './elements/pump.js';
import { tankDefinition } from './elements/tank.js';
import { valveDefinition } from './elements/valve.js';

export function registerProcessElements(): void {
  registerElementsCore();
  registerElement(tankDefinition);
  registerElement(pumpDefinition);
  registerElement(valveDefinition);
  registerElement(controlValveDefinition);
  registerElement(fanDefinition);
  registerElement(compressorDefinition);
  registerElement(heatExchangerDefinition);
  registerElement(instrumentDefinition);
  registerElement(controllerDefinition);
  registerElement(pidPumpDefinition);
  registerElement(pidValveDefinition);
  registerElement(pidVesselDefinition);
}

export {
  compressorDefinition,
  controlValveDefinition,
  controllerDefinition,
  fanDefinition,
  heatExchangerDefinition,
  instrumentDefinition,
  pidPumpDefinition,
  pidValveDefinition,
  pidVesselDefinition,
  pumpDefinition,
  tankDefinition,
  valveDefinition,
};
