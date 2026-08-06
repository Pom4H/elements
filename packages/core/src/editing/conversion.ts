import type { AttributeDefinition } from '../attributes.js';
import { elementDefinition, elementDefinitions } from '../registry.js';
import { initialPorts, type ElementDefinition } from '../definition.js';
import type { PortDefinition, PortRole } from '../types.js';

export interface ConversionCandidate {
  readonly tagName: string;
  readonly displayName: string;
  /** Source port id → the target port that will carry it. */
  readonly portMapping: Readonly<Record<string, string>>;
  /** Source ports the target cannot honour; their connections would break. */
  readonly droppedPorts: readonly string[];
  readonly carriedAttributes: readonly string[];
  readonly droppedAttributes: readonly string[];
  /** True when nothing in use is lost. */
  readonly lossless: boolean;
}

export interface ConversionOptions {
  /** Ports currently carrying a connection. Losing one of these breaks a line. */
  readonly usedPorts?: readonly string[];
  /** Definitions to consider. Defaults to everything registered. */
  readonly registry?: readonly ElementDefinition[];
}

/** Attributes the scene owns rather than the element, carried across any conversion. */
const LAYOUT_ATTRIBUTES = ['id', 'class', 'style', 'slot', 'x', 'y', 'width', 'height', 'rotation', 'scale'];

function rolesMatch(source: PortRole | undefined, target: PortRole | undefined): boolean {
  if (source === undefined || target === undefined) return true;
  if (source === 'bidirectional' || target === 'bidirectional') return true;
  return source === target;
}

/**
 * A target port can stand in for a source port when it speaks the same domain
 * and faces the same way through the process. Identical ids win outright.
 */
function standIn(port: PortDefinition, candidates: readonly PortDefinition[]): PortDefinition | undefined {
  return candidates.find((candidate) => candidate.id === port.id)
    ?? candidates.find((candidate) => candidate.kind === port.kind && rolesMatch(port.role, candidate.role));
}

function attributeMap(definition: ElementDefinition): Map<string, AttributeDefinition<unknown>> {
  return new Map(Object.values(definition.attributes).map((entry) => [entry.attribute, entry]));
}

export function conversionCandidate(
  source: ElementDefinition,
  target: ElementDefinition,
  usedPorts: readonly string[] = [],
): ConversionCandidate {
  const sourcePorts = initialPorts(source.ports);
  const available = [...initialPorts(target.ports)];
  const portMapping: Record<string, string> = {};
  const droppedPorts: string[] = [];

  for (const port of sourcePorts) {
    const match = standIn(port, available);
    if (!match) {
      droppedPorts.push(port.id);
      continue;
    }
    portMapping[port.id] = match.id;
    available.splice(available.indexOf(match), 1);
  }

  const targetAttributes = attributeMap(target);
  const carriedAttributes: string[] = [];
  const droppedAttributes: string[] = [];
  for (const entry of Object.values(source.attributes)) {
    const match = targetAttributes.get(entry.attribute);
    if (match && match.kind === entry.kind) carriedAttributes.push(entry.attribute);
    else droppedAttributes.push(entry.attribute);
  }

  return {
    tagName: target.tagName,
    displayName: target.displayName,
    portMapping,
    droppedPorts,
    carriedAttributes,
    droppedAttributes,
    lossless: !usedPorts.some((port) => droppedPorts.includes(port)),
  };
}

/**
 * Every registered element the given one could become, best fit first. An
 * element with no port in common is not offered: swapping a pump for a display
 * would strand every line attached to it.
 */
export function conversionCandidates(
  source: ElementDefinition,
  options: ConversionOptions = {},
): readonly ConversionCandidate[] {
  const registry = options.registry ?? elementDefinitions();
  const sourcePorts = initialPorts(source.ports);

  return registry
    .filter((target) => target.tagName !== source.tagName)
    .map((target) => conversionCandidate(source, target, options.usedPorts ?? []))
    .filter((candidate) => sourcePorts.length === 0 || Object.keys(candidate.portMapping).length > 0)
    .sort((first, second) => {
      if (first.lossless !== second.lossless) return first.lossless ? -1 : 1;
      const ports = Object.keys(second.portMapping).length - Object.keys(first.portMapping).length;
      if (ports !== 0) return ports;
      return second.carriedAttributes.length - first.carriedAttributes.length;
    });
}

export interface ConversionResult {
  readonly element: HTMLElement;
  readonly carried: readonly string[];
  readonly dropped: readonly string[];
}

/**
 * Replaces an element with another tag in place, keeping its identity, its
 * position in the scene and every attribute the new tag also understands.
 */
export function convertElement(element: HTMLElement, tagName: string): ConversionResult {
  const target = elementDefinition(tagName);
  if (!target) throw new Error(`Unknown element definition: ${tagName}`);

  const declared = attributeMap(target);
  const replacement = document.createElement(tagName);
  const carried: string[] = [];
  const dropped: string[] = [];

  for (const { name, value } of [...element.attributes]) {
    if (LAYOUT_ATTRIBUTES.includes(name) || name.startsWith('data-') || name.startsWith('aria-')) {
      replacement.setAttribute(name, value);
      continue;
    }
    if (declared.has(name)) {
      replacement.setAttribute(name, value);
      carried.push(name);
      continue;
    }
    dropped.push(name);
  }

  element.replaceWith(replacement);
  replacement.dispatchEvent(new CustomEvent('elements-converted', {
    bubbles: true,
    composed: true,
    detail: { from: element.localName, to: tagName, carried, dropped },
  }));

  return { element: replacement, carried, dropped };
}
