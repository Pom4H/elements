import { createElementsManifest, createManifestEntry } from '@pom4h/elements-core';
import { breakerDefinition } from './elements/breaker.js';
import { contactorDefinition } from './elements/contactor.js';
import { meterDefinition } from './elements/meter.js';
import { motorDefinition } from './elements/motor.js';
import { transformerDefinition } from './elements/transformer.js';

export const electricalElementsManifest = createElementsManifest({
  name: '@pom4h/electrical-elements',
  version: '0.1.0',
  elements: [
    createManifestEntry(motorDefinition),
    createManifestEntry(breakerDefinition),
    createManifestEntry(contactorDefinition),
    createManifestEntry(transformerDefinition),
    createManifestEntry(meterDefinition),
  ],
});
