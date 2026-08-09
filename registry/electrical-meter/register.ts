import { registerElementsCore } from '@pom4h/elements-core/register';
import { registerElement } from '@pom4h/elements-core/runtime';
import { meterDefinition } from './meter.js';

export function registerElectricalMeter(): void {
  registerElementsCore();
  registerElement(meterDefinition);
}

registerElectricalMeter();

export { meterDefinition };
