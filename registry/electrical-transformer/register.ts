import { registerElementsCore } from '@pom4h/elements-core/register';
import { registerElement } from '@pom4h/elements-core/runtime';
import { transformerDefinition } from './transformer.js';

export function registerElectricalTransformer(): void {
  registerElementsCore();
  registerElement(transformerDefinition);
}

registerElectricalTransformer();

export { transformerDefinition };
