import type { PortDefinition } from '../types.js';
import type { SvgTemplate } from '../template.js';

export interface SvgFragmentDefinition {
  readonly name: string;
  readonly template: SvgTemplate;
  readonly ports?: readonly PortDefinition[];
}

export interface FragmentPlacement {
  readonly key: string;
  readonly fragment: SvgFragmentDefinition;
  readonly x?: number;
  readonly y?: number;
  readonly rotate?: number;
  readonly scale?: number;
  readonly attributes?: Readonly<Record<string, string | number | boolean | null | undefined>>;
  readonly styles?: Readonly<Record<`--${string}`, string | number | null | undefined>>;
}

const fragmentCache = new WeakMap<SvgFragmentDefinition, HTMLTemplateElement>();

function compileFragment(fragment: SvgFragmentDefinition): HTMLTemplateElement {
  const cached = fragmentCache.get(fragment);
  if (cached) return cached;
  const template = document.createElement('template');
  template.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg"><g>${fragment.template.markup}</g></svg>`;
  fragmentCache.set(fragment, template);
  return template;
}

function rewriteReference(value: string, ids: ReadonlyMap<string, string>): string {
  let rewritten = value.replace(/url\(#([^)]+)\)/g, (match, id: string) => {
    const replacement = ids.get(id);
    return replacement === undefined ? match : `url(#${replacement})`;
  });
  if (rewritten.startsWith('#')) {
    const replacement = ids.get(rewritten.slice(1));
    if (replacement !== undefined) rewritten = `#${replacement}`;
  }
  return rewritten;
}

function namespaceIds(root: SVGElement, namespace: string): void {
  const ids = new Map<string, string>();
  if (root.id) ids.set(root.id, `${namespace}-${root.id}`);
  for (const element of root.querySelectorAll<SVGElement>('[id]')) {
    ids.set(element.id, `${namespace}-${element.id}`);
  }

  for (const [source, target] of ids) {
    const element = root.id === source ? root : root.querySelector<SVGElement>(`#${CSS.escape(source)}`);
    if (element) element.id = target;
  }

  const referenceAttributes = ['href', 'xlink:href', 'fill', 'stroke', 'filter', 'clip-path', 'mask', 'marker-start', 'marker-mid', 'marker-end'];
  for (const element of [root, ...root.querySelectorAll<SVGElement>('*')]) {
    for (const attributeName of referenceAttributes) {
      const value = element.getAttribute(attributeName);
      if (value !== null) element.setAttribute(attributeName, rewriteReference(value, ids));
    }
    const style = element.getAttribute('style');
    if (style !== null) element.setAttribute('style', rewriteReference(style, ids));
  }
}

function placementTransform(placement: FragmentPlacement): string {
  const transforms: string[] = [];
  if (placement.x !== undefined || placement.y !== undefined) {
    transforms.push(`translate(${placement.x ?? 0} ${placement.y ?? 0})`);
  }
  if (placement.rotate !== undefined) transforms.push(`rotate(${placement.rotate})`);
  if (placement.scale !== undefined) transforms.push(`scale(${placement.scale})`);
  return transforms.join(' ');
}

export function instantiateFragment(placement: FragmentPlacement): SVGGElement {
  const compiled = compileFragment(placement.fragment);
  const svg = compiled.content.firstElementChild?.cloneNode(true);
  if (!(svg instanceof SVGSVGElement)) throw new TypeError(`Unable to instantiate fragment ${placement.fragment.name}.`);
  const root = svg.firstElementChild;
  if (!(root instanceof SVGGElement)) throw new TypeError(`Fragment ${placement.fragment.name} must produce an SVG group.`);

  root.dataset.fragment = placement.fragment.name;
  root.dataset.instance = placement.key;
  namespaceIds(root, placement.key.replace(/[^a-zA-Z0-9_-]/g, '-'));
  updateFragmentPlacement(root, placement);
  return root;
}

export function updateFragmentPlacement(root: SVGGElement, placement: FragmentPlacement): void {
  const transform = placementTransform(placement);
  if (transform === '') root.removeAttribute('transform');
  else root.setAttribute('transform', transform);

  for (const [name, value] of Object.entries(placement.attributes ?? {})) {
    if (value === null || value === undefined || value === false) root.removeAttribute(name);
    else root.setAttribute(name, value === true ? '' : String(value));
  }
  for (const [name, value] of Object.entries(placement.styles ?? {})) {
    if (value === null || value === undefined) root.style.removeProperty(name);
    else root.style.setProperty(name, String(value));
  }
}

export function defineFragment(definition: SvgFragmentDefinition): SvgFragmentDefinition {
  return Object.freeze(definition);
}
