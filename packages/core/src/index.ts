export { attribute, type AttributeDefinition, type AttributeDefinitions } from './attributes.js';
export { bind, type BindingDefinition } from './bindings.js';
export {
  CollectionController,
  defineFragment,
  instantiateFragment,
  updateFragmentPlacement,
  type CollectionDefinition,
  type FragmentPlacement,
  type SvgFragmentDefinition,
} from './composition/index.js';
export {
  defineElementDefinition,
  initialViewBox,
  resolveViewBox,
  viewBox,
  type DynamicViewBox,
  type ElementDefinition,
  type ViewBoxDefinition,
} from './definition.js';
export { createManifestEntry, type ElementsManifestEntry } from './manifest.js';
export type {
  LoopMotionDefinition,
  MotionDefinition,
  MotionReduction,
  ScrubMotionDefinition,
  TransitionMotionDefinition,
} from './motion/index.js';
export { svg, type SvgTemplate } from './template.js';
export type {
  AttributeValueMap,
  ContextReader,
  CssPartDefinition,
  ElementContext,
  ElementTagName,
  Point,
  PortDefinition,
  PortDirection,
  Primitive,
  StateValueMap,
  VisualDetail,
} from './types.js';
export * from './routing/index.js';
