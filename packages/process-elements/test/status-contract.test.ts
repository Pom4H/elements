import { describe, expect, test } from 'bun:test';
import { controllerDefinition } from '../src/elements/controller.js';
import { pidPumpDefinition } from '../src/elements/pid-pump.js';
import { pidValveDefinition } from '../src/elements/pid-valve.js';
import { pidVesselDefinition } from '../src/elements/pid-vessel.js';
import { pumpDefinition } from '../src/elements/pump.js';

const definitions = [
  pumpDefinition,
  controllerDefinition,
  pidPumpDefinition,
  pidValveDefinition,
  pidVesselDefinition,
];

describe('status and quality contract', () => {
  test('keeps severity, quality, and operation independent', () => {
    for (const definition of definitions) {
      expect(definition.attributes.status?.parse(null)).toBe('normal');
      expect(definition.attributes.status?.parse('idle')).toBe('normal');
      expect(definition.attributes.quality?.parse(null)).toBe('unknown');
      expect(definition.attributes.quality?.parse('good')).toBe('good');

      const states = Object.keys(definition.states ?? {});
      expect(states).not.toContain('warning');
      expect(states).not.toContain('alarm');
      expect(states).not.toContain('stale');
      expect(states).not.toContain('bad-quality');

      const styles = definition.styles ?? '';
      expect(styles).toContain(':host([status="warning"])');
      expect(styles).toContain(':host([status="alarm"])');
      expect(styles).toContain('[data-quality-sensitive]{opacity:.42}');
      expect(styles).toContain(':host([quality="good"]) [data-quality-sensitive]{opacity:1}');
      expect(styles).not.toContain('[data-state~="warning"]');
      expect(styles).not.toContain('[data-state~="bad-quality"]');
    }
  });

  test('does not use infinite alarm attention loops', () => {
    for (const definition of definitions) {
      const alarmLoops = (definition.motions ?? []).filter(
        (motion) => motion.type === 'loop' && motion.id.includes('alarm'),
      );
      expect(alarmLoops).toHaveLength(0);
    }
  });
});
