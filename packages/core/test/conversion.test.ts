import { describe, expect, test } from 'bun:test';
import { attribute } from '../src/attributes.js';
import { defineElementDefinition } from '../src/definition.js';
import { conversionCandidate, conversionCandidates } from '../src/editing/conversion.js';
import { svg } from '../src/template.js';

const template = svg`<g data-part="body"/>`;

const pump = defineElementDefinition({
  tagName: 'test-pump',
  displayName: 'Pump',
  viewBox: '0 0 100 100',
  template,
  attributes: {
    label: attribute.string('label', { defaultValue: 'P' }),
    running: attribute.boolean('running'),
    speed: attribute.number('speed', { defaultValue: 0, unit: 'rpm' }),
  },
  ports: [
    { id: 'in', x: 0, y: 50, direction: 'left', kind: 'process', role: 'inlet' },
    { id: 'out', x: 100, y: 50, direction: 'right', kind: 'process', role: 'outlet' },
    { id: 'power', x: 50, y: 0, direction: 'top', kind: 'electrical', role: 'inlet' },
  ],
});

const valve = defineElementDefinition({
  tagName: 'test-valve',
  displayName: 'Valve',
  viewBox: '0 0 100 100',
  template,
  attributes: {
    label: attribute.string('label', { defaultValue: 'V' }),
    // Same name, different kind: an editor cannot carry this across.
    running: attribute.string('running'),
    position: attribute.number('position', { defaultValue: 0, unit: '%' }),
  },
  ports: [
    { id: 'in', x: 0, y: 50, direction: 'left', kind: 'process', role: 'inlet' },
    { id: 'out', x: 100, y: 50, direction: 'right', kind: 'process', role: 'outlet' },
  ],
});

const display = defineElementDefinition({
  tagName: 'test-display',
  displayName: 'Display',
  viewBox: '0 0 100 100',
  template,
  attributes: { label: attribute.string('label', { defaultValue: 'D' }) },
  ports: [{ id: 'signal', x: 0, y: 50, direction: 'left', kind: 'signal', role: 'inlet' }],
});

describe('conversion candidates', () => {
  test('maps ports the target can honour and names the ones it cannot', () => {
    const candidate = conversionCandidate(pump, valve);
    expect(candidate.portMapping).toEqual({ in: 'in', out: 'out' });
    expect(candidate.droppedPorts).toEqual(['power']);
  });

  test('carries attributes that share a name and a kind', () => {
    const candidate = conversionCandidate(pump, valve);
    expect(candidate.carriedAttributes).toEqual(['label']);
    // `running` exists on both but as a string rather than a boolean.
    expect(candidate.droppedAttributes).toEqual(['running', 'speed']);
  });

  test('is lossless only when nothing in use is dropped', () => {
    expect(conversionCandidate(pump, valve, ['in', 'out']).lossless).toBe(true);
    expect(conversionCandidate(pump, valve, ['in', 'power']).lossless).toBe(false);
  });

  test('matches by domain and role when ids differ', () => {
    const renamed = defineElementDefinition({
      ...valve,
      tagName: 'test-renamed',
      ports: [
        { id: 'suction', x: 0, y: 50, direction: 'left', kind: 'process', role: 'inlet' },
        { id: 'discharge', x: 100, y: 50, direction: 'right', kind: 'process', role: 'outlet' },
      ],
    });
    expect(conversionCandidate(pump, renamed).portMapping)
      .toEqual({ in: 'suction', out: 'discharge' });
  });

  test('never maps two source ports onto the same target port', () => {
    const single = defineElementDefinition({
      ...valve,
      tagName: 'test-single',
      ports: [{ id: 'only', x: 0, y: 50, direction: 'left', kind: 'process', role: 'bidirectional' }],
    });
    const candidate = conversionCandidate(pump, single);
    expect(Object.keys(candidate.portMapping)).toHaveLength(1);
    expect(candidate.droppedPorts).toHaveLength(2);
  });

  test('ranks lossless replacements first and omits elements sharing no port', () => {
    const candidates = conversionCandidates(pump, {
      registry: [pump, valve, display],
      usedPorts: ['in', 'out'],
    });
    expect(candidates.map((entry) => entry.tagName)).toEqual(['test-valve']);
  });

  test('offers a lossy replacement when the ports in use would survive nowhere', () => {
    const candidates = conversionCandidates(pump, {
      registry: [valve, display],
      usedPorts: ['power'],
    });
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.lossless).toBe(false);
  });
});
