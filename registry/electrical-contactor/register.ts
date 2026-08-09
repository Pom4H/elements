import { registerElementsCore } from '@pom4h/elements-core/register';
import { registerElement } from '@pom4h/elements-core/runtime';
import { contactorDefinition } from './contactor.js';

export function registerElectricalContactor(): void {
  registerElementsCore();
  registerElement(contactorDefinition);
}

registerElectricalContactor();

export { contactorDefinition };
