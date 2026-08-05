import { describe, expect, test } from 'bun:test';
import type { ElementContext, ElementDefinition } from '@pom4h/elements-core';
import { controlValveDefinition } from '../src/elements/control-valve.js';
import { controllerDefinition } from '../src/elements/controller.js';
import { pumpDefinition } from '../src/elements/pump.js';
import { tankDefinition } from '../src/elements/tank.js';

/**
 * A device element is the functional twin of a machine, not a picture of one.
 * These are the rules that can be checked without eyes; the rest — recognisable
 * proportions, legibility at 96 px — is checked by looking.
 *
 * Elements listed as redrawn must obey them. The legacy list is spelled out so
 * a new element cannot quietly join it.
 */
const REDRAWN: readonly ElementDefinition[] = [controlValveDefinition];
const LEGACY: readonly ElementDefinition[] = [pumpDefinition, tankDefinition, controllerDefinition];

/** Attribute combinations worth probing, so fragment swaps are covered too. */
const PROBES: readonly Record<string, unknown>[] = [
  {},
  { detail: 'symbol' },
  { actuator: 'electric' },
  { actuator: 'electric', detail: 'symbol' },
  { orientation: 'horizontal' },
  { agitator: true, heater: true, nozzles: 3 },
];

function contextWith(attributes: Record<string, unknown>): ElementContext {
  return { host: undefined as unknown as HTMLElement, attributes, states: {} };
}

/** Every piece of SVG an element can put on screen, across all its variants. */
function allMarkup(definition: ElementDefinition): string {
  const parts = [definition.template.markup];
  for (const collection of definition.collections ?? []) {
    for (const probe of PROBES) {
      for (const placement of collection.items(contextWith(probe))) {
        parts.push(placement.fragment.template.markup);
      }
    }
  }
  return parts.join('\n');
}

describe.each(REDRAWN.map((definition) => [definition.tagName, definition] as const))(
  'drawing rules · %s',
  (_tagName, definition) => {
    test('is drawn flat: no gradients, no filters, no glows', () => {
      const markup = allMarkup(definition);
      expect(markup).not.toMatch(/<(linear|radial)Gradient/i);
      expect(markup).not.toMatch(/<filter[\s>]/i);
      expect(definition.styles ?? '').not.toMatch(/filter\s*:\s*url\(/i);
      expect(definition.styles ?? '').not.toMatch(/drop-shadow\(/i);
    });

    test('contains no piping and no flow: the scene owns both', () => {
      const markup = allMarkup(definition);
      for (const banned of [/data-part="[^"]*flow/i, /data-part="[^"]*stream/i, /data-part="[^"]*pipe/i]) {
        expect(markup).not.toMatch(banned);
      }
      const targets = (definition.motions ?? []).map((motion) => String(motion.target));
      expect(targets.filter((target) => /flow|stream|pipe/i.test(target))).toEqual([]);
    });

    test('animates only named parts, so every movement had to be justified', () => {
      const declared = new Set((definition.parts ?? []).map((part) => part.name));
      const targets = (definition.motions ?? []).map((motion) => String(motion.target));
      expect(targets.filter((target) => !declared.has(target))).toEqual([]);
    });

    test('keeps the motion budget: movement is the exception, not the finish', () => {
      expect((definition.motions ?? []).length).toBeLessThanOrEqual(6);
    });

    test('puts every port on the outer band of the drawing, never floating inside', () => {
      const [, , width = 0, height = 0] = String(definition.viewBox).split(/[\s,]+/).map(Number);
      const ports = Array.isArray(definition.ports) ? definition.ports : definition.ports?.initial ?? [];
      for (const port of ports) {
        const nearEdge = Math.min(port.x, width - port.x) <= width * 0.25
          || Math.min(port.y, height - port.y) <= height * 0.25;
        expect(`${port.id}:${nearEdge}`).toBe(`${port.id}:true`);
      }
    });
  },
);

describe('drawing debt', () => {
  test('the legacy list is exactly the elements not yet redrawn', () => {
    expect(LEGACY.map((definition) => definition.tagName).sort())
      .toEqual(['pe-controller', 'pe-pump', 'pe-tank']);
  });

  test('every legacy element still fails at least one rule, so the list stays honest', () => {
    for (const definition of LEGACY) {
      const markup = allMarkup(definition);
      const flat = !/<(linear|radial)Gradient/i.test(markup) && !/<filter[\s>]/i.test(markup);
      const clean = !/data-part="[^"]*(flow|stream)/i.test(markup);
      const budget = (definition.motions ?? []).length <= 6;
      expect(`${definition.tagName}:${flat && clean && budget}`).toBe(`${definition.tagName}:false`);
    }
  });
});
