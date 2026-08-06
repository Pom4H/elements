import { createManifestEntry } from '@pom4h/elements-core';
import { controlValveDefinition } from './elements/control-valve.js';
import { controllerDefinition } from './elements/controller.js';
import { pidPumpDefinition } from './elements/pid-pump.js';
import { pidValveDefinition } from './elements/pid-valve.js';
import { pidVesselDefinition } from './elements/pid-vessel.js';
import { pumpDefinition } from './elements/pump.js';
import { tankDefinition } from './elements/tank.js';

export const processElementsManifest = Object.freeze({
  name: 'process-elements',
  version: '0.1.0',
  elements: [
    createManifestEntry(tankDefinition),
    createManifestEntry(pumpDefinition),
    createManifestEntry(controlValveDefinition),
    createManifestEntry(controllerDefinition),
    createManifestEntry(pidPumpDefinition),
    createManifestEntry(pidValveDefinition),
    createManifestEntry(pidVesselDefinition),
  ],
});
