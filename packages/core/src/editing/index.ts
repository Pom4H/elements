import { ElementsInspectorElement } from './inspector.js';

export function registerEditingElements(): void {
  if (!customElements.get('elements-inspector')) {
    customElements.define('elements-inspector', ElementsInspectorElement);
  }
}

export {
  conversionCandidate,
  conversionCandidates,
  convertElement,
  type ConversionCandidate,
  type ConversionOptions,
  type ConversionResult,
} from './conversion.js';
export { ElementsInspectorElement } from './inspector.js';
