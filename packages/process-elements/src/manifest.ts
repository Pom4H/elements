import { createManifestEntry } from '@pom4h/elements-core';
import { controllerDefinition } from './elements/controller.js';
import { pumpDefinition } from './elements/pump.js';

export const processElementsManifest = Object.freeze({
  name: 'process-elements',
  version: '0.1.0',
  elements: [createManifestEntry(pumpDefinition), createManifestEntry(controllerDefinition)],
});
