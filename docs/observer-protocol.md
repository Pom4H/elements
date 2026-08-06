# Observer-dependent representation protocol

Elements separates two decisions that are often mixed together:

1. **representation fidelity** — what model of the object is relevant to the observer;
2. **visual detail** — how much of that model fits into the available pixels.

A plant overview may use a symbolic pump even on a large display. A maintenance engineer may request the digital-twin representation on a small tablet, while `detail="auto"` still hides labels that do not fit.

## Observer context

Any ancestor can provide context by adding `data-elements-observer` and observer attributes:

```html
<section
  data-elements-observer
  observer-role="operator"
  observer-intent="monitor"
  observer-scale="system">
  <pe-pump status="normal" value="6.2" unit="bar"></pe-pump>
</section>
```

Supported dimensions:

| Dimension | Values |
| --- | --- |
| role | `viewer`, `operator`, `maintenance`, `engineer`, `installer`, `simulator` |
| intent | `overview`, `monitor`, `operate`, `diagnose`, `configure`, `install`, `simulate` |
| scale | `plant`, `system`, `equipment`, `component` |
| fidelity | `auto`, `symbol`, `operational`, `structural`, `twin` |
| capabilities | comma- or space-separated capability identifiers |

The closest provider wins. Attributes on the element itself override inherited values.

## Representation spectrum

The default spectrum is:

```text
symbol → operational → structural → twin
```

The automatic resolver selects the richest representation required by role, intent or scale, but never selects a representation whose declared capabilities are unavailable.

An element can force a representation independently of the observer:

```html
<pe-pump representation="twin" detail="full"></pe-pump>
```

`representation="twin"` selects the semantic model. `detail="full"` prevents pixel-driven visual reduction.

## Custom representations

Definitions may replace the default spectrum:

```ts
const valve = defineElementDefinition({
  // ...
  representations: [
    {
      id: 'pid-symbol',
      label: 'P&ID symbol',
      fidelity: 'symbol',
      preserves: ['identity', 'status', 'ports'],
    },
    {
      id: 'service-cutaway',
      label: 'Service cutaway',
      fidelity: 'structural',
      preserves: ['composition', 'interfaces', 'ports'],
    },
    {
      id: 'physical-twin',
      label: 'Physical twin',
      fidelity: 'twin',
      requires: ['geometry-3d'],
      preserves: ['geometry', 'kinematics', 'telemetry', 'ports'],
    },
  ],
});
```

Collection callbacks, bindings, derived states and dynamic view boxes receive both `context.observer` and `context.representation`. A definition can therefore mount entirely different keyed fragments for a symbol, a service diagram and a physical twin while retaining one public attribute and port contract.

## Fidelity-aware parts

Parts may declare the minimum semantic fidelity at which they exist:

```ts
parts: [
  { name: 'housing', detail: 'essential' },
  { name: 'bearing', minimumFidelity: 'structural' },
  { name: 'impeller-clearance', minimumFidelity: 'twin' },
]
```

The runtime annotates matching SVG nodes with `data-min-fidelity` and hides them below that representation. Authors may also place `data-min-fidelity` directly in trusted SVG templates.

## Runtime observability

Every element exposes:

```ts
element.observerContext
element.activeRepresentation
```

It also reflects the result to:

```text
data-representation
data-representation-fidelity
data-observer-role
data-observer-intent
data-observer-scale
```

A representation switch emits `elements-representation-change`. Ordinary `elements-update` events include the resolved observer and representation as well.

## Manifest contract

Manifest entries use protocol identifier `elements/observer-v1` and include:

- available representations;
- preserved invariants;
- required capabilities;
- inherited observer attributes;
- the per-element `representation` override.

This allows editors, registries and agents to choose an appropriate model before importing the browser runtime.
