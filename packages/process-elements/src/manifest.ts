import { createElementsManifest, createManifestEntry } from '@pom4h/elements-core';
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

export const processElementsManifest = createElementsManifest({
  name: '@pom4h/process-elements',
  version: '0.1.0',
  elements: [
    createManifestEntry(tankDefinition),
    createManifestEntry(pumpDefinition),
    createManifestEntry(valveDefinition),
    createManifestEntry(controlValveDefinition),
    createManifestEntry(fanDefinition),
    createManifestEntry(compressorDefinition),
    createManifestEntry(heatExchangerDefinition),
    createManifestEntry(instrumentDefinition),
    createManifestEntry(controllerDefinition),
    createManifestEntry(pidPumpDefinition),
    createManifestEntry(pidValveDefinition),
    createManifestEntry(pidVesselDefinition),
  ],
});
