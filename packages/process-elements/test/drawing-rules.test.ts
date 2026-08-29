import { describe, expect, test } from 'bun:test';
import type { ElementContext, ElementDefinition } from '@pom4h/elements-core';
import { compressorDefinition } from '../src/elements/compressor.js';
import { controlValveDefinition } from '../src/elements/control-valve.js';
import { controllerDefinition } from '../src/elements/controller.js';
import { fanDefinition } from '../src/elements/fan.js';
import { heatExchangerDefinition } from '../src/elements/heat-exchanger.js';
import { instrumentDefinition } from '../src/elements/instrument.js';
import { pumpDefinition } from '../src/elements/pump.js';
import { tankDefinition } from '../src/elements/tank.js';
import { valveDefinition } from '../src/elements/valve.js';

const REDRAWN: readonly ElementDefinition[] = [
  pumpDefinition,
  tankDefinition,
  valveDefinition,
  controlValveDefinition,
  fanDefinition,
  compressorDefinition,
  heatExchangerDefinition,
  instrumentDefinition,
];
const LEGACY: readonly ElementDefinition[] = [controllerDefinition];

const PROBES: readonly Record<string, unknown>[] = [
  {},
  { detail: 'symbol' },
  { view: 'pid' },
  { view: 'flat' },
  { view: 'equipment' },
  { actuator: 'electric' },
  { orientation: 'horizontal' },
  { agitator: true, heater: true, nozzles: 3 },
];

function contextWith(attributes: Record<string, unknown>): ElementContext {
  return { host: undefined as unknown as HTMLElement, attributes, states: {} };
}

function allMarkup(definition: ElementDefinition): string {
  const parts = [definition.template.markup];
  for (const collection of definition.collections ?? []) {
    for (const probe of PROBES) {
      for (const placement of collection.items(contextWith(probe))) parts.push(placement.fragment.template.markup);
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

    test('contains no scene-owned pipe or flow parts', () => {
      const markup = allMarkup(definition);
      for (const banned of [/data-part="[^"]*flow/i, /data-part="[^"]*stream/i, /data-part="[^"]*pipe/i]) expect(markup).not.toMatch(banned);
      const targets = (definition.motions ?? []).map((motion) => String(motion.target));
      expect(targets.filter((target) => /flow|stream|pipe/i.test(target))).toEqual([]);
    });

    test('animates only named semantic parts', () => {
      const declared = new Set((definition.parts ?? []).map((part) => part.name));
      const targets = (definition.motions ?? []).map((motion) => String(motion.target));
      expect(targets.filter((target) => !declared.has(target))).toEqual([]);
    });

    test('keeps the motion budget', () => {
      expect((definition.motions ?? []).length).toBeLessThanOrEqual(6);
    });

    test('puts every initial port on the outer band', () => {
      const raw = typeof definition.viewBox === 'string' ? definition.viewBox : definition.viewBox.initial;
      const [, , width = 0, height = 0] = raw.split(/[\s,]+/).map(Number);
      const list = Array.isArray(definition.ports) ? definition.ports : definition.ports?.initial ?? [];
      for (const port of list) {
        const nearEdge = Math.min(port.x, width - port.x) <= width * .25 || Math.min(port.y, height - port.y) <= height * .25;
        expect(`${port.id}:${nearEdge}`).toBe(`${port.id}:true`);
      }
    });

    test('keeps all three SVG views on one attribute contract', () => {
      const view = definition.attributes.view;
      expect(view?.kind).toBe('enum');
      expect(view?.values).toEqual(['pid', 'flat', 'equipment']);
    });
  },
);

describe('drawing debt', () => {
  test('only the controller remains in the legacy drawing family', () => {
    expect(LEGACY.map((definition) => definition.tagName)).toEqual(['pe-controller']);
  });

  test('the legacy controller still fails at least one flat drawing rule', () => {
    const markup = allMarkup(controllerDefinition);
    const flat = !/<(linear|radial)Gradient/i.test(markup) && !/<filter[\s>]/i.test(markup);
    const clean = !/data-part="[^"]*(flow|stream)/i.test(markup);
    const budget = (controllerDefinition.motions ?? []).length <= 6;
    expect(flat && clean && budget).toBe(false);
  });
});
