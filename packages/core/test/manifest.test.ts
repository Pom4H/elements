import { describe, expect, test } from 'bun:test';
import { createElementsManifest, ELEMENTS_MANIFEST_SCHEMA_VERSION, type ElementsManifestEntry } from '../src/manifest.js';

const entry = {
  tagName: 'pe-test',
  name: 'Test element',
  viewBox: '0 0 100 100',
  dynamicViewBox: false,
  attributes: [{ name: 'label', property: 'label', kind: 'string', default: '' }],
  states: ['active'],
  parts: [{ name: 'body', detail: 'essential' }],
  ports: [{ id: 'in', x: 0, y: 50, direction: 'left', kind: 'process' }],
  dynamicPorts: false,
  motions: [{ id: 'pulse', type: 'transition', target: 'body' }],
  composition: ['assembly'],
} satisfies ElementsManifestEntry;

describe('Elements manifest contract', () => {
  test('publishes an explicit schema and package identity', () => {
    const manifest = createElementsManifest({ name: '@example/elements', version: '1.2.3', elements: [entry] });
    expect(manifest.schemaVersion).toBe(ELEMENTS_MANIFEST_SCHEMA_VERSION);
    expect(manifest.name).toBe('@example/elements');
    expect(manifest.version).toBe('1.2.3');
    expect(manifest.elements[0]?.tagName).toBe('pe-test');
  });

  test('rejects duplicate public identifiers', () => {
    expect(() => createElementsManifest({ name: 'x', version: '1', elements: [entry, entry] })).toThrow('Duplicate manifest tag name: pe-test');
    expect(() => createElementsManifest({
      name: 'x',
      version: '1',
      elements: [{ ...entry, ports: [entry.ports[0]!, entry.ports[0]!] }],
    })).toThrow('Duplicate pe-test port: in');
  });

  test('rejects invalid custom element names', () => {
    expect(() => createElementsManifest({ name: 'x', version: '1', elements: [{ ...entry, tagName: 'pump' }] }))
      .toThrow('Invalid custom element tag name in manifest: pump');
  });
});
