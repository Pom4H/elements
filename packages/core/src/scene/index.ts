import { ElementsConnectionElement } from './connection.js';
import { ElementsSceneElement } from './scene.js';

export function registerSceneElements(): void {
  if (!customElements.get('elements-scene')) customElements.define('elements-scene', ElementsSceneElement);
  if (!customElements.get('el-connection')) customElements.define('el-connection', ElementsConnectionElement);
}

export { ElementsConnectionElement } from './connection.js';
export { ElementsSceneElement } from './scene.js';
export {
  connectionKinds,
  connectionVisualMetrics,
  flowDirections,
  parseEndpointReference,
  readConnectionDiameter,
  readConnectionKind,
  readConnectionSpeed,
  readFlowDirection,
  type ConnectionKind,
  type ConnectionVisualMetrics,
  type EndpointReference,
  type FlowDirection,
} from './model.js';
