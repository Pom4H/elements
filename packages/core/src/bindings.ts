import type { ElementContext } from './types.js';
import type { PartMap, PartTarget } from './parts.js';

interface BindingBase {
  readonly target: PartTarget | 'host';
  readonly dependencies?: readonly string[];
}

export interface TextBinding extends BindingBase {
  readonly type: 'text';
  readonly read: (context: ElementContext, target: Element, index: number) => string;
}

export interface AttributeBinding extends BindingBase {
  readonly type: 'attribute';
  readonly name: string;
  readonly read: (context: ElementContext, target: Element, index: number) => string | number | null | undefined;
}

export interface BooleanAttributeBinding extends BindingBase {
  readonly type: 'boolean-attribute';
  readonly name: string;
  readonly read: (context: ElementContext, target: Element, index: number) => boolean;
}

export interface StyleBinding extends BindingBase {
  readonly type: 'style';
  readonly name: string;
  readonly read: (context: ElementContext, target: Element, index: number) => string | number | null | undefined;
}

export type BindingDefinition = TextBinding | AttributeBinding | BooleanAttributeBinding | StyleBinding;

function shouldApply(binding: BindingDefinition, changed: ReadonlySet<string>): boolean {
  if (binding.dependencies === undefined || binding.dependencies.length === 0 || changed.size === 0) return true;
  return binding.dependencies.some((dependency) => changed.has(dependency));
}

function targetsFor(binding: BindingDefinition, host: HTMLElement, parts: PartMap): readonly Element[] {
  return binding.target === 'host' ? [host] : parts.get(binding.target);
}

export function applyBindings(
  bindings: readonly BindingDefinition[],
  context: ElementContext,
  parts: PartMap,
  changed: ReadonlySet<string>,
): void {
  for (const binding of bindings) {
    if (!shouldApply(binding, changed)) continue;
    const targets = targetsFor(binding, context.host, parts);
    targets.forEach((target, index) => {
      switch (binding.type) {
        case 'text':
          target.textContent = binding.read(context, target, index);
          break;
        case 'attribute': {
          const value = binding.read(context, target, index);
          if (value === null || value === undefined) target.removeAttribute(binding.name);
          else target.setAttribute(binding.name, String(value));
          break;
        }
        case 'boolean-attribute':
          target.toggleAttribute(binding.name, binding.read(context, target, index));
          break;
        case 'style': {
          const value = binding.read(context, target, index);
          const styled = target as HTMLElement | SVGElement;
          if (value === null || value === undefined) styled.style.removeProperty(binding.name);
          else styled.style.setProperty(binding.name, String(value));
          break;
        }
      }
    });
  }
}

export const bind = {
  text(
    target: PartTarget | 'host',
    read: TextBinding['read'],
    dependencies?: readonly string[],
  ): TextBinding {
    return { type: 'text', target, read, ...(dependencies === undefined ? {} : { dependencies }) };
  },

  attribute(
    target: PartTarget | 'host',
    name: string,
    read: AttributeBinding['read'],
    dependencies?: readonly string[],
  ): AttributeBinding {
    return { type: 'attribute', target, name, read, ...(dependencies === undefined ? {} : { dependencies }) };
  },

  booleanAttribute(
    target: PartTarget | 'host',
    name: string,
    read: BooleanAttributeBinding['read'],
    dependencies?: readonly string[],
  ): BooleanAttributeBinding {
    return { type: 'boolean-attribute', target, name, read, ...(dependencies === undefined ? {} : { dependencies }) };
  },

  style(
    target: PartTarget | 'host',
    name: string,
    read: StyleBinding['read'],
    dependencies?: readonly string[],
  ): StyleBinding {
    return { type: 'style', target, name, read, ...(dependencies === undefined ? {} : { dependencies }) };
  },
};
