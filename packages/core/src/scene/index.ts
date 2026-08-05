import {
  ElementsConnectionElement,
  ElementsPipeElement,
  ElementsSignalElement,
  ElementsWireElement,
} from './connection.js';
import { ElementsJunctionElement } from './junction.js';
import { ElementsSceneElement } from './scene.js';

const sceneTags: readonly (readonly [string, CustomElementConstructor])[] = [
  ['elements-scene', ElementsSceneElement],
  ['el-connection', ElementsConnectionElement],
  ['el-pipe', ElementsPipeElement],
  ['el-wire', ElementsWireElement],
  ['el-signal', ElementsSignalElement],
  ['el-junction', ElementsJunctionElement],
];

export function registerSceneElements(): void {
  for (const [tagName, elementClass] of sceneTags) {
    if (!customElements.get(tagName)) customElements.define(tagName, elementClass);
  }
}

export {
  ElementsConnectionElement,
  ElementsPipeElement,
  ElementsSignalElement,
  ElementsWireElement,
  connectionAttributes,
} from './connection.js';
export { ElementsJunctionElement, junctionAttributes } from './junction.js';
export { ElementsSceneElement } from './scene.js';
export {
  connectionKinds,
  connectionVisualMetrics,
  flowDirections,
  media,
  mediumColor,
  mediumIds,
  mediumStyles,
  parseEndpointSpec,
  parseEndpointSpecs,
  parseEndpointReference,
  parseTapReference,
  portCompatibility,
  readConnectionDiameter,
  readConnectionKind,
  readConnectionSpeed,
  readFlowDirection,
  readMedium,
  type ConnectionKind,
  type ConnectionVisualMetrics,
  type EndpointReference,
  type FlowDirection,
  type MediumDefinition,
  type MediumId,
  type PortCompatibility,
  type PortCompatibilityIssue,
  type EndpointSpec,
  type TapReference,
} from './model.js';
